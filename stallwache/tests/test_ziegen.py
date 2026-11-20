import sys, time, threading, configparser, logging, json, urllib.request, datetime
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.WARNING)
sim.start(); time.sleep(0.3)
# Fake-Supabase um Ziegen erweitern
sim.CFG['ziegen'] = {'modus': 'an', 'von': '08:00', 'bis': '18:00', 'sekunden': 3}
orig_post = sim.H.do_POST
def do_POST(self):
    if self.path.endswith('hs_bridge_sync'):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))); a = json.loads(body)
        sim.STATE['syncs'] += 1
        if a.get('p_state'): sim.STATE['last_state'] = a['p_state']
        sim.STATE['events'] += a.get('p_events') or []
        cmds, sim.STATE['cmds'] = sim.STATE['cmds'], []
        return self.send(200, {'commands': cmds, 'config': sim.CFG, 'ziegen': [{'name': 'Lotte', 'chip': '900123456789012'}], 'live_until': None, 'server_time': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    return orig_post(self)
sim.H.do_POST = do_POST

ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#'))
ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['endschalter_oben']='I3'; ini['logo']['endschalter_unten']='I4'; ini['logo']['motor_auf']='Q1'; ini['logo']['motor_zu']='Q2'; ini['logo']['motor'] = ''; ini['logo']['soll_offen'] = ''; ini['ziegen']['tuerkontakt']='I5'; ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['logo']['abfrage_s'] = '0.5'
ini['ziegen']['aktiv'] = 'yes'; ini['ziegen']['port'] = '18088'; ini['ziegen']['tuer_offen_alarm_min'] = '0.05'
TOK = ini['ziegen']['token']
b = br.Bridge(ini); threading.Thread(target=b.run, daemon=True).start(); time.sleep(1.5)

ok = True
def check(n, c):
    global ok; ok &= bool(c); print(('✅' if c else '❌'), n)
def tag(t, token=TOK):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:18088/rfid?token={token}&tag=' + urllib.parse.quote(t), timeout=5) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e: return {'http': e.code}
import urllib.parse
V02 = 2  # Coil-Adresse V0.2

check('falsches Kennwort abgewiesen', tag('900 123456789012', 'falsch').get('http') == 403)
r = tag('900 123456789012'); check(f'Lotte darf (dauerhaft): {r}', r.get('ok') and r.get('name') == 'Lotte')
check('V0.2 ist 1 (Schloss offen)', sim.LOGO.coils.get(V02) is True)
time.sleep(3.6)
check('nach 3 s wieder verriegelt', sim.LOGO.coils.get(V02) is False)
r = tag('999 000000000001'); check(f'unbekannter Chip abgewiesen: {r}', not r.get('ok') and r.get('grund') == 'unbekannt')
check('V0.2 bleibt 0', not sim.LOGO.coils.get(V02))
time.sleep(1.2)
check('unbekannter Chip in info für die App', (sim.STATE['last_state']['info'].get('rfid_unbekannt') or {}).get('chip') == '999 000000000001')
sim.CFG['ziegen'] = {'modus': 'aus', 'von': '08:00', 'bis': '18:00', 'sekunden': 3}; time.sleep(1.2)
r = tag('900123456789012'); check(f'Freigabe aus → abgewiesen: {r}', not r.get('ok') and 'aus' in r.get('grund', ''))
now = datetime.datetime.now(); von = (now - datetime.timedelta(hours=1)).strftime('%H:%M'); bis = (now + datetime.timedelta(hours=1)).strftime('%H:%M')
sim.CFG['ziegen'] = {'modus': 'zeit', 'von': von, 'bis': bis, 'sekunden': 3}; time.sleep(1.2)
r = tag('900-1234-5678-9012'); check(f'im Zeitfenster + andere Schreibweise → darf: {r}', r.get('ok'))
time.sleep(3.6)
von = (now + datetime.timedelta(hours=1)).strftime('%H:%M'); bis = (now + datetime.timedelta(hours=2)).strftime('%H:%M')
sim.CFG['ziegen'] = {'modus': 'zeit', 'von': von, 'bis': bis, 'sekunden': 3}; time.sleep(1.2)
r = tag('900123456789012'); check(f'außerhalb Zeitfenster → abgewiesen: {r}', not r.get('ok') and 'außerhalb' in r.get('grund', ''))
# Entriegeln aus der App (unabhängig von Freigabe)
sim.STATE['cmds'] = [{'id': 21, 'cmd': 'unlock'}]; time.sleep(1.2)
check('App-Entriegeln quittiert', any(a[0] == 21 and a[1] for a in sim.STATE['acks']))
check('V0.2 nach App-Befehl 1', sim.LOGO.coils.get(V02) is True)
time.sleep(3.5)
# Türkontakt I5 lange offen → Alarm
sim.LOGO.di[4] = True; time.sleep(5)
check('Alarm Ziegentür offen', any(e['kind'] == 'alarm' and 'Ziegentür' in e['text'] for e in sim.STATE['events']))
sim.LOGO.di[4] = False
# Protokoll-Flut: mehrfaches Lesen
n0 = sum(1 for e in sim.STATE['events'] if 'Unbekannter' in e['text'])
for _ in range(5): tag('999 000000000001')
time.sleep(1.2)
check('Dauerlesen erzeugt keine Protokoll-Flut', sum(1 for e in sim.STATE['events'] if 'Unbekannter' in e['text']) == n0)
check('Ziegen-Status in io', 'Ziegentür offen' in sim.STATE['last_state']['io'])
print('\nZiegen-Ereignisse:'); [print('  ', e['kind'], '–', e['text']) for e in sim.STATE['events'] if e['kind'] in ('ziege', 'alarm')]
print('GESAMT:', 'ALLES OK' if ok else 'FEHLER')
