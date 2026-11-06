-- =====================================================================
--  Florian HQ – Erweiterung v9: Zuständigkeiten
--  1) Rollen per Namensliste (mehrere Namen je Rolle, auch für noch nicht Registrierte)
--  2) Mehrere Verantwortliche je Reservierungs-Bereich
-- =====================================================================

-- ---------- 1) Rollen-Zuordnung ----------
create table if not exists public.role_assign (
  id         uuid primary key default gen_random_uuid(),
  fn         text not null check (fn in ('master','kommandant','gruppenfuehrer','geraetewart','kassier')),
  name       text not null check (length(trim(name)) between 2 and 60),
  user_id    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists role_assign_uniq on public.role_assign (fn, lower(trim(name)));
alter table public.role_assign enable row level security;
drop policy if exists role_assign_read on public.role_assign;
create policy role_assign_read on public.role_assign for select to authenticated using (public.is_member());

-- Funktionen/Master eines Profils aus der Zuordnung ableiten
create or replace function public.fhq_sync_roles(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f text[]; m boolean; cur text;
begin
  if uid is null then return; end if;
  select coalesce(array_agg(distinct fn) filter (where fn <> 'master'), '{}'), bool_or(fn = 'master')
    into f, m from public.role_assign where user_id = uid;
  select role into cur from public.profiles where id = uid;
  update public.profiles set functions = coalesce(f,'{}'), treasurer = ('kassier' = any(coalesce(f,'{}'))),
    role = case when coalesce(m,false) and cur in ('member','admin') then 'admin'
                when not coalesce(m,false) and cur = 'admin' then 'member' else cur end
  where id = uid;
end $$;
revoke all on function public.fhq_sync_roles(uuid) from public, anon, authenticated;

-- passende freigeschaltete Person zu einem Namen
create or replace function public.fhq_find_member(nm text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where role in ('member','admin') and lower(trim(name)) = lower(trim(nm)) limit 1;
$$;
revoke all on function public.fhq_find_member(text) from public, anon, authenticated;

create or replace function public.assign_add(f text, nm text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Nur der App-Master darf Rollen vergeben'; end if;
  uid := public.fhq_find_member(nm);
  if f = 'master' and uid is null then raise exception 'App-Master geht nur für bereits freigeschaltete Mitglieder (Name genau wie in der App)'; end if;
  insert into public.role_assign(fn, name, user_id) values (f, trim(nm), uid);
  perform public.fhq_sync_roles(uid);
exception when unique_violation then raise exception '% ist hier schon eingetragen', trim(nm);
end $$;
create or replace function public.assign_remove(aid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.is_admin() then raise exception 'Nur der App-Master darf Rollen ändern'; end if;
  select * into r from public.role_assign where id = aid;
  if r.fn = 'master' and r.user_id = auth.uid() then raise exception 'Du kannst dir die Master-Rechte nicht selbst entziehen'; end if;
  if r.fn = 'master' and (select count(*) from public.role_assign where fn = 'master' and user_id is not null) <= 1 then
    raise exception 'Mindestens ein App-Master muss bleiben'; end if;
  delete from public.role_assign where id = aid;
  perform public.fhq_sync_roles(r.user_id);
end $$;
revoke all on function public.assign_add(text, text) from public, anon;
revoke all on function public.assign_remove(uuid) from public, anon;
grant execute on function public.assign_add(text, text) to authenticated;
grant execute on function public.assign_remove(uuid) to authenticated;

-- Funktionen-Chips in der Mitgliederliste schreiben jetzt auch in die Zuordnung
create or replace function public.set_functions(target uuid, fns text[]) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if not public.is_admin() then raise exception 'Nur der App-Master darf Funktionen vergeben'; end if;
  select name into nm from public.profiles where id = target;
  delete from public.role_assign where user_id = target and fn <> 'master' and not (fn = any(coalesce(fns,'{}')));
  insert into public.role_assign(fn, name, user_id)
    select x, coalesce(nm,'?'), target from unnest(coalesce(fns,'{}')) x
    where not exists (select 1 from public.role_assign a where a.user_id = target and a.fn = x)
  on conflict do nothing;
  update public.role_assign set user_id = target where user_id is null and lower(trim(name)) = lower(trim(nm)) and fn = any(coalesce(fns,'{}'));
  perform public.fhq_sync_roles(target);
end $$;
create or replace function public.set_treasurer(target uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
declare f text[];
begin
  select functions into f from public.profiles where id = target;
  f := array_remove(coalesce(f,'{}'), 'kassier'); if flag then f := array_append(f, 'kassier'); end if;
  perform public.set_functions(target, f);
end $$;

-- Freigeben / Master: Zuordnung wird mitgepflegt, Vormerkungen werden bei Freigabe übernommen
create or replace function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
declare cur text; nm text;
begin
  if new_role not in ('pending','member','admin') then raise exception 'Unbekannte Rolle'; end if;
  select role, name into cur, nm from public.profiles where id = target;
  if (new_role = 'admin' or cur = 'admin') and not public.is_admin() then raise exception 'Nur der App-Master darf Master-Rechte vergeben'; end if;
  if not public.can_cmd() then raise exception 'Nur Kommandant oder App-Master dürfen Mitglieder freigeben'; end if;
  if new_role <> 'admin' and cur = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Mindestens ein App-Master muss bleiben';
  end if;
  update public.profiles set role = new_role where id = target;
  if new_role = 'admin' then
    insert into public.role_assign(fn, name, user_id) select 'master', coalesce(nm,'?'), target
      where not exists (select 1 from public.role_assign where fn = 'master' and user_id = target) on conflict do nothing;
  elsif cur = 'admin' then
    delete from public.role_assign where fn = 'master' and user_id = target;
  end if;
  if new_role in ('member','admin') then
    update public.role_assign set user_id = target where user_id is null and fn <> 'master' and lower(trim(name)) = lower(trim(nm));
  end if;
  if new_role = 'pending' then
    perform 1; -- gesperrt: Funktionen bleiben vorgemerkt, wirken aber nicht (has_fn prüft die Rolle)
  else
    perform public.fhq_sync_roles(target);
  end if;
end $$;

-- Bestehende Master in die Liste übernehmen
insert into public.role_assign(fn, name, user_id)
  select 'master', coalesce(name,'?'), id from public.profiles p where role = 'admin'
    and not exists (select 1 from public.role_assign a where a.fn = 'master' and a.user_id = p.id)
on conflict do nothing;
insert into public.role_assign(fn, name, user_id)
  select f, coalesce(p.name,'?'), p.id from public.profiles p, unnest(p.functions) f
    where not exists (select 1 from public.role_assign a where a.fn = f and a.user_id = p.id)
on conflict do nothing;

-- ---------- 2) Mehrere Verantwortliche je Reservierungs-Bereich ----------
alter table public.res_contacts add column if not exists id uuid not null default gen_random_uuid();
alter table public.res_contacts add column if not exists name text not null default '' check (length(name) <= 60);
alter table public.res_contacts drop constraint if exists res_contacts_pkey;
alter table public.res_contacts add primary key (id);
create index if not exists res_contacts_key on public.res_contacts (key);

create or replace function public.fhq_notify_res() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; ids jsonb; who text; title text; body text;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  if tg_table_name = 'reservations' then
    select coalesce(jsonb_agg(distinct user_id), '[]'::jsonb) into ids from public.res_contacts
      where user_id is not null and user_id <> new.created_by
        and key = case when exists (select 1 from public.res_contacts where key = new.item_id::text and user_id is not null)
                       then new.item_id::text else new.cat end;
    title := 'Neue Reservierung: ' || new.item_name;
    body  := to_char(new.starts,'DD.MM. HH24:MI') || '–' ||
             case when new.starts::date = new.ends::date then to_char(new.ends,'HH24:MI') else to_char(new.ends,'DD.MM. HH24:MI') end
             || ' Uhr · ' || new.purpose;
  else
    select coalesce(jsonb_agg(distinct user_id), '[]'::jsonb) into ids from public.res_contacts
      where key = 'eis' and user_id is not null and user_id <> new.created_by;
    title := 'Crushed-Eis angemeldet';
    body  := new.bags || ' Säcke · ' || to_char(new.date,'DD.MM.') || ' ab ' || new.time || ' Uhr · ' || new.purpose;
  end if;
  if jsonb_array_length(ids) = 0 then return new; end if;
  select name into who from public.profiles where id = new.created_by;
  perform net.http_post(url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('category','reservations','title', title,
      'body', coalesce(who,'Jemand') || ': ' || body, 'url','#home','userIds', ids));
  return new;
exception when others then
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='role_assign') then
    alter publication supabase_realtime add table public.role_assign;
  end if;
end $$;
