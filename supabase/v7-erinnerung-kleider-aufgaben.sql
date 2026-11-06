-- =====================================================================
--  Florian HQ – Erweiterung v7: Dienst-Erinnerungen, Kleiderkammer (Ausgabe & Lager),
--  Aufgabenlisten (To-Do, z. B. Gruppenführer-Besprechung)
-- =====================================================================

-- ---------- Kleiderkammer: Ausgabe pro Person ----------
create table if not exists public.clothing_issued (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item        text not null check (length(item) between 1 and 60),
  size        text default '' check (length(size) <= 20),
  inv_no      text default '' check (length(inv_no) <= 40),
  issued_on   date not null default current_date,
  replace_by  date,
  returned_on date,
  note        text default '' check (length(note) <= 140),
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.clothing_issued enable row level security;
drop policy if exists clothing_issued_read on public.clothing_issued;
create policy clothing_issued_read on public.clothing_issued for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists clothing_issued_admin on public.clothing_issued;
create policy clothing_issued_admin on public.clothing_issued for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Kleiderkammer: Lagerbestand ----------
create table if not exists public.clothing_stock (
  id         uuid primary key default gen_random_uuid(),
  item       text not null check (length(item) between 1 and 60),
  size       text not null default '' check (length(size) <= 20),
  qty        int not null default 0 check (qty >= 0 and qty < 10000),
  updated_at timestamptz not null default now(),
  unique (item, size)
);
alter table public.clothing_stock enable row level security;
drop policy if exists clothing_stock_read on public.clothing_stock;
create policy clothing_stock_read on public.clothing_stock for select to authenticated using (public.is_member());
drop policy if exists clothing_stock_admin on public.clothing_stock;
create policy clothing_stock_admin on public.clothing_stock for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Aufgabenlisten ----------
create table if not exists public.todo_lists (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(title) between 1 and 80),
  meet_on    date,
  visibility text not null default 'fuehrung' check (visibility in ('fuehrung','alle')),
  archived   boolean not null default false,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.todo_lists(id) on delete cascade,
  title       text not null check (length(title) between 1 and 160),
  note        text default '' check (length(note) <= 400),
  assignee    uuid references public.profiles(id) on delete set null,
  assignee_txt text default '' check (length(assignee_txt) <= 60),
  due         date,
  done        boolean not null default false,
  done_by     uuid references public.profiles(id) on delete set null,
  done_at     timestamptz,
  sort        int not null default 100,
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.todo_lists enable row level security;
alter table public.todos enable row level security;

create or replace function public.can_see_list(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.todo_lists l where l.id = lid and l.visibility = 'alle' and public.is_member());
$$;

drop policy if exists todo_lists_read on public.todo_lists;
create policy todo_lists_read on public.todo_lists for select to authenticated
  using (public.can_see_list(id) or exists (select 1 from public.todos t where t.list_id = todo_lists.id and t.assignee = auth.uid()));
drop policy if exists todo_lists_admin on public.todo_lists;
create policy todo_lists_admin on public.todo_lists for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists todos_read on public.todos;
create policy todos_read on public.todos for select to authenticated using (public.can_see_list(list_id) or assignee = auth.uid());
drop policy if exists todos_admin on public.todos;
create policy todos_admin on public.todos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Zuständige dürfen ihre Aufgabe abhaken (nur Status, nichts anderes)
create or replace function public.toggle_todo(tid uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.todos set done = flag, done_by = case when flag then auth.uid() end, done_at = case when flag then now() end
  where id = tid and (public.is_admin() or assignee = auth.uid());
  if not found then raise exception 'Dafür fehlt dir die Berechtigung'; end if;
end $$;
revoke all on function public.toggle_todo(uuid, boolean) from public, anon;
grant execute on function public.toggle_todo(uuid, boolean) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['clothing_issued','clothing_stock','todo_lists','todos'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Push: neue Aufgabe → zuständige Person
create or replace function public.fhq_notify_todo() returns trigger
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; lt text;
begin
  if new.assignee is null or new.assignee = auth.uid() then return new; end if;
  if tg_op = 'UPDATE' and new.assignee is not distinct from old.assignee then return new; end if;
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  select title into lt from public.todo_lists where id = new.list_id;
  perform net.http_post(url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('category','aufgaben','title','Neue Aufgabe für dich',
      'body', new.title || coalesce(' · bis ' || to_char(new.due,'DD.MM.'), '') || ' (' || coalesce(lt,'') || ')',
      'url','#todo','userIds', jsonb_build_array(new.assignee)));
  return new;
exception when others then return new;
end $$;
revoke all on function public.fhq_notify_todo() from public, anon, authenticated;
drop trigger if exists fhq_notify_todo on public.todos;
create trigger fhq_notify_todo after insert or update of assignee on public.todos
  for each row execute function public.fhq_notify_todo();

-- ---------- Tägliche Erinnerungen (17 Uhr Winterzeit / 18 Uhr Sommerzeit) ----------
create or replace function public.fhq_daily_reminders() returns void
language plpgsql security definer set search_path = public, fhq_private, extensions as $$
declare c record; hdr jsonb; d record; ids jsonb; r record;
begin
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return; end if;
  hdr := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret);

  for d in select * from public.duties where date = current_date + 1 loop
    -- zugesagt / vielleicht → Erinnerung
    select coalesce(jsonb_agg(r2.user_id), '[]'::jsonb) into ids from public.duty_rsvp r2
      where r2.duty_id = d.id and r2.status in ('yes','maybe');
    if jsonb_array_length(ids) > 0 then
      perform net.http_post(url := c.function_url, headers := hdr,
        body := jsonb_build_object('category','erinnerung','title','Morgen: ' || d.topic,
          'body', d.time || ' Uhr' || coalesce(' · ' || nullif(d.place,''), '') || ' – du hast zugesagt.', 'url','#duty-' || d.grp, 'userIds', ids));
    end if;
    -- Aktive: noch keine Rückmeldung und nicht abgemeldet → bitte melden
    if d.grp = 'aktive' then
      select coalesce(jsonb_agg(p.id), '[]'::jsonb) into ids from public.profiles p
        where p.role in ('member','admin')
          and not exists (select 1 from public.duty_rsvp x where x.duty_id = d.id and x.user_id = p.id)
          and not exists (select 1 from public.absences a where a.user_id = p.id and d.date between a.starts and a.ends);
      if jsonb_array_length(ids) > 0 then
        perform net.http_post(url := c.function_url, headers := hdr,
          body := jsonb_build_object('category','erinnerung','title','Morgen: ' || d.topic,
            'body', d.time || ' Uhr' || coalesce(' · ' || nullif(d.place,''), '') || ' – bitte kurz zu- oder absagen.', 'url','#me', 'userIds', ids));
      end if;
    end if;
  end loop;

  -- Aufgaben, die morgen fällig sind
  for r in select t.assignee, string_agg(t.title, ', ') as titles from public.todos t
           where not t.done and t.assignee is not null and t.due = current_date + 1 group by t.assignee loop
    perform net.http_post(url := c.function_url, headers := hdr,
      body := jsonb_build_object('category','aufgaben','title','Aufgabe morgen fällig','body', r.titles, 'url','#todo','userIds', jsonb_build_array(r.assignee)));
  end loop;

  -- Kleiderkammer: Austausch in 30 Tagen oder heute fällig → Bearbeiter
  for r in select string_agg(p.name || ': ' || i.item, ', ') as txt from public.clothing_issued i join public.profiles p on p.id = i.user_id
           where i.returned_on is null and i.replace_by in (current_date + 30, current_date) having count(*) > 0 loop
    perform net.http_post(url := c.function_url, headers := hdr,
      body := jsonb_build_object('category','kleider','title','Kleiderkammer: Austausch fällig','body', r.txt, 'url','#clothing','adminOnly', true));
  end loop;
end $$;
revoke all on function public.fhq_daily_reminders() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'fhq-daily';
select cron.schedule('fhq-daily', '7 16 * * *', 'select public.fhq_daily_reminders()');
