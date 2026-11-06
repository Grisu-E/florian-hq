-- =====================================================================
--  Florian HQ – Erweiterung v8: Feinere Rollen
--  role = 'admin'  → Master (App-Verwaltung, darf alles inkl. Rollen vergeben)
--  functions[]     → kommandant | gruppenfuehrer | geraetewart | kassier (mehrere möglich)
-- =====================================================================

alter table public.profiles add column if not exists functions text[] not null default '{}';
alter table public.profiles drop constraint if exists profiles_functions_chk;
alter table public.profiles add constraint profiles_functions_chk
  check (functions <@ array['kommandant','gruppenfuehrer','geraetewart','kassier']::text[]);
update public.profiles set functions = array_append(functions, 'kassier') where treasurer and not ('kassier' = any(functions));

-- ---------- Rechte-Helfer ----------
create or replace function public.has_fn(f text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('member','admin') and f = any(functions));
$$;
create or replace function public.can_lead() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.has_fn('kommandant') or public.has_fn('gruppenfuehrer');
$$;
create or replace function public.can_gear() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.has_fn('kommandant') or public.has_fn('geraetewart');
$$;
create or replace function public.can_cmd() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.has_fn('kommandant');
$$;
create or replace function public.can_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_lead() or public.can_gear();
$$;
create or replace function public.is_treasurer() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.has_fn('kassier')
      or exists(select 1 from public.profiles where id = auth.uid() and treasurer and role in ('member','admin'));
$$;

-- ---------- Richtlinien neu zuordnen ----------
-- Führung (Kommandant, Gruppenführer, Master)
drop policy if exists absences_del on public.absences;
create policy absences_del on public.absences for delete to authenticated using (user_id = auth.uid() or public.can_lead());
drop policy if exists absences_read on public.absences;
create policy absences_read on public.absences for select to authenticated using (user_id = auth.uid() or public.can_lead());

drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (public.can_lead() and created_by = auth.uid());
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated using (public.can_lead());

drop policy if exists duties_write on public.duties;
create policy duties_write on public.duties for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists duty_attendance_admin on public.duty_attendance;
create policy duty_attendance_admin on public.duty_attendance for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists duty_rsvp_delete on public.duty_rsvp;
create policy duty_rsvp_delete on public.duty_rsvp for delete to authenticated using (user_id = auth.uid() or public.can_lead());

drop policy if exists events_write on public.events;
create policy events_write on public.events for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists shifts_write on public.shifts;
create policy shifts_write on public.shifts for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists signups_delete on public.signups;
create policy signups_delete on public.signups for delete to authenticated using (public.is_member() and (created_by = auth.uid() or public.can_lead()));

drop policy if exists member_quals_admin on public.member_quals;
create policy member_quals_admin on public.member_quals for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists qual_types_admin on public.qual_types;
create policy qual_types_admin on public.qual_types for all to authenticated using (public.can_lead()) with check (public.can_lead());

drop policy if exists quiz_q_admin on public.quiz_questions;
create policy quiz_q_admin on public.quiz_questions for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists quiz_r_read on public.quiz_results;
create policy quiz_r_read on public.quiz_results for select to authenticated using (user_id = auth.uid() or public.can_lead());

