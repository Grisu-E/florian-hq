-- =====================================================================
--  Florian HQ – Erweiterung v4: Private Ausgaben (Auslagen-Erstattung)
--  Jeder trägt eigene Auslagen ein und sieht nur diese. Der Kassier sieht alle
--  und markiert sie als erstattet. Wer Kassier ist, legen Bearbeiter fest.
-- =====================================================================

alter table public.profiles add column if not exists treasurer boolean not null default false;
-- (Nutzer dürfen über die API weiterhin nur ihren Namen ändern – Spaltenrechte bleiben unverändert)

create or replace function public.is_treasurer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and treasurer and role in ('member','admin'));
$$;

create or replace function public.set_treasurer(target uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Nur Bearbeiter dürfen den Kassier festlegen'; end if;
  update public.profiles set treasurer = flag where id = target;
end $$;
revoke all on function public.set_treasurer(uuid, boolean) from public, anon;
grant execute on function public.set_treasurer(uuid, boolean) to authenticated;

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  spent_on     date not null,
  amount       numeric(10,2) not null check (amount > 0 and amount < 100000),
  purpose      text not null,
  receipt_path text,
  status       text not null default 'offen' check (status in ('offen','erstattet','abgelehnt')),
  status_note  text default '',
  paid_by      uuid references public.profiles(id) on delete set null,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.expenses enable row level security;
drop policy if exists expenses_read on public.expenses;
create policy expenses_read on public.expenses for select to authenticated
  using (user_id = auth.uid() or public.is_treasurer());
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated
  with check (public.is_member() and user_id = auth.uid() and status = 'offen');
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update to authenticated
  using (public.is_treasurer()) with check (public.is_treasurer());
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete to authenticated
  using ((user_id = auth.uid() and status = 'offen') or public.is_treasurer());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
end $$;

-- Belegfotos: privater Speicher, Ordner je Person
insert into storage.buckets (id, name, public) values ('belege', 'belege', false) on conflict (id) do nothing;
drop policy if exists belege_read on storage.objects;
create policy belege_read on storage.objects for select to authenticated
  using (bucket_id = 'belege' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_treasurer()));
drop policy if exists belege_upload on storage.objects;
create policy belege_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'belege' and public.is_member() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists belege_delete on storage.objects;
create policy belege_delete on storage.objects for delete to authenticated
  using (bucket_id = 'belege' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_treasurer()));

-- Push: neue Ausgabe → Kassier; erstattet/abgelehnt → einreichende Person
create or replace function public.fhq_notify_expense() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; ids jsonb; who text; amt text;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  amt := replace(to_char(new.amount, 'FM999G990D00'), ',', '#');
  amt := replace(replace(amt, '.', ','), '#', '.') || ' €';
  if tg_op = 'INSERT' then
    select coalesce(jsonb_agg(id), '[]'::jsonb) into ids from public.profiles
      where treasurer and role in ('member','admin') and id <> new.user_id;
    if jsonb_array_length(ids) = 0 then return new; end if;
    select name into who from public.profiles where id = new.user_id;
    perform net.http_post(url := c.function_url,
      headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
      body := jsonb_build_object('category','expenses','title','Neue Ausgabe zur Erstattung',
        'body', coalesce(who,'Jemand') || ': ' || amt || ' – ' || new.purpose, 'url','#expenses','userIds', ids));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('erstattet','abgelehnt') then
    perform net.http_post(url := c.function_url,
      headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
      body := jsonb_build_object('category','expenses',
        'title', case when new.status = 'erstattet' then 'Ausgabe erstattet' else 'Ausgabe abgelehnt' end,
        'body', amt || ' – ' || new.purpose, 'url','#expenses','userIds', jsonb_build_array(new.user_id)));
  end if;
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.fhq_notify_expense() from public, anon, authenticated;
drop trigger if exists fhq_notify_expenses on public.expenses;
create trigger fhq_notify_expenses after insert or update on public.expenses
  for each row execute function public.fhq_notify_expense();
