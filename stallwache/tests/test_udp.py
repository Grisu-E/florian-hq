import sys, time, threading, configparser, logging, os, socket
import os as _o; sys.path.insert(0, _o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi'))
import sim, stallwache_bridge as br
logging.basicConfig(level=logging.WARNING)
sim.start(); time.sleep(0.3)
ini = configparser.ConfigParser(inline_comment_prefixes=(';', '#')); ini.read(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), '..', 'pi', 'stallwache.ini'), encoding='utf-8')
ini['supabase']['url'] = 'http://127.0.0.1:18080'; ini['supabase']['bridge_secret'] = sim.SECRET
ini['logo']['host'] = '127.0.0.1'; ini['logo']['port'] = '15020'; ini['ziegen']['aktiv'] = 'yes'; ini['ziegen']['port'] = '18090'; ini['kamera']['cam0_url'] = ''
TOK = ini['ziegen']['token']
b = br.Bridge(ini); threading.Thread(target=b.run, daemon=True).start(); time.sleep(1.5)
def ask(t):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(1.5); s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    s.sendto(t.encode(), ('127.0.0.1', 18090))
    try: d, a = s.recvfrom(64); return d.decode()
    except socket.timeout: return None
r1 = ask('HUEHNERHOTEL?' + TOK); r2 = ask('HUEHNERHOTEL?falsch')
print('✅' if r1 == 'HUEHNERHOTEL!18090' else '❌', 'richtiges Kennwort → Antwort', r1)
print('✅' if r2 is None else '❌', 'falsches Kennwort → keine Antwort', r2)
os._exit(0)
