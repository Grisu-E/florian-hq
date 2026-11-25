-- Florian HQ v10: Push an Eva, sobald sich jemand neu registriert und auf Freigabe wartet.
-- Empfänger: Eva Egger (App-Master). Weitere Empfänger einfach in das Array unten eintragen.
-- In der App abschaltbar unter Benachrichtigungen → „Neue Registrierungen (Freigabe)“.

create or replace function public.fhq_notify_signup()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'fhq_private', 'extensions'
as $$
declare
  c record;
  empfaenger jsonb := jsonb_build_array('d8cd88eb-949f-4a0b-a1c0-29b6856bd9ec'::uuid); -- Eva Egger
  wer text;
begin
  if new.role <> 'pending' then return new; end if;
  select function_url, hook_secret into c from fhq_private.push_config where id = 1;
  if c.function_url is null then return new; end if;
  wer := coalesce(nullif(trim(new.name), ''), split_part(new.email, '@', 1), 'Jemand');
  perform net.http_post(
    url := c.function_url,
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object(
      'category', 'freigabe',
      'title', 'Neue Registrierung',
      'body', wer || ' möchte Florian HQ nutzen – jetzt prüfen und freigeben',
      'url', '#members',
      'userIds', empfaenger));
  return new;
exception when others then
  return new; -- eine fehlgeschlagene Push-Nachricht darf nie die Registrierung blockieren
end $$;

revoke all on function public.fhq_notify_signup() from public, anon, authenticated;

drop trigger if exists fhq_signup_push on public.profiles;
create trigger fhq_signup_push
  after insert on public.profiles
  for each row execute function public.fhq_notify_signup();
