-- Stallwache – Hühnerstall-Überwachung (Supabase-Projekt florian-hq, Präfix hs_)

-- ───────── Mitglieder & Freigaben (wie H&E Hub) ─────────
create table if not exists public.hs_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text, name text,
  role text not null default 'member',
  status text not null default 'pending',
  tiles jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hs_members enable row level security;

create or replace function public.hs_members_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := (select email from auth.users where id = new.user_id);
  if not exists (select 1 from public.hs_members) then
    new.role := 'admin'; new.status := 'approved';
  else
    new.role := 'member'; new.status := 'pending'; new.tiles := '{}'::jsonb;
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists hs_members_bi on public.hs_members;
create trigger hs_members_bi before insert on public.hs_members for each row execute function public.hs_members_before_insert();

create or replace function public.hs_level(t text) returns text
language sql stable security definer set search_path = public as $$
  select case when m.role = 'admin' then 'edit' else coalesce(m.tiles->>t, 'none') end
  from public.hs_members m where m.user_id = auth.uid() and m.status = 'approved'
$$;
create or replace function public.hs_can_view(t text) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce(public.hs_level(t) in ('view','edit'), false) $$;
create or replace function public.hs_can_edit(t text) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce(public.hs_level(t) = 'edit', false) $$;
create or replace function public.hs_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.hs_members where user_id = auth.uid() and role = 'admin' and status = 'approved')
$$;
create or replace function public.hs_name(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(name,''), split_part(email,'@',1), 'Jemand') from public.hs_members where user_id = u
$$;
create or replace function public.hs_names() returns table(user_id uuid, name text)
language sql stable security definer set search_path = public as $$
  select m.user_id, coalesce(nullif(m.name,''), split_part(m.email,'@',1)) from public.hs_members m
  where m.status = 'approved' and exists(select 1 from public.hs_members me where me.user_id = auth.uid() and me.status = 'approved')
$$;

drop policy if exists hs_members_select on public.hs_members;
drop policy if exists hs_members_insert on public.hs_members;
drop policy if exists hs_members_update on public.hs_members;
drop policy if exists hs_members_delete on public.hs_members;
create policy hs_members_select on public.hs_members for select to authenticated using (user_id = auth.uid() or public.hs_is_admin());
create policy hs_members_insert on public.hs_members for insert to authenticated with check (user_id = auth.uid());
create policy hs_members_update on public.hs_members for update to authenticated using (public.hs_is_admin()) with check (public.hs_is_admin());
create policy hs_members_delete on public.hs_members for delete to authenticated using (public.hs_is_admin() and user_id <> auth.uid());

