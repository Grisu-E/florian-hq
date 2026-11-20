"""Simulierte LOGO (Modbus TCP) + Fake-Supabase + Testkamera (HTTP-JPEG) für den Brücken-Test."""
import json, socketserver, struct, threading, time, http.server, io
from PIL import Image

# ───── LOGO-Simulation ─────
class Logo:
    def __init__(self):
        self.coils = {}           # protokolladresse → bool (Q, M, V)
        self.di = {2: False, 3: True}  # I3 (oben)=False? -> Index 2 = I3, 3 = I4 ; Start: Klappe zu
        self.ir = {0: 45}         # AI1 = 45 → 4,5 °C
        self.motor = None; self.t0 = 0
        self.lock = threading.Lock()
    def tick(self):
        with self.lock:
            # Netzwerkeingänge V0.0 / V0.1 (Coil 0/1) starten den Motor
            if self.coils.get(0) and self.motor is None and not self.di[2]: self.motor = 'auf'; self.t0 = time.time(); self.di[3] = False
            if self.coils.get(1) and self.motor is None and not self.di[3]: self.motor = 'zu'; self.t0 = time.time(); self.di[2] = False
            self.coils[8192] = self.motor == 'auf'; self.coils[8193] = self.motor == 'zu'
            if self.motor and time.time() - self.t0 > 3:
                if self.motor == 'auf': self.di[2] = True
                else: self.di[3] = True
                self.motor = None
LOGO = Logo()

class MB(socketserver.BaseRequestHandler):
    def handle(self):
        s = self.request
        while True:
            h = s.recv(7)
            if len(h) < 7: return
            tid, pid, ln, unit = struct.unpack('>HHHB', h)
            pdu = s.recv(ln - 1)
            fc = pdu[0]
            with LOGO.lock:
                if fc in (1, 2):
                    a, n = struct.unpack('>HH', pdu[1:5]); src = LOGO.coils if fc == 1 else LOGO.di
                    bits = [src.get(a + i, False) for i in range(n)]; by = bytearray((n + 7) // 8)
                    for i, b in enumerate(bits):
                        if b: by[i // 8] |= 1 << (i % 8)
                    resp = bytes([fc, len(by)]) + bytes(by)
                elif fc in (3, 4):
                    a, n = struct.unpack('>HH', pdu[1:5]); resp = bytes([fc, 2 * n]) + b''.join(struct.pack('>h', LOGO.ir.get(a + i, 0)) for i in range(n))
                elif fc == 5:
                    a, v = struct.unpack('>HH', pdu[1:5])
                    if a >= 8192 and a < 8256: resp = bytes([0x85, 2])  # Q nicht schreibbar
                    else: LOGO.coils[a] = v == 0xFF00; resp = pdu
                else: resp = bytes([fc | 0x80, 1])
            s.sendall(struct.pack('>HHHB', tid, 0, len(resp) + 1, unit) + resp)

# ───── Fake-Supabase ─────
STATE = {'syncs': 0, 'last_state': None, 'events': [], 'acks': [], 'snaps': [], 'cmds': [], 'live_until': None}
CFG = {'steuerung': 'logo', 'zeitart': 'sonne', 'auf_offset': 30, 'zu_offset': 20, 'alarm_min': 30, 'lat': 47.67, 'lon': 9.59, 'auf_frueheste': '06:30', 'zu_spaeteste': '22:00'}
SECRET = 'testgeheimnis'
buf = io.BytesIO(); Image.new('RGB', (640, 360), (60, 90, 40)).save(buf, 'JPEG'); JPG = buf.getvalue()

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, obj, ct='application/json'):
        b = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type', ct); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path == '/cam.jpg': return self.send(200, JPG, 'image/jpeg')
        self.send(404, {})
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        if self.path.startswith('/rest/v1/rpc/'):
            a = json.loads(body)
            if a.get('p_secret') != SECRET: return self.send(400, {'message': 'unauthorized'})
            if self.path.endswith('hs_bridge_sync'):
                STATE['syncs'] += 1
                if a.get('p_state'): STATE['last_state'] = a['p_state']
                STATE['events'] += a.get('p_events') or []
                cmds, STATE['cmds'] = STATE['cmds'], []
                return self.send(200, {'commands': cmds, 'config': CFG, 'live_until': STATE['live_until'], 'server_time': time.strftime('%Y-%m-%dT%H:%M:%S+00:00', time.gmtime())})
            if self.path.endswith('hs_bridge_ack'):
                STATE['acks'].append((a['p_id'], a['p_ok'], a['p_result'])); return self.send(200, b'', 'application/json')
        if self.path.startswith('/functions/v1/hs-snap'):
            if self.headers.get('x-bridge-secret') != SECRET: return self.send(401, {'error': 'unauthorized'})
            STATE['snaps'].append((self.path, len(body), body[:2] == b'\xff\xd8')); return self.send(200, {'ok': True, 'path': 'archiv/2026-11-20_220000_cam0_zu.jpg' if 'archive=1' in self.path else None})
        self.send(404, {})

def start():
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    m = socketserver.ThreadingTCPServer(('127.0.0.1', 15020), MB); threading.Thread(target=m.serve_forever, daemon=True).start()
    h = http.server.ThreadingHTTPServer(('127.0.0.1', 18080), H); threading.Thread(target=h.serve_forever, daemon=True).start()
    def phys():
        while True: LOGO.tick(); time.sleep(0.1)
    threading.Thread(target=phys, daemon=True).start()
