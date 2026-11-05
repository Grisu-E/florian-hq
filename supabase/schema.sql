-- =====================================================================
--  Florian HQ – Datenbankschema für Supabase
--  Einmal komplett im Supabase SQL-Editor ausführen (Run).
--  Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

-- ---------- Profile & Rollen -----------------------------------------
-- Rollen:  pending = registriert, wartet auf Freigabe
--          member  = Mitglied (reservieren, eintragen, Listen hochladen)
--          admin   = Bearbeiter (zusätzlich Neues, Dienstpläne,
--                    Veranstaltungen, Organigramm, Mitglieder freigeben)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  role        text not null default 'pending' check (role in ('pending','member','admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('member','admin'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Neues Konto -> Profil anlegen. Das allererste Konto wird automatisch Bearbeiter.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    new.email,
    case when exists(select 1 from public.profiles) then 'pending' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rolle ändern (nur Bearbeiter). Der letzte Bearbeiter kann sich nicht selbst entziehen.
create or replace function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Nur Bearbeiter dürfen Rollen ändern'; end if;
  if new_role not in ('pending','member','admin') then raise exception 'Unbekannte Rolle'; end if;
  if new_role <> 'admin' and (select role from public.profiles where id = target) = 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Mindestens ein Bearbeiter muss bleiben';
  end if;
  update public.profiles set role = new_role where id = target;
end $$;

-- Mitglied entfernen (nur Bearbeiter): Konto wird gelöscht, Einträge bleiben erhalten
create or replace function public.remove_member(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Nur Bearbeiter dürfen Mitglieder entfernen'; end if;
  if target = auth.uid() then raise exception 'Du kannst dich nicht selbst entfernen'; end if;
  delete from auth.users where id = target;
end $$;

alter table public.profiles enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Eigenes Profil: nur der Name ist änderbar, die Rolle nicht
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- ---------- Inhalte ---------------------------------------------------
create table if not exists public.items (            -- Fahrzeuge, Material, Raum, Festzubehör
  id uuid primary key default gen_random_uuid(),
  cat text not null check (cat in ('fahrzeuge','material','raum','fest')),
  name text not null, note text default '',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete set null,
  item_name text not null, cat text not null,
  starts timestamp not null, ends timestamp not null check (ends > starts),
  purpose text not null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ice (               -- Crushed-Eis-Anmeldungen
  id uuid primary key default gen_random_uuid(),
  date date not null, time text not null, bags int not null check (bags > 0),
  purpose text not null, done boolean not null default false,
  done_by uuid references public.profiles(id) on delete set null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.docs (              -- Übungsdoku / Anwesenheitslisten
  id uuid primary key default gen_random_uuid(),
  title text not null, date date not null, note text default '',
  photo_path text, status text not null default 'offen' check (status in ('offen','eingepflegt')),
  done_by uuid references public.profiles(id) on delete set null, done_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null, text text not null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.duties (            -- Dienstpläne Aktive / Jugend
  id uuid primary key default gen_random_uuid(),
  grp text not null check (grp in ('aktive','jugend')),
  date date not null, time text not null, topic text not null,
  place text default '', lead text default '', note text default '',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, date date not null, time text default '',
  place text default '', note text default '',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (            -- Arbeitsdienste je Veranstaltung
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  task text not null, start text not null, "end" text not null, need int not null check (need > 0),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.signups (           -- Eintragungen in Arbeitsdienste
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  name text,                                          -- gesetzt = jemand anderen eingetragen
  created_by uuid default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists signups_self_once on public.signups(shift_id, created_by) where name is null;

create table if not exists public.org (               -- Organigramm
  id uuid primary key default gen_random_uuid(),
  role text not null, name text default '', area text default '',
  phone text default '', email text default '',
  parent_id uuid references public.org(id) on delete set null,
  sort int not null default 0,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Zugriffsregeln (Row Level Security) -----------------------
do $$
declare t text;
begin
  -- Bereiche, in denen alle Mitglieder schreiben
  foreach t in array array['items','reservations','ice','docs','signups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_member())', t||'_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_member() and created_by = auth.uid())', t||'_insert', t);
    execute format('drop policy if exists %I on public.%I', t||'_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_member() and (created_by = auth.uid() or public.is_admin()))', t||'_delete', t);
  end loop;
  -- Bereiche, die nur Bearbeiter ändern
  foreach t in array array['news','duties','events','shifts','org'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_member())', t||'_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_write', t);
  end loop;
end $$;

-- Status-Häkchen setzen dürfen alle Mitglieder (Eis bereitgestellt, Liste eingepflegt)
drop policy if exists ice_update on public.ice;
create policy ice_update on public.ice for update to authenticated using (public.is_member()) with check (public.is_member());
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated using (public.is_member()) with check (public.is_member());
revoke update on public.ice, public.docs from authenticated;
grant update (done, done_by) on public.ice to authenticated;
grant update (status, done_by, done_at) on public.docs to authenticated;

-- Nicht angemeldete Besucher sehen gar nichts
revoke all on all tables in schema public from anon;

-- ---------- Foto-Speicher für Anwesenheitslisten ---------------------
insert into storage.buckets (id, name, public)
values ('listen', 'listen', false)
on conflict (id) do nothing;

drop policy if exists listen_read on storage.objects;
create policy listen_read on storage.objects for select to authenticated
  using (bucket_id = 'listen' and public.is_member());
drop policy if exists listen_upload on storage.objects;
create policy listen_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'listen' and public.is_member());
drop policy if exists listen_delete on storage.objects;
create policy listen_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listen' and (owner = auth.uid() or public.is_admin()));

-- ---------- Live-Aktualisierung --------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles','items','reservations','ice','docs','news','duties','events','shifts','signups','org'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
