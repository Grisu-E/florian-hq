import sys, time, threading, configparser, logging, os
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.WARNING)
sim.start(); time.sleep(0.3)
ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#')); ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['endschalter_oben']='I3'; ini['logo']['endschalter_unten']='I4'; ini['logo']['motor_auf']='Q1'; ini['logo']['motor_zu']='Q2'; ini['logo']['motor'] = ''; ini['logo']['soll_offen'] = ''; ini['ziegen']['tuerkontakt']='I5'; ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['logo']['abfrage_s'] = '0.5'; ini['kamera']['cam0_url'] = ''
b = br.Bridge(ini); threading.Thread(target=b.run, daemon=True).start(); time.sleep(1.5)
ok = True
def check(n, c):
    global ok; ok &= bool(c); print(('✅' if c else '❌'), n)
check('ohne Stallpflicht: V0.3 = 0', not sim.LOGO.coils.get(3))
sim.CFG['stallpflicht'] = {'aktiv': True}; time.sleep(1.2)
check('Stallpflicht: V0.3 = 1', sim.LOGO.coils.get(3) is True)
check('info.stallpflicht gemeldet', sim.STATE['last_state']['info'].get('stallpflicht') is True)
sim.STATE['cmds'] = [{'id': 31, 'cmd': 'open'}]; time.sleep(1.2)
check('Öffnen abgelehnt', any(a[0] == 31 and not a[1] and 'Stallpflicht' in a[2] for a in sim.STATE['acks']))
check('V0.0 nicht gesetzt', not sim.LOGO.coils.get(0))
sim.CFG['stallpflicht'] = {'aktiv': False}; time.sleep(1.2)
check('aufgehoben: V0.3 = 0', sim.LOGO.coils.get(3) is False)
print('GESAMT:', 'ALLES OK' if ok else 'FEHLER'); os._exit(0)