-- ───────── Tagebuch: Eier, Pflege, Herde, Gesundheit ─────────
create table if not exists public.hs_items (
  id uuid primary key default gen_random_uuid(),
  tile text not null, kind text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(), updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists hs_items_tile_idx on public.hs_items(tile, kind);
alter table public.hs_items enable row level security;
create or replace function public.hs_items_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.created_by := auth.uid(); new.created_at := now(); end if;
  new.updated_by := auth.uid(); new.updated_at := now();
  return new;
end $$;
drop trigger if exists hs_items_stamp on public.hs_items;
create trigger hs_items_stamp before insert or update on public.hs_items for each row execute function public.hs_items_stamp();
drop policy if exists hs_items_select on public.hs_items;
drop policy if exists hs_items_insert on public.hs_items;
drop policy if exists hs_items_update on public.hs_items;
drop policy if exists hs_items_delete on public.hs_items;
create policy hs_items_select on public.hs_items for select to authenticated using (public.hs_can_view(tile));
create policy hs_items_insert on public.hs_items for insert to authenticated with check (public.hs_can_edit(tile));
create policy hs_items_update on public.hs_items for update to authenticated using (public.hs_can_edit(tile)) with check (public.hs_can_edit(tile));
create policy hs_items_delete on public.hs_items for delete to authenticated using (public.hs_can_edit(tile));

-- ───────── Einstellungen (Zeiten, Alarm, Pflege-Intervalle) ─────────
create table if not exists public.hs_config (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_by uuid, updated_at timestamptz not null default now()
);
alter table public.hs_config enable row level security;
insert into public.hs_config(id, data) values (1, '{
  "steuerung": "logo",
  "zeitart": "sonne",
  "auf_fix": "07:00", "zu_fix": "20:00",
  "auf_offset": 30, "zu_offset": 20,
  "auf_frueheste": "06:30", "zu_spaeteste": "22:00",
  "alarm_min": 30,
  "lat": 47.67, "lon": 9.59,
  "pflege": [
    {"key":"futter","name":"Futter nachfüllen","tage":7},
    {"key":"wasser","name":"Wasser wechseln","tage":2},
    {"key":"ausmisten","name":"Ausmisten","tage":14},
    {"key":"einstreu","name":"Einstreu erneuern","tage":14},
    {"key":"milben","name":"Milbenkontrolle","tage":30}
  ]
}'::jsonb) on conflict (id) do nothing;
create or replace function public.hs_config_stamp() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_by := auth.uid(); new.updated_at := now(); new.id := 1; return new; end $$;
drop trigger if exists hs_config_stamp on public.hs_config;
create trigger hs_config_stamp before update on public.hs_config for each row execute function public.hs_config_stamp();
drop policy if exists hs_config_select on public.hs_config;
drop policy if exists hs_config_update on public.hs_config;
create policy hs_config_select on public.hs_config for select to authenticated using (public.hs_can_view('klappe') or public.hs_can_view('pflege'));
create policy hs_config_update on public.hs_config for update to authenticated using (public.hs_can_edit('klappe')) with check (public.hs_can_edit('klappe'));

-- ───────── Zustand vom Stall (schreibt nur die Brücke) ─────────
create table if not exists public.hs_state (
  id int primary key default 1 check (id = 1),
  door text not null default 'unbekannt',
  io jsonb not null default '{}'::jsonb,
  info jsonb not null default '{}'::jsonb,
  last_seen timestamptz,
  changed_at timestamptz,
  live_until timestamptz,
  snaps jsonb not null default '{}'::jsonb,
  offline_notified boolean not null default false
);
alter table public.hs_state enable row level security;
insert into public.hs_state(id) values (1) on conflict (id) do nothing;
drop policy if exists hs_state_select on public.hs_state;
create policy hs_state_select on public.hs_state for select to authenticated using (public.hs_can_view('klappe') or public.hs_can_view('kamera'));

-- ───────── Befehle an die Klappe ─────────
create table if not exists public.hs_commands (
  id bigint generated always as identity primary key,
  cmd text not null check (cmd in ('open','close')),
  status text not null default 'pending',
  created_by uuid, created_at timestamptz not null default now(),
  taken_at timestamptz, done_at timestamptz, result text
);
create index if not exists hs_commands_status_idx on public.hs_commands(status, created_at);
alter table public.hs_commands enable row level security;
drop policy if exists hs_commands_select on public.hs_commands;
create policy hs_commands_select on public.hs_commands for select to authenticated using (public.hs_can_view('klappe'));

-- ───────── Protokoll (auf/zu, Alarme, Befehle) ─────────
create table if not exists public.hs_events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  kind text not null,
  text text,
  source text,
  by uuid
);
create index if not exists hs_events_ts_idx on public.hs_events(ts desc);
alter table public.hs_events enable row level security;
drop policy if exists hs_events_select on public.hs_events;
create policy hs_events_select on public.hs_events for select to authenticated using (public.hs_can_view('klappe'));

-- ───────── Push-Abos ─────────
create table if not exists public.hs_push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique, p256dh text not null, auth text not null,
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hs_push_subs enable row level security;
drop policy if exists hs_push_subs_own on public.hs_push_subs;
create policy hs_push_subs_own on public.hs_push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────── Brücken-Geheimnis (nur Hash) ─────────
create table if not exists fhq_private.hs_bridge (
  id int primary key default 1 check (id = 1),
  secret_hash text not null
);
-- Stallwache – Funktionen für App, Brücke, Push und Cron

-- Push über Edge Function hs-push (gleiches Hook-Secret wie Florian HQ / H&E)
create or replace function public.hs_send(p jsonb) returns void
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare sec text;
begin
  select hook_secret into sec from fhq_private.push_config where id = 1;
  if sec is null then return; end if;
  perform net.http_post(
    url := 'https://kdqtfbhwjqymfbaunkwg.supabase.co/functions/v1/hs-push',
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', sec),
    body := p);
exception when others then null;
end $$;

