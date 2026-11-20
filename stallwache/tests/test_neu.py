import sys, time, threading, configparser, logging, os, json
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.WARNING)
sim.start(); time.sleep(0.3)
sim.CFG['traenke'] = {'modus': 'auto', 'ein': 1, 'aus': 3}
ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#')); ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['endschalter_oben']='I3'; ini['logo']['endschalter_unten']='I4'; ini['logo']['motor_auf']='Q1'; ini['logo']['motor_zu']='Q2'; ini['logo']['motor'] = ''; ini['logo']['soll_offen'] = ''; ini['ziegen']['tuerkontakt']='I5'; ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['logo']['abfrage_s'] = '0.5'; ini['logo']['temperatur'] = 'AI1'
ini['kamera']['cam0_url'] = 'http://127.0.0.1:18080/cam.jpg'; ini['kamera']['cam1_url'] = ''
b = br.Bridge(ini); threading.Thread(target=b.run, daemon=True).start(); time.sleep(1.5)
ok = True
def check(n, c):
    global ok; ok &= bool(c); print(('✅' if c else '❌'), n)
V04 = 4
# Nr. 7: Klappe öffnen und schließen → Ereignis zu mit Bild
sim.STATE['cmds'] = [{'id': 41, 'cmd': 'open'}]; time.sleep(5)
sim.STATE['cmds'] = [{'id': 42, 'cmd': 'close'}]; time.sleep(6)
zu = [e for e in sim.STATE['events'] if e['kind'] == 'zu']
check(f'Ereignis „zu“ mit Bild: {zu}', zu and zu[-1].get('bild', '').startswith('archiv/'))
check('genau ein „zu“-Ereignis', len(zu) == 1)
auf = [e for e in sim.STATE['events'] if e['kind'] == 'auf']
check('„auf“ sofort ohne Bild', auf and 'bild' not in auf[-1])
# Nr. 9: Heizung
check(f'4,5 °C → Heizung aus (V0.4={sim.LOGO.coils.get(V04)})', sim.LOGO.coils.get(V04) is False)
sim.LOGO.ir[0] = -20; time.sleep(1.5)
check('−2,0 °C → Heizung EIN', sim.LOGO.coils.get(V04) is True)
sim.LOGO.ir[0] = 20; time.sleep(1.5)
check('2,0 °C (zwischen Schwellen) → bleibt EIN (Hysterese)', sim.LOGO.coils.get(V04) is True)
sim.LOGO.ir[0] = 35; time.sleep(1.5)
check('3,5 °C → Heizung aus', sim.LOGO.coils.get(V04) is False)
sim.CFG['traenke'] = {'modus': 'an', 'ein': 1, 'aus': 3}; time.sleep(1.5)
check('Modus „an“ → EIN', sim.LOGO.coils.get(V04) is True)
check('info.heizung gemeldet', (sim.STATE['last_state']['info'].get('heizung') or {}).get('modus') == 'an')
sim.CFG['traenke'] = {'modus': 'aus'}; time.sleep(1.5)
check('Modus „aus“ → aus', sim.LOGO.coils.get(V04) is False)
print([e['text'] for e in sim.STATE['events'] if 'Tränke' in e['text']])
print('GESAMT:', 'ALLES OK' if ok else 'FEHLER'); os._exit(0)