drop policy if exists todo_lists_admin on public.todo_lists;
create policy todo_lists_admin on public.todo_lists for all to authenticated using (public.can_lead()) with check (public.can_lead());
drop policy if exists todos_admin on public.todos;
create policy todos_admin on public.todos for all to authenticated using (public.can_lead()) with check (public.can_lead());
create or replace function public.can_see_list(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_lead() or exists (select 1 from public.todo_lists l where l.id = lid and l.visibility = 'alle' and public.is_member());
$$;
create or replace function public.toggle_todo(tid uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.todos set done = flag, done_by = case when flag then auth.uid() end, done_at = case when flag then now() end
  where id = tid and (public.can_lead() or assignee = auth.uid());
  if not found then raise exception 'Dafür fehlt dir die Berechtigung'; end if;
end $$;

drop policy if exists listen_delete on storage.objects;
create policy listen_delete on storage.objects for delete to authenticated using (bucket_id = 'listen' and public.can_lead());
drop policy if exists listen_upload on storage.objects;
create policy listen_upload on storage.objects for insert to authenticated with check (bucket_id = 'listen' and public.can_lead());

-- Neuigkeiten: alle mit Funktion (außer nur Kassier)
drop policy if exists news_write on public.news;
create policy news_write on public.news for all to authenticated using (public.can_staff()) with check (public.can_staff());

-- Organigramm: Kommandant + Master
drop policy if exists org_write on public.org;
create policy org_write on public.org for all to authenticated using (public.can_cmd()) with check (public.can_cmd());

-- Gerätewesen (Gerätewart, Kommandant, Master)
drop policy if exists defects_update on public.defects;
create policy defects_update on public.defects for update to authenticated using (public.can_gear()) with check (public.can_gear());
drop policy if exists defects_delete on public.defects;
create policy defects_delete on public.defects for delete to authenticated using (public.can_gear());
drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete to authenticated using (public.is_member() and (created_by = auth.uid() or public.can_gear()));
drop policy if exists reservations_delete on public.reservations;
create policy reservations_delete on public.reservations for delete to authenticated using (public.is_member() and (created_by = auth.uid() or public.can_gear()));
drop policy if exists ice_delete on public.ice;
create policy ice_delete on public.ice for delete to authenticated using (public.is_member() and (created_by = auth.uid() or public.can_gear()));
drop policy if exists res_contacts_write on public.res_contacts;
create policy res_contacts_write on public.res_contacts for all to authenticated using (public.can_gear()) with check (public.can_gear());

drop policy if exists clothing_issued_admin on public.clothing_issued;
create policy clothing_issued_admin on public.clothing_issued for all to authenticated using (public.can_gear()) with check (public.can_gear());
drop policy if exists clothing_issued_read on public.clothing_issued;
create policy clothing_issued_read on public.clothing_issued for select to authenticated using (user_id = auth.uid() or public.can_gear());
drop policy if exists clothing_req_upd on public.clothing_requests;
create policy clothing_req_upd on public.clothing_requests for update to authenticated using (public.can_gear()) with check (public.can_gear());
drop policy if exists clothing_req_read on public.clothing_requests;
create policy clothing_req_read on public.clothing_requests for select to authenticated using (user_id = auth.uid() or public.can_gear());
drop policy if exists clothing_req_del on public.clothing_requests;
create policy clothing_req_del on public.clothing_requests for delete to authenticated using ((user_id = auth.uid() and status = 'offen') or public.can_gear());
drop policy if exists clothing_req_ins on public.clothing_requests;
create policy clothing_req_ins on public.clothing_requests for insert to authenticated
  with check (public.is_member() and (user_id = auth.uid() or public.can_gear()) and status = 'offen');
drop policy if exists clothing_sizes_read on public.clothing_sizes;
create policy clothing_sizes_read on public.clothing_sizes for select to authenticated using (user_id = auth.uid() or public.can_gear());
drop policy if exists clothing_sizes_write on public.clothing_sizes;
create policy clothing_sizes_write on public.clothing_sizes for all to authenticated
  using (user_id = auth.uid() or public.can_gear()) with check (public.is_member() and (user_id = auth.uid() or public.can_gear()));
drop policy if exists clothing_stock_admin on public.clothing_stock;
create policy clothing_stock_admin on public.clothing_stock for all to authenticated using (public.can_gear()) with check (public.can_gear());

-- ---------- Mitgliederverwaltung ----------
-- Freigeben/Sperren/Entfernen: Kommandant + Master. Master-Rolle vergeben/entziehen: nur Master.
create or replace function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
declare cur text;
begin
  if new_role not in ('pending','member','admin') then raise exception 'Unbekannte Rolle'; end if;
  select role into cur from public.profiles where id = target;
  if (new_role = 'admin' or cur = 'admin') and not public.is_admin() then raise exception 'Nur der App-Master darf Master-Rechte vergeben'; end if;
  if not public.can_cmd() then raise exception 'Nur Kommandant oder App-Master dürfen Mitglieder freigeben'; end if;
  if new_role <> 'admin' and cur = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Mindestens ein App-Master muss bleiben';
  end if;
  update public.profiles set role = new_role where id = target;
end $$;
create or replace function public.remove_member(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.can_cmd() then raise exception 'Nur Kommandant oder App-Master dürfen Mitglieder entfernen'; end if;
  if target = auth.uid() then raise exception 'Du kannst dich nicht selbst entfernen'; end if;
  if (select role from public.profiles where id = target) = 'admin' and not public.is_admin() then raise exception 'Einen App-Master kann nur ein App-Master entfernen'; end if;
  delete from auth.users where id = target;
end $$;
create or replace function public.set_functions(target uuid, fns text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Nur der App-Master darf Funktionen vergeben'; end if;
  update public.profiles set functions = coalesce(fns,'{}'), treasurer = ('kassier' = any(coalesce(fns,'{}'))) where id = target;
end $$;
revoke all on function public.set_functions(uuid, text[]) from public, anon;
grant execute on function public.set_functions(uuid, text[]) to authenticated;
create or replace function public.set_treasurer(target uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
declare f text[];
begin
  if not public.is_admin() then raise exception 'Nur der App-Master darf den Kassier festlegen'; end if;
  select functions into f from public.profiles where id = target;
  f := array_remove(f, 'kassier'); if flag then f := array_append(f, 'kassier'); end if;
  update public.profiles set functions = f, treasurer = flag where id = target;
end $$;

-- ---------- Push: „nur Bearbeiter“ = alle mit Funktion (außer reinem Kassier) oder Master ----------
create or replace function public.fhq_push_targets(cat text, excl uuid, admin_only boolean)
returns setof public.push_subs language sql security definer set search_path = public as $$
  select s.* from public.push_subs s join public.profiles p on p.id = s.user_id
  where p.role in ('member','admin')
    and (not admin_only or p.role = 'admin'
         or (cat in ('defects','kleider') and p.functions && array['kommandant','geraetewart'])
         or (cat not in ('defects','kleider') and p.functions && array['kommandant','gruppenfuehrer']))
    and (excl is null or s.user_id <> excl)
    and coalesce((s.prefs ->> cat)::boolean, true);
$$;