create or replace function public.hs_push_targets(cat text, t text, ids uuid[], excl uuid) returns setof public.hs_push_subs
language sql stable security definer set search_path = public as $$
  select s.* from public.hs_push_subs s join public.hs_members m on m.user_id = s.user_id
  where m.status = 'approved'
    and (t is null or m.role = 'admin' or coalesce(m.tiles->>t, 'none') <> 'none')
    and coalesce((s.prefs->>cat)::boolean, true)
    and (ids is null or s.user_id = any(ids))
    and (excl is null or s.user_id <> excl)
$$;

-- ───────── App: Klappe fahren ─────────
create or replace function public.hs_command(c text) returns bigint
language plpgsql security definer set search_path = public as $$
declare nid bigint;
begin
  if not public.hs_can_edit('klappe') then raise exception 'keine Berechtigung'; end if;
  if c not in ('open','close') then raise exception 'unbekannter Befehl'; end if;
  update public.hs_commands set status = 'replaced', done_at = now() where status = 'pending';
  insert into public.hs_commands(cmd, created_by) values (c, auth.uid()) returning id into nid;
  insert into public.hs_events(kind, text, source, by)
    values ('befehl', public.hs_name(auth.uid()) || ': Klappe ' || case c when 'open' then 'öffnen' else 'schließen' end, 'app', auth.uid());
  return nid;
end $$;

-- ───────── App: Live-Bild anfordern (Pi liefert dann alle paar Sekunden ein Bild) ─────────
create or replace function public.hs_live(sek int default 45) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare bis timestamptz := now() + make_interval(secs => least(greatest(coalesce(sek,45), 5), 90));
begin
  if not public.hs_can_view('kamera') then raise exception 'keine Berechtigung'; end if;
  update public.hs_state set live_until = greatest(coalesce(live_until, now()), bis) where id = 1;
  return bis;
end $$;

-- ───────── Brücke (Raspberry Pi) ─────────
create or replace function public.hs_bridge_check(p_secret text) returns boolean
language sql stable security definer set search_path = public, fhq_private, extensions as $$
  select exists(select 1 from fhq_private.hs_bridge b where b.id = 1
    and b.secret_hash = encode(extensions.digest(coalesce(p_secret,''), 'sha256'), 'hex'))
$$;

