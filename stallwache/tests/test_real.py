import sys, time, threading, configparser, logging, os
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.WARNING)
# LOGO wie beim Nutzer: NI1/NI2 (V0.0/V0.1) setzen/rücksetzen B007 → Q1; Klappe fährt 3 s; I4 oben (di 3), I5 unten (di 4); NI4 (V0.3) sperrt Setzen
L = sim.LOGO; L.di = {3: False, 4: True}; L.q1 = False; L.pos = 0.0
def tick(self):
    with self.lock:
        if self.coils.get(0) and not self.coils.get(3): self.q1 = True
        if self.coils.get(1): self.q1 = False
        self.coils[8192] = self.q1
        self.pos = min(1.0, self.pos + 0.034) if self.q1 else max(0.0, self.pos - 0.034)
        self.di[3] = self.pos >= 1.0; self.di[4] = self.pos <= 0.0
sim.Logo.tick = tick
sim.start(); time.sleep(0.3)
ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#')); ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['logo']['abfrage_s'] = '0.5'; ini['kamera']['cam0_url'] = ''
b = br.Bridge(ini); threading.Thread(target=b.run, daemon=True).start(); time.sleep(1.5)
ok = True
def check(n, c):
    global ok; ok &= bool(c); print(('✅' if c else '❌'), n)
st = lambda: sim.STATE['last_state']['door']
check(f'Start: zu ({st()})', st() == 'zu')
sim.STATE['cmds'] = [{'id': 51, 'cmd': 'open'}]; time.sleep(1.5)
check(f'nach „Öffnen“: öffnet ({st()})', st() == 'oeffnet')
time.sleep(3.5)
check(f'Endlage oben: offen ({st()})', st() == 'offen')
check('Quittung „Klappe offen“', any(a[0] == 51 and a[1] for a in sim.STATE['acks']))
sim.STATE['cmds'] = [{'id': 52, 'cmd': 'close'}]; time.sleep(1.5)
check(f'nach „Schließen“: schließt ({st()})', st() == 'schliesst')
time.sleep(3.5)
check(f'Endlage unten: zu ({st()})', st() == 'zu')
sim.CFG['stallpflicht'] = {'aktiv': True}; time.sleep(1.2)
L.coils[0] = True; time.sleep(0.3); L.coils[0] = False; time.sleep(1.5)   # jemand drückt „öffnen“ in der LOGO
check(f'Stallpflicht: Taster öffnet nicht ({st()})', st() == 'zu')
check('Ereignisse auf/zu protokolliert', [e['kind'] for e in sim.STATE['events'] if e['kind'] in ('auf', 'zu')] == ['auf', 'zu'])
print('GESAMT:', 'ALLES OK' if ok else 'FEHLER'); os._exit(0)
