-- =====================================================================
--  Florian HQ – Erweiterung v6: Abwesenheiten, Kleiderkammer, Wissenstest-Trainer,
--  Kalender-Abo, eigene Fristen für „Meine Seite“
-- =====================================================================

-- ---------- Eigene Fristen lesen (Meine Seite) ----------
drop policy if exists member_quals_own on public.member_quals;
create policy member_quals_own on public.member_quals for select to authenticated using (user_id = auth.uid());
drop policy if exists qual_types_read on public.qual_types;
create policy qual_types_read on public.qual_types for select to authenticated using (public.is_member());

-- ---------- Abwesenheiten ----------
create table if not exists public.absences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  starts     date not null,
  ends       date not null,
  reason     text not null default 'urlaub' check (reason in ('urlaub','schicht','krank','beruflich','sonstiges')),
  note       text default '' check (length(note) <= 140),
  created_at timestamptz not null default now(),
  check (ends >= starts)
);
alter table public.absences enable row level security;
drop policy if exists absences_read on public.absences;
create policy absences_read on public.absences for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists absences_ins on public.absences;
create policy absences_ins on public.absences for insert to authenticated with check (public.is_member() and user_id = auth.uid());
drop policy if exists absences_del on public.absences;
create policy absences_del on public.absences for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Kleiderkammer ----------
create table if not exists public.clothing_sizes (
  user_id    uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  sizes      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.clothing_sizes enable row level security;
drop policy if exists clothing_sizes_read on public.clothing_sizes;
create policy clothing_sizes_read on public.clothing_sizes for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists clothing_sizes_write on public.clothing_sizes;
create policy clothing_sizes_write on public.clothing_sizes for all to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (public.is_member() and (user_id = auth.uid() or public.is_admin()));

create table if not exists public.clothing_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item       text not null check (length(item) between 1 and 60),
  size       text default '' check (length(size) <= 20),
  qty        int not null default 1 check (qty between 1 and 20),
  note       text default '' check (length(note) <= 140),
  status     text not null default 'offen' check (status in ('offen','bestellt','ausgegeben','abgelehnt')),
  done_by    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.clothing_requests enable row level security;
drop policy if exists clothing_req_read on public.clothing_requests;
create policy clothing_req_read on public.clothing_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists clothing_req_ins on public.clothing_requests;
create policy clothing_req_ins on public.clothing_requests for insert to authenticated
  with check (public.is_member() and (user_id = auth.uid() or public.is_admin()) and status = 'offen');
drop policy if exists clothing_req_upd on public.clothing_requests;
create policy clothing_req_upd on public.clothing_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists clothing_req_del on public.clothing_requests;
create policy clothing_req_del on public.clothing_requests for delete to authenticated
  using ((user_id = auth.uid() and status = 'offen') or public.is_admin());

-- ---------- Wissenstest & Leistungsabzeichen ----------
create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  cat         text not null check (cat in ('wissenstest','leistungsabzeichen')),
  question    text not null,
  options     text[] not null check (array_length(options,1) between 2 and 5),
  correct     int not null check (correct >= 0),
  explanation text default '',
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.quiz_questions enable row level security;
drop policy if exists quiz_q_read on public.quiz_questions;
create policy quiz_q_read on public.quiz_questions for select to authenticated using (public.is_member());
drop policy if exists quiz_q_admin on public.quiz_questions;
create policy quiz_q_admin on public.quiz_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.quiz_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  cat        text not null,
  score      int not null,
  total      int not null,
  created_at timestamptz not null default now()
);
alter table public.quiz_results enable row level security;
drop policy if exists quiz_r_read on public.quiz_results;
create policy quiz_r_read on public.quiz_results for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists quiz_r_ins on public.quiz_results;
create policy quiz_r_ins on public.quiz_results for insert to authenticated with check (public.is_member() and user_id = auth.uid());

-- ---------- Kalender-Abo: geheimer Link pro Person ----------
create table if not exists public.cal_tokens (
  user_id    uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  token      text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now()
);
alter table public.cal_tokens enable row level security;
drop policy if exists cal_tokens_own on public.cal_tokens;
create policy cal_tokens_own on public.cal_tokens for all to authenticated
  using (user_id = auth.uid()) with check (public.is_member() and user_id = auth.uid());

-- Feed-Daten für die Edge Function (nur service_role)
create or replace function public.fhq_cal_feed(tok text)
returns jsonb language sql stable security definer set search_path = public as $$
  with u as (
    select p.id from public.cal_tokens c join public.profiles p on p.id = c.user_id
    where c.token = tok and p.role in ('member','admin')
  )
  select case when not exists (select 1 from u) then null else jsonb_build_object(
    'duties', coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'grp',d.grp,'date',d.date,'time',d.time,'topic',d.topic,'place',d.place,'lead',d.lead,'note',d.note))
                        from public.duties d where d.date >= current_date - 60), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'date',e.date,'time',e.time,'title',e.title,'place',e.place,'note',e.note))
                        from public.events e where e.date >= current_date - 60), '[]'::jsonb)
  ) end;
$$;
revoke all on function public.fhq_cal_feed(text) from public, anon, authenticated;
grant execute on function public.fhq_cal_feed(text) to service_role;

-- ---------- Realtime ----------
do $$
declare t text;
begin
  foreach t in array array['absences','clothing_sizes','clothing_requests','quiz_questions','quiz_results','cal_tokens'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- Push: neue Kleider-Anfrage → Bearbeiter ----------
create or replace function public.fhq_notify_clothing() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; who text;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  select name into who from public.profiles where id = new.user_id;
  perform net.http_post(url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('category','kleider','title','Kleiderkammer: neuer Bedarf',
      'body', coalesce(who,'Jemand') || ' braucht ' || new.qty || '× ' || new.item || case when new.size <> '' then ' (Gr. ' || new.size || ')' else '' end,
      'url','#clothing','adminOnly',true,'exclude', new.user_id));
  return new;
exception when others then return new;
end $$;
revoke all on function public.fhq_notify_clothing() from public, anon, authenticated;
drop trigger if exists fhq_notify_clothing on public.clothing_requests;
create trigger fhq_notify_clothing after insert on public.clothing_requests
  for each row execute function public.fhq_notify_clothing();