-- Ein Aufruf pro Takt: Zustand melden, Ereignisse abliefern, Befehle + Einstellungen abholen
create or replace function public.hs_bridge_sync(p_secret text, p_state jsonb default null, p_events jsonb default '[]'::jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.hs_state; cmds jsonb; e jsonb; neu_door text; neu_io jsonb; neu_info jsonb;
begin
  if not public.hs_bridge_check(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into s from public.hs_state where id = 1 for update;

  if p_state is not null then
    neu_door := coalesce(p_state->>'door', s.door);
    neu_io   := coalesce(p_state->'io', s.io);
    neu_info := coalesce(p_state->'info', s.info);
    -- nur schreiben, wenn sich etwas geändert hat oder last_seen älter als 30 s ist (spart Schreiblast)
    if neu_door is distinct from s.door or neu_io is distinct from s.io or neu_info is distinct from s.info
       or s.last_seen is null or s.last_seen < now() - interval '30 seconds' or s.offline_notified then
      update public.hs_state set door = neu_door, io = neu_io, info = neu_info, last_seen = now(),
        changed_at = case when neu_door is distinct from s.door then now() else changed_at end,
        offline_notified = false
      where id = 1;
      if s.offline_notified then
        insert into public.hs_events(kind, text, source) values ('online', 'Verbindung zum Stall wieder da', 'system');
      end if;
    end if;
  end if;

  for e in select * from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    insert into public.hs_events(kind, text, source)
    values (left(coalesce(e->>'kind','info'), 20), left(e->>'text', 300), left(coalesce(e->>'source','stall'), 40));
  end loop;

  update public.hs_commands set status = 'expired', done_at = now()
    where status = 'pending' and created_at < now() - interval '2 minutes';
  with t as (
    update public.hs_commands set status = 'running', taken_at = now()
    where status = 'pending' returning id, cmd, created_at
  ) select coalesce(jsonb_agg(jsonb_build_object('id', id, 'cmd', cmd, 'by', null) order by created_at), '[]'::jsonb) into cmds from t;

  return jsonb_build_object(
    'commands', cmds,
    'config', (select data from public.hs_config where id = 1),
    'live_until', (select live_until from public.hs_state where id = 1),
    'server_time', now());
end $$;

create or replace function public.hs_bridge_ack(p_secret text, p_id bigint, p_ok boolean, p_result text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.hs_bridge_check(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  update public.hs_commands set status = case when p_ok then 'done' else 'failed' end, done_at = now(), result = left(p_result, 300)
  where id = p_id;
end $$;

-- ───────── Push bei Ereignissen ─────────
create or replace function public.hs_events_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare cat text; titel text;
begin
  if new.kind in ('alarm','fehler') then cat := 'alarm'; titel := case new.kind when 'alarm' then '🚨 Hühnerstall' else '⚠️ Klappe: Fehler' end;
  elsif new.kind in ('offline','online') then cat := 'alarm'; titel := case new.kind when 'offline' then '📡 Stall nicht erreichbar' else '📡 Stall wieder online' end;
  elsif new.kind in ('auf','zu') then cat := 'klappe'; titel := case new.kind when 'auf' then '🐔 Klappe offen' else '🌙 Klappe zu' end;
  else return new; end if;
  perform public.hs_send(jsonb_build_object('category', cat, 'tile', 'klappe', 'exclude', new.by,
    'title', titel, 'body', coalesce(new.text, ''), 'url', './#klappe'));
  return new;
exception when others then return new;
end $$;
drop trigger if exists hs_events_notify on public.hs_events;
create trigger hs_events_notify after insert on public.hs_events for each row execute function public.hs_events_notify();

-- Neue Einträge bei Gesundheit melden
create or replace function public.hs_items_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tile <> 'gesundheit' then return new; end if;
  perform public.hs_send(jsonb_build_object('category','neu','tile', new.tile, 'exclude', new.created_by,
    'title','Neu: Gesundheit', 'body', coalesce(public.hs_name(new.created_by),'Jemand') || ': ' || coalesce(new.data->>'huhn','') || ' – ' || coalesce(new.data->>'titel','Eintrag'),
    'url','./#gesundheit'));
  return new;
exception when others then return new;
end $$;
drop trigger if exists hs_items_notify on public.hs_items;
create trigger hs_items_notify after insert on public.hs_items for each row execute function public.hs_items_notify();

-- ───────── Cron: Brücke offline? (alle 5 Minuten) ─────────
create or replace function public.hs_watchdog() returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.hs_state where id = 1 and last_seen is not null
             and last_seen < now() - interval '10 minutes' and not offline_notified) then
    update public.hs_state set offline_notified = true where id = 1;
    insert into public.hs_events(kind, text, source)
      values ('offline', 'Seit ' || to_char(((select last_seen from public.hs_state where id = 1) at time zone 'Europe/Berlin'), 'HH24:MI') || ' Uhr keine Meldung vom Stall (Pi, Richtfunk oder LOGO prüfen)', 'system');
  end if;
  delete from public.hs_events where ts < now() - interval '180 days';
  delete from public.hs_commands where created_at < now() - interval '30 days';
end $$;

-- ───────── Cron: Pflege-Erinnerungen (täglich) ─────────
create or replace function public.hs_daily() returns void
language plpgsql security definer set search_path = public as $$
declare p jsonb; zuletzt date; heute date := (now() at time zone 'Europe/Berlin')::date; tage int;
begin
  for p in select * from jsonb_array_elements(coalesce((select data->'pflege' from public.hs_config where id = 1), '[]'::jsonb)) loop
    tage := nullif(p->>'tage','')::int;
    if tage is null or tage <= 0 then continue; end if;
    select max((data->>'datum')::date) into zuletzt from public.hs_items
      where tile = 'pflege' and data->>'art' = p->>'key' and (data->>'datum') ~ '^\d{4}-\d{2}-\d{2}$';
    if zuletzt is not null and heute - zuletzt >= tage then
      perform public.hs_send(jsonb_build_object('category','pflege','tile','pflege',
        'title', '🐓 ' || (p->>'name') || ' fällig',
        'body', 'Zuletzt vor ' || (heute - zuletzt) || ' Tagen (' || to_char(zuletzt, 'DD.MM.') || ')', 'url','./#pflege'));
    end if;
  end loop;
end $$;

-- ───────── Rechte: interne Funktionen nicht öffentlich aufrufbar ─────────
revoke all on function public.hs_send(jsonb) from public, anon, authenticated;
revoke all on function public.hs_push_targets(text, text, uuid[], uuid) from public, anon, authenticated;
revoke all on function public.hs_bridge_check(text) from public, anon, authenticated;
revoke all on function public.hs_watchdog() from public, anon, authenticated;
revoke all on function public.hs_daily() from public, anon, authenticated;
revoke all on function public.hs_members_before_insert() from public, anon, authenticated;
revoke all on function public.hs_events_notify() from public, anon, authenticated;
revoke all on function public.hs_items_notify() from public, anon, authenticated;
grant execute on function public.hs_push_targets(text, text, uuid[], uuid) to service_role;
grant execute on function public.hs_bridge_check(text) to service_role;
revoke all on function public.hs_command(text) from public, anon;
revoke all on function public.hs_live(int) from public, anon;
grant execute on function public.hs_command(text) to authenticated;
grant execute on function public.hs_live(int) to authenticated;
-- die Brücke meldet sich mit dem anon-Schlüssel + Geheimnis
revoke all on function public.hs_bridge_sync(text, jsonb, jsonb) from public;
revoke all on function public.hs_bridge_ack(text, bigint, boolean, text) from public;
grant execute on function public.hs_bridge_sync(text, jsonb, jsonb) to anon, authenticated, service_role;
grant execute on function public.hs_bridge_ack(text, bigint, boolean, text) to anon, authenticated, service_role;

-- ───────── Kamera-Bilder ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hs-cam', 'hs-cam', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists hs_cam_select on storage.objects;
create policy hs_cam_select on storage.objects for select to authenticated
  using (bucket_id = 'hs-cam' and public.hs_can_view('kamera'));

-- ───────── Cron-Jobs ─────────
select cron.schedule('hs-watchdog', '*/5 * * * *', 'select public.hs_watchdog()');
select cron.schedule('hs-daily', '11 17 * * *', 'select public.hs_daily()');

-- Nachschärfung der Rechte
revoke all on function public.hs_level(text), public.hs_can_view(text), public.hs_can_edit(text), public.hs_is_admin(), public.hs_names() from public, anon;
grant execute on function public.hs_level(text), public.hs_can_view(text), public.hs_can_edit(text), public.hs_is_admin(), public.hs_names() to authenticated;
revoke all on function public.hs_name(uuid) from public, anon, authenticated;
revoke all on function public.hs_items_stamp(), public.hs_config_stamp() from public, anon, authenticated;

-- Mitglieds-Name aus der Registrierung übernehmen
create or replace function public.hs_members_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select email, nullif(trim(raw_user_meta_data->>'name'), '') into new.email, new.name from auth.users where id = new.user_id;
  if not exists (select 1 from public.hs_members) then
    new.role := 'admin'; new.status := 'approved';
  else
    new.role := 'member'; new.status := 'pending'; new.tiles := '{}'::jsonb;
  end if;
  new.created_at := now();
  return new;
end $$;
-- Brücken-Geheimnis (Hash) setzen:
-- insert into fhq_private.hs_bridge(id, secret_hash) values (1, encode(extensions.digest('GEHEIMNIS','sha256'),'hex'))
--   on conflict (id) do update set secret_hash = excluded.secret_hash;

-- ═══ Ziegentür (v1.1): siehe Migration huehnerhotel_ziegentuer im Supabase-Projekt ═══
-- hs_commands.cmd erlaubt zusätzlich 'unlock'; hs_command('unlock') braucht Bearbeiten-Recht auf Kachel 'ziegen'
-- hs_set_ziegen(z jsonb) setzt nur config.ziegen {modus aus|zeit|an, von, bis, sekunden}
-- hs_bridge_sync liefert zusätzlich 'ziegen': [{name, chip}] aus hs_items (tile 'ziegen')
-- Ereignisse mit kind 'ziege' sind nur mit Ansehen-Recht auf 'ziegen' sichtbar

-- ═══ v1.3: Stallpflicht (hs_set_stallpflicht), Foto beim Schließen (hs_events.bild), Tränke-Heizung (config.traenke),
--     Wetter (Tabelle hs_wetter, Edge Function hs-wetter, Cron hs-wetter / hs-wetter-abend) ═══
