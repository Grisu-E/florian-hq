-- =====================================================================
--  Florian HQ – Erweiterung v2: Zu-/Absage, Mängel, Push-Benachrichtigungen
--  Nach schema.sql einmal ausführen. Kann erneut ausgeführt werden.
-- =====================================================================

-- ---------- Zu-/Absage für Übungsdienste ------------------------------
create table if not exists public.duty_rsvp (
  duty_id    uuid not null references public.duties(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status     text not null check (status in ('yes','maybe','no')),
  note       text default '',
  updated_at timestamptz not null default now(),
  primary key (duty_id, user_id)
);
alter table public.duty_rsvp enable row level security;
drop policy if exists duty_rsvp_read on public.duty_rsvp;
create policy duty_rsvp_read on public.duty_rsvp for select to authenticated using (public.is_member());
drop policy if exists duty_rsvp_insert on public.duty_rsvp;
create policy duty_rsvp_insert on public.duty_rsvp for insert to authenticated with check (public.is_member() and user_id = auth.uid());
drop policy if exists duty_rsvp_update on public.duty_rsvp;
create policy duty_rsvp_update on public.duty_rsvp for update to authenticated using (user_id = auth.uid()) with check (public.is_member() and user_id = auth.uid());
drop policy if exists duty_rsvp_delete on public.duty_rsvp;
create policy duty_rsvp_delete on public.duty_rsvp for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Mängelmeldungen -------------------------------------------
create table if not exists public.defects (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references public.items(id) on delete set null,
  item_name   text not null,
  title       text not null,
  description text default '',
  urgency     text not null default 'normal' check (urgency in ('normal','dringend','ausser_dienst')),
  status      text not null default 'offen' check (status in ('offen','in_arbeit','erledigt')),
  status_note text default '',
  done_by     uuid references public.profiles(id) on delete set null,
  done_at     timestamptz,
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.defects enable row level security;
drop policy if exists defects_read on public.defects;
create policy defects_read on public.defects for select to authenticated using (public.is_member());
drop policy if exists defects_insert on public.defects;
create policy defects_insert on public.defects for insert to authenticated with check (public.is_member() and created_by = auth.uid());
drop policy if exists defects_update on public.defects;
create policy defects_update on public.defects for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists defects_delete on public.defects;
create policy defects_delete on public.defects for delete to authenticated using (public.is_admin());

-- ---------- Push-Abos ---------------------------------------------------
create table if not exists public.push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  prefs      jsonb not null default '{"news":true,"aktive":true,"jugend":true,"events":true,"defects":true}',
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());

-- Live-Aktualisierung für die neuen Tabellen
do $$
declare t text;
begin
  foreach t in array array['duty_rsvp','defects'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- Push: interne Konfiguration (nicht über die API erreichbar) ----
create extension if not exists pg_net with schema extensions;
create schema if not exists fhq_private;
revoke all on schema fhq_private from public, anon, authenticated;
create table if not exists fhq_private.push_config (
  id            int primary key default 1 check (id = 1),
  function_url  text not null,
  hook_secret   text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  vapid_public  text,
  vapid_private text
);
insert into fhq_private.push_config (id, function_url)
values (1, 'https://kdqtfbhwjqymfbaunkwg.supabase.co/functions/v1/push')
on conflict (id) do nothing;

-- Nur die Edge Function (service_role) darf Konfiguration lesen/setzen und Empfänger abfragen
create or replace function public.fhq_push_config()
returns table (hook_secret text, vapid_public text, vapid_private text)
language sql security definer set search_path = fhq_private, public as $$
  select hook_secret, vapid_public, vapid_private from fhq_private.push_config where id = 1;
$$;
create or replace function public.fhq_set_vapid(pub text, priv text) returns void
language sql security definer set search_path = fhq_private, public as $$
  update fhq_private.push_config set vapid_public = pub, vapid_private = priv where id = 1 and vapid_public is null;
$$;
create or replace function public.fhq_push_targets(cat text, excl uuid, admin_only boolean)
returns setof public.push_subs
language sql security definer set search_path = public as $$
  select s.* from public.push_subs s join public.profiles p on p.id = s.user_id
  where p.role in ('member','admin')
    and (not admin_only or p.role = 'admin')
    and (excl is null or s.user_id <> excl)
    and coalesce((s.prefs ->> cat)::boolean, true);
$$;
revoke all on function public.fhq_push_config() from public, anon, authenticated;
revoke all on function public.fhq_set_vapid(text, text) from public, anon, authenticated;
revoke all on function public.fhq_push_targets(text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.fhq_push_config() to service_role;
grant execute on function public.fhq_set_vapid(text, text) to service_role;
grant execute on function public.fhq_push_targets(text, uuid, boolean) to service_role;

-- Bei neuen Einträgen die Edge Function anstoßen
create or replace function public.fhq_notify() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; payload jsonb;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  if tg_table_name = 'news' then
    payload := jsonb_build_object('category','news','title','Neu in der Wehr','body',new.title,'url','#news','adminOnly',false);
  elsif tg_table_name = 'duties' then
    payload := jsonb_build_object('category',new.grp,
      'title', case when new.grp = 'jugend' then 'Neuer Dienst – Jugend' else 'Neuer Dienst – Aktive' end,
      'body', to_char(new.date,'DD.MM.YYYY') || ', ' || new.time || ' Uhr: ' || new.topic,
      'url', '#duty-' || new.grp, 'adminOnly', false);
  elsif tg_table_name = 'events' then
    payload := jsonb_build_object('category','events','title','Neue Veranstaltung',
      'body', to_char(new.date,'DD.MM.YYYY') || ': ' || new.title, 'url','#events','adminOnly',false);
  elsif tg_table_name = 'defects' then
    payload := jsonb_build_object('category','defects',
      'title', case new.urgency when 'ausser_dienst' then 'Mangel – außer Dienst!' when 'dringend' then 'Dringender Mangel' else 'Neuer Mangel' end,
      'body', new.item_name || ': ' || new.title, 'url','#defects','adminOnly',true);
  else
    return new;
  end if;
  payload := payload || jsonb_build_object('exclude', new.created_by);
  perform net.http_post(
    url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := payload);
  return new;
exception when others then
  return new; -- Push darf das Speichern nie verhindern
end $$;
revoke all on function public.fhq_notify() from public, anon, authenticated;

drop trigger if exists fhq_notify_news on public.news;
create trigger fhq_notify_news after insert on public.news for each row execute function public.fhq_notify();
drop trigger if exists fhq_notify_duties on public.duties;
create trigger fhq_notify_duties after insert on public.duties for each row execute function public.fhq_notify();
drop trigger if exists fhq_notify_events on public.events;
create trigger fhq_notify_events after insert on public.events for each row execute function public.fhq_notify();
drop trigger if exists fhq_notify_defects on public.defects;
create trigger fhq_notify_defects after insert on public.defects for each row execute function public.fhq_notify();
