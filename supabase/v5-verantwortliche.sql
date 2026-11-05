-- =====================================================================
--  Florian HQ – Erweiterung v5: Verantwortliche für Reservierungen
--  key = Kategorie ('fahrzeuge','material','raum','fest','eis') oder Item-ID.
--  Ein Eintrag am Item überschreibt den der Kategorie.
--  Alle Mitglieder lesen (für den WhatsApp-Knopf), nur Bearbeiter ändern.
-- =====================================================================

create table if not exists public.res_contacts (
  key        text primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  phone      text not null default '' check (length(phone) <= 30),
  updated_at timestamptz not null default now()
);
alter table public.res_contacts enable row level security;
drop policy if exists res_contacts_read on public.res_contacts;
create policy res_contacts_read on public.res_contacts for select to authenticated using (public.is_member());
drop policy if exists res_contacts_write on public.res_contacts;
create policy res_contacts_write on public.res_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='res_contacts') then
    alter publication supabase_realtime add table public.res_contacts;
  end if;
end $$;

-- Push an die verantwortliche Person bei neuer Reservierung / Eis-Anmeldung
create or replace function public.fhq_notify_res() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; target uuid; who text; title text; body text;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  if tg_table_name = 'reservations' then
    select coalesce((select user_id from public.res_contacts where key = new.item_id::text and user_id is not null),
                    (select user_id from public.res_contacts where key = new.cat)) into target;
    title := 'Neue Reservierung: ' || new.item_name;
    body  := to_char(new.starts,'DD.MM. HH24:MI') || '–' ||
             case when new.starts::date = new.ends::date then to_char(new.ends,'HH24:MI') else to_char(new.ends,'DD.MM. HH24:MI') end
             || ' Uhr · ' || new.purpose;
  else
    select user_id into target from public.res_contacts where key = 'eis';
    title := 'Crushed-Eis angemeldet';
    body  := new.bags || ' Säcke · ' || to_char(new.date,'DD.MM.') || ' ab ' || new.time || ' Uhr · ' || new.purpose;
  end if;
  if target is null or target = new.created_by then return new; end if;
  select name into who from public.profiles where id = new.created_by;
  perform net.http_post(url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('category','reservations','title', title,
      'body', coalesce(who,'Jemand') || ': ' || body, 'url','#home','userIds', jsonb_build_array(target)));
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.fhq_notify_res() from public, anon, authenticated;
drop trigger if exists fhq_notify_reservations on public.reservations;
create trigger fhq_notify_reservations after insert on public.reservations
  for each row execute function public.fhq_notify_res();
drop trigger if exists fhq_notify_ice on public.ice;
create trigger fhq_notify_ice after insert on public.ice
  for each row execute function public.fhq_notify_res();
