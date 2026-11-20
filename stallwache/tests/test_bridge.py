import sys, time, threading, configparser, logging, datetime
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s', datefmt='%H:%M:%S')
sim.start(); time.sleep(0.3)

ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#'))
ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['endschalter_oben']='I3'; ini['logo']['endschalter_unten']='I4'; ini['logo']['motor_auf']='Q1'; ini['logo']['motor_zu']='Q2'; ini['logo']['motor'] = ''; ini['logo']['soll_offen'] = ''; ini['ziegen']['tuerkontakt']='I5'; ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['logo']['temperatur'] = 'AI1'; ini['logo']['abfrage_s'] = '0.5'
ini['kamera']['cam0_url'] = 'http://127.0.0.1:18080/cam.jpg'; ini['kamera']['live_alle_s'] = '1'

ok = True
def check(name, cond):
    global ok; ok &= bool(cond); print(('✅' if cond else '❌'), name)

# Adressumrechnung
check('Adressen I3/Q1/M1/V0.1/V2.3/AI1', [(s.fc, s.addr) for s in map(br.Signal, ['I3', 'Q1', 'M1', 'V0.1', 'V2.3', 'AI1'])] == [(2, 2), (1, 8192), (1, 8256), (1, 1), (1, 19), (4, 0)])
try: br.Signal('X9'); check('ungültige Adresse abgelehnt', False)
except ValueError: check('ungültige Adresse abgelehnt', True)
check('Invertierung !I4', br.Signal('!I4').invert)

# Sonnenzeiten Tettnang 20.11.: ca. 07:40 / 16:40
r, s = br.sun_times(datetime.date(2026, 11, 20), 47.67, 9.59)
r, s = r.astimezone(br.TZ), s.astimezone(br.TZ)
print('   Sonne 20.11.:', r.strftime('%H:%M'), s.strftime('%H:%M'))
check('Sonnenzeiten plausibel', (7, 30) <= (r.hour, r.minute) <= (7, 50) and (16, 30) <= (s.hour, s.minute) <= (16, 50))
r, s = br.sun_times(datetime.date(2026, 6, 21), 47.67, 9.59); r, s = r.astimezone(br.TZ), s.astimezone(br.TZ)
print('   Sonne 21.06.:', r.strftime('%H:%M'), s.strftime('%H:%M'))

b = br.Bridge(ini)
t = threading.Thread(target=b.run, daemon=True); t.start()
time.sleep(2)
st = sim.STATE['last_state']
check('Zustand gemeldet: zu', st and st['door'] == 'zu')
check('Temperatur 4,5 °C', st and st['io'].get('Temperatur') == 4.5)
check('Sonnenzeiten in info', st and st['info'].get('plan_zu'))
check('Start-Ereignis', any(e['kind'] == 'start' for e in sim.STATE['events']))

# Befehl öffnen aus der App
sim.STATE['cmds'] = [{'id': 7, 'cmd': 'open'}]
time.sleep(1.5)
check('Motor auf läuft → oeffnet', sim.STATE['last_state']['door'] == 'oeffnet')
time.sleep(4)
check('Klappe offen', sim.STATE['last_state']['door'] == 'offen')
check('Quittung ok', any(a[0] == 7 and a[1] for a in sim.STATE['acks']))
check('Ereignis auf (per App)', any(e['kind'] == 'auf' and 'App' in e['text'] for e in sim.STATE['events']))
check('V-Bit wieder 0', not sim.LOGO.coils.get(0))
time.sleep(2)
check('Archivbild beim Öffnen', any('archive=1' in p and 'label=auf' in p and j for p, n, j in sim.STATE['snaps']))

# Befehl schließen, wenn schon offen → sofort quittiert
sim.STATE['cmds'] = [{'id': 8, 'cmd': 'open'}]; time.sleep(1.2)
check('Doppelbefehl: schon offen', any(a[0] == 8 and a[1] and 'schon' in a[2] for a in sim.STATE['acks']))

# Live-Modus
n0 = len(sim.STATE['snaps'])
sim.STATE['live_until'] = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=6)).isoformat()
time.sleep(5)
check(f'Live-Bilder ({len(sim.STATE["snaps"]) - n0})', len(sim.STATE['snaps']) - n0 >= 3)
sim.STATE['live_until'] = None

# Klappe klemmt: Motor läuft nie fertig
b.fahrzeit = 2
sim.STATE['cmds'] = [{'id': 9, 'cmd': 'close'}]
orig = sim.Logo.tick
def stuck(self):
    with self.lock:
        if self.coils.get(1) and self.motor is None: self.motor = 'zu'; self.t0 = time.time(); self.di[2] = False
        self.coils[8192] = self.motor == 'auf'; self.coils[8193] = self.motor == 'zu'
sim.Logo.tick = stuck
time.sleep(4)
check('Fehlquittung bei Klemmen', any(a[0] == 9 and not a[1] for a in sim.STATE['acks']))
check('Fehler-Ereignis Endlage', any(e['kind'] == 'fehler' and 'Endlage' in e['text'] for e in sim.STATE['events']))
sim.Logo.tick = orig; sim.LOGO.motor = None; sim.LOGO.di[3] = True; b.fahrzeit = 60
time.sleep(1.5)

# Abend-Alarm: Klappe offen nach Alarmzeit (Zeitplan fix in der Vergangenheit)
sim.LOGO.di[3] = False; sim.LOGO.di[2] = True; time.sleep(1.2)
sim.CFG.update(zeitart='fix', auf_fix='00:01', zu_fix='00:02', alarm_min=5)
real = br.now_local
br.now_local = lambda: real().replace(hour=21, minute=30)
time.sleep(1.5)
check('Fuchs-Alarm abends', any(e['kind'] == 'alarm' and 'noch nicht zu' in e['text'] for e in sim.STATE['events']))
br.now_local = real

# LOGO weg
srv_ok = b.mb.host; b.mb.close(); b.mb.port = 15999; time.sleep(1.5)
check('LOGO-Ausfall erkannt', sim.STATE['last_state']['door'] == 'unbekannt' and any('nicht erreichbar' in e['text'] for e in sim.STATE['events']))

print('\nEreignisse:'); [print('  ', e['kind'], '–', e['text']) for e in sim.STATE['events']]
print('Quittungen:', sim.STATE['acks'])
print('\nGESAMT:', 'ALLES OK' if ok else 'FEHLER')
