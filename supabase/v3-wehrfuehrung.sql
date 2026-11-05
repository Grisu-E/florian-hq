-- =====================================================================
--  Florian HQ – Erweiterung v3: Wehrführung (Fristen, Qualifikationen, Beteiligung)
--  Alles hier ist nur für Bearbeiter lesbar und schreibbar.
-- =====================================================================

-- Katalog: Lehrgänge (kind = 'lehrgang') und Fristen (kind = 'frist', mit Gültigkeit in Monaten)
create table if not exists public.qual_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  kind          text not null check (kind in ('lehrgang','frist')),
  valid_months  int check (valid_months is null or valid_months > 0),
  sort          int not null default 100,
  created_at    timestamptz not null default now()
);

-- Einträge pro Person
create table if not exists public.member_quals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type_id    uuid not null references public.qual_types(id) on delete cascade,
  achieved   date not null,
  expires    date,
  note       text default '',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, type_id)
);

-- Tatsächliche Anwesenheit bei Diensten
create table if not exists public.duty_attendance (
  duty_id    uuid not null references public.duties(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  present    boolean not null default true,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (duty_id, user_id)
);

do $$
declare t text;
begin
  foreach t in array array['qual_types','member_quals','duty_attendance'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_admin', t);
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Startkatalog (kann in der App angepasst werden)
insert into public.qual_types (name, kind, valid_months, sort) values
  ('Grundausbildung (Truppmann)', 'lehrgang', null, 10),
  ('Truppführer',                 'lehrgang', null, 20),
  ('Sprechfunker',                'lehrgang', null, 30),
  ('Atemschutzgeräteträger',      'lehrgang', null, 40),
  ('Maschinist',                  'lehrgang', null, 50),
  ('Technische Hilfeleistung',    'lehrgang', null, 60),
  ('Motorsägenführer',            'lehrgang', null, 70),
  ('Gruppenführer',               'lehrgang', null, 80),
  ('Zugführer',                   'lehrgang', null, 90),
  ('G26.3 Untersuchung',          'frist',    36,   10),
  ('Atemschutz-Belastungsübung',  'frist',    12,   20),
  ('Atemschutz-Unterweisung',     'frist',    12,   30),
  ('UVV-Unterweisung',            'frist',    12,   40),
  ('Führerscheinkontrolle',       'frist',     6,   50),
  ('Erste-Hilfe-Auffrischung',    'frist',    24,   60)
on conflict (name) do nothing;

-- Tägliche Fristen-Erinnerung an Bearbeiter (07:05 Uhr deutscher Zeit ≈ 06:05 UTC im Winter)
create extension if not exists pg_cron;
create or replace function public.fhq_frist_reminder() returns void
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; n_over int; n_soon int;
begin
  select count(*) filter (where expires < current_date),
         count(*) filter (where expires >= current_date and expires <= current_date + 30)
    into n_over, n_soon from public.member_quals where expires is not null;
  -- nur melden, wenn heute etwas neu kritisch wird (Ablauf in genau 30 Tagen oder heute abgelaufen) – sonst kein Spam
  if not exists (select 1 from public.member_quals where expires in (current_date + 30, current_date - 1)) then return; end if;
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  perform net.http_post(
    url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('category','fristen','title','Fristen prüfen',
      'body', n_over || ' abgelaufen · ' || n_soon || ' laufen in 30 Tagen ab', 'url','#lead','adminOnly',true));
end $$;
revoke all on function public.fhq_frist_reminder() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'fhq-fristen';
select cron.schedule('fhq-fristen', '5 6 * * *', 'select public.fhq_frist_reminder()');

-- ---------- v3.1: Vorab-Erinnerung je Frist ----------
-- remind_days = Tage vor Ablauf (null = keine Erinnerung); remind_person = betroffene Person ebenfalls erinnern
alter table public.qual_types add column if not exists remind_days int check (remind_days between 0 and 365);
alter table public.qual_types add column if not exists remind_person boolean not null default false;
update public.qual_types set remind_days = case name
  when 'G26.3 Untersuchung' then 90 when 'Atemschutz-Belastungsübung' then 60 when 'Führerscheinkontrolle' then 14 else null end
where kind = 'frist' and remind_days is null;

create or replace function public.fhq_push_targets_users(cat text, ids uuid[])
returns setof public.push_subs language sql security definer set search_path = public as $$
  select s.* from public.push_subs s join public.profiles p on p.id = s.user_id
  where p.role in ('member','admin') and s.user_id = any(ids) and coalesce((s.prefs ->> cat)::boolean, true);
$$;
revoke all on function public.fhq_push_targets_users(text, uuid[]) from public, anon, authenticated;
grant execute on function public.fhq_push_targets_users(text, uuid[]) to service_role;

create or replace function public.fhq_frist_reminder() returns void
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; r record; hdr jsonb;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  hdr := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret);
  for r in
    select t.name,
      string_agg(case when q.expires = current_date + t.remind_days then p.name end, ', ' order by p.name) as soon,
      string_agg(case when q.expires = current_date - 1 then p.name end, ', ' order by p.name) as over,
      min(t.remind_days) as days
    from public.member_quals q join public.qual_types t on t.id = q.type_id join public.profiles p on p.id = q.user_id
    where t.kind = 'frist' and t.remind_days is not null and q.expires is not null
      and (q.expires = current_date + t.remind_days or q.expires = current_date - 1)
    group by t.id, t.name
  loop
    perform net.http_post(url := c.function_url, headers := hdr,
      body := jsonb_build_object('category','fristen','title','Frist: ' || r.name,
        'body', concat_ws(' · ', case when r.soon is not null then 'in ' || r.days || ' Tagen fällig: ' || r.soon end,
                                  case when r.over is not null then 'abgelaufen: ' || r.over end),
        'url','#lead','adminOnly',true));
  end loop;
  for r in
    select q.user_id, t.name, q.expires, (q.expires < current_date) as over
    from public.member_quals q join public.qual_types t on t.id = q.type_id
    where t.kind = 'frist' and t.remind_days is not null and t.remind_person and q.expires is not null
      and (q.expires = current_date + t.remind_days or q.expires = current_date - 1)
  loop
    perform net.http_post(url := c.function_url, headers := hdr,
      body := jsonb_build_object('category','meine_fristen',
        'title', case when r.over then 'Deine Frist ist abgelaufen' else 'Deine Frist läuft bald ab' end,
        'body', r.name || ' – gültig bis ' || to_char(r.expires,'DD.MM.YYYY'),
        'url','#home','userIds', jsonb_build_array(r.user_id)));
  end loop;
end $$;
revoke all on function public.fhq_frist_reminder() from public, anon, authenticated;
