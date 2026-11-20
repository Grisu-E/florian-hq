#!/usr/bin/env python3
"""
Hühnerhotel-Brücke – läuft auf dem Raspberry Pi im Netz des Hühnerstalls.

* liest die Siemens LOGO! 8 per Modbus TCP (Endschalter, Motor-Ausgänge, optional Temperatur)
* meldet den Zustand an Supabase und holt Befehle (Klappe auf/zu) aus der App ab
* gibt Befehle als kurzen Impuls auf ein V-Bit (Netzwerkeingang) der LOGO
* überwacht Zeiten und meldet Alarme (abends noch offen, morgens noch zu, Störung)
* holt per ffmpeg Standbilder von den Kameras (RTSP) und lädt sie hoch

Nur Python-Standardbibliothek + ffmpeg. Aufruf:
  python3 stallwache_bridge.py                 # Dauerbetrieb
  python3 stallwache_bridge.py --test          # LOGO einmal auslesen und anzeigen
  python3 stallwache_bridge.py --pulse auf     # Testimpuls „auf“ (oder „zu“)
  python3 stallwache_bridge.py --snapshot      # Testbild von jeder Kamera holen und hochladen
  python3 stallwache_bridge.py --sync          # Verbindung zu Supabase testen
"""
import argparse, configparser, json, logging, math, os, queue, re, socket, struct, subprocess, sys, threading, time
import urllib.request, urllib.error
from datetime import datetime, date, timedelta, timezone
try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Europe/Berlin")
except Exception:  # sehr alte Python-Version
    TZ = None

VERSION = "1.0"
log = logging.getLogger("stallwache")


def now_local():
    return datetime.now(TZ) if TZ else datetime.now()


# ═════════════════════════ Modbus TCP (minimal) ═════════════════════════
class ModbusError(Exception):
    pass


class ModbusTCP:
    """Kleiner Modbus-TCP-Client für FC1/2/3/4/5/6 – reicht für die LOGO! 8."""

    def __init__(self, host, port=502, unit=1, timeout=3.0):
        self.host, self.port, self.unit, self.timeout = host, int(port), int(unit), timeout
        self.sock = None
        self.tid = 0
        self.lock = threading.Lock()

    def close(self):
        if self.sock:
            try:
                self.sock.close()
            except OSError:
                pass
        self.sock = None

    def _connect(self):
        if self.sock is None:
            self.sock = socket.create_connection((self.host, self.port), timeout=self.timeout)
            self.sock.settimeout(self.timeout)

    def _recv(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise ModbusError("Verbindung von der LOGO geschlossen")
            buf += chunk
        return buf

    def _req(self, pdu):
        with self.lock:
            for attempt in (1, 2):
                try:
                    self._connect()
                    self.tid = (self.tid + 1) & 0xFFFF
                    self.sock.sendall(struct.pack(">HHHB", self.tid, 0, len(pdu) + 1, self.unit) + pdu)
                    hdr = self._recv(7)
                    tid, _pid, ln, _unit = struct.unpack(">HHHB", hdr)
                    body = self._recv(ln - 1)
                    if tid != self.tid:
                        raise ModbusError("falsche Transaktions-ID")
                    if body[0] & 0x80:
                        raise ModbusError(f"LOGO meldet Modbus-Fehler {body[1]} bei Funktion {body[0] & 0x7F}")
                    return body
                except (OSError, ModbusError, struct.error) as e:
                    self.close()
                    if attempt == 2:
                        raise ModbusError(str(e)) from e

    def read_bits(self, fc, addr, count=1):
        b = self._req(struct.pack(">BHH", fc, addr, count))
        data = b[2:2 + b[1]]
        return [bool(data[i // 8] >> (i % 8) & 1) for i in range(count)]

    def read_regs(self, fc, addr, count=1):
        b = self._req(struct.pack(">BHH", fc, addr, count))
        return list(struct.unpack(">" + "h" * count, b[2:2 + 2 * count]))

    def write_coil(self, addr, value):
        self._req(struct.pack(">BHH", 5, addr, 0xFF00 if value else 0x0000))


# Adressen nach Siemens-Tabelle „LOGO! 8 Modbus-Adressen“ (1-basiert) → 0-basierte Protokolladresse
#   I1..I24   Discrete Inputs 1..24          (FC2)
#   Q1..Q20   Coils 8193..8212               (FC1)
#   M1..M64   Coils 8257..8320               (FC1/FC5)
#   V0.0..    Coils 1..6808  (Byte*8+Bit+1)  (FC1/FC5)
#   AI1..AI8  Input Register 1..8            (FC4)
#   VW0..     Holding Register 1..425 (VW n → n/2+1) (FC3)
#   AM1..AM64 Holding Register 529..592      (FC3)
ADDR_RE = re.compile(r"^(!?)\s*(I|Q|M|V|AI|VW|AM)\s*(\d+)(?:\.(\d))?$", re.I)


class Signal:
    def __init__(self, spec):
        m = ADDR_RE.match(spec.strip())
        if not m:
            raise ValueError(f"Unbekannte LOGO-Adresse: {spec!r} (Beispiele: I3, Q1, M5, V0.0, AI1, !I4)")
        self.spec = spec.strip()
        self.invert = m.group(1) == "!"
        area, n, bit = m.group(2).upper(), int(m.group(3)), m.group(4)
        self.area = area
        if area == "I":
            self.kind, self.fc, self.addr = "bit", 2, n - 1
        elif area == "Q":
            self.kind, self.fc, self.addr = "bit", 1, 8192 + n - 1
        elif area == "M":
            self.kind, self.fc, self.addr = "bit", 1, 8256 + n - 1
        elif area == "V":
            if bit is None:
                raise ValueError(f"V-Adresse braucht ein Bit, z. B. V0.0 (nicht {spec!r})")
            self.kind, self.fc, self.addr = "bit", 1, n * 8 + int(bit)
        elif area == "AI":
            self.kind, self.fc, self.addr = "reg", 4, n - 1
        elif area == "VW":
            self.kind, self.fc, self.addr = "reg", 3, n // 2
        elif area == "AM":
            self.kind, self.fc, self.addr = "reg", 3, 528 + n - 1
        self.writable = area in ("V", "M")

    def read(self, mb):
        if self.kind == "bit":
            v = mb.read_bits(self.fc, self.addr)[0]
            return (not v) if self.invert else v
        return mb.read_regs(self.fc, self.addr)[0]


# ═════════════════════════ Sonnenzeiten (NOAA) ═════════════════════════
def sun_times(d: date, lat: float, lon: float):
    """Sonnenauf-/-untergang als UTC-datetime (gleiche Formel wie in der App)."""
    n = d.timetuple().tm_yday
    g = 2 * math.pi / 365 * (n - 1)
    eq = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    dec = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g)
           + 0.000907 * math.sin(2 * g) - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    r = math.radians
    cos_h = math.cos(r(90.833)) / (math.cos(r(lat)) * math.cos(dec)) - math.tan(r(lat)) * math.tan(dec)
    if not -1 <= cos_h <= 1:
        return None, None
    ha = math.degrees(math.acos(cos_h))
    base = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    return base + timedelta(minutes=720 - 4 * (lon + ha) - eq), base + timedelta(minutes=720 - 4 * (lon - ha) - eq)


def hm_to_dt(d: date, s: str):
    try:
        h, m = [int(x) for x in (s or "").split(":")[:2]]
    except ValueError:
        return None
    return datetime(d.year, d.month, d.day, h, m, tzinfo=TZ)


def plan_for(d: date, cfg: dict):
    lat, lon = float(cfg.get("lat") or 47.67), float(cfg.get("lon") or 9.59)
    rise, sset = sun_times(d, lat, lon)
    rise = rise.astimezone(TZ) if rise else None
    sset = sset.astimezone(TZ) if sset else None
    if cfg.get("zeitart") == "fix" or rise is None:
        auf, zu = hm_to_dt(d, cfg.get("auf_fix", "07:00")), hm_to_dt(d, cfg.get("zu_fix", "20:00"))
    else:
        auf = rise + timedelta(minutes=float(cfg.get("auf_offset") or 0))
        zu = sset + timedelta(minutes=float(cfg.get("zu_offset") or 0))
        fr, sp = hm_to_dt(d, cfg.get("auf_frueheste")), hm_to_dt(d, cfg.get("zu_spaeteste"))
        if fr and auf < fr:
            auf = fr
        if sp and zu > sp:
            zu = sp
    alarm = timedelta(minutes=max(5, float(cfg.get("alarm_min") or 30)))
    return {"rise": rise, "set": sset, "auf": auf, "zu": zu, "alarm_zu": zu + alarm, "alarm_auf": auf + alarm}


def hm(dt):
    return dt.strftime("%H:%M") if dt else None


# ═════════════════════════ Supabase ═════════════════════════
class Supabase:
    def __init__(self, url, key, secret):
        self.url, self.key, self.secret = url.rstrip("/"), key, secret

    def _headers(self, extra=None):
        h = {"apikey": self.key, "Content-Type": "application/json"}
        if self.key.startswith("eyJ"):  # alter anon-JWT
            h["Authorization"] = "Bearer " + self.key
        if extra:
            h.update(extra)
        return h

    def rpc(self, name, args, timeout=10):
        req = urllib.request.Request(f"{self.url}/rest/v1/rpc/{name}", data=json.dumps(args).encode(), headers=self._headers(), method="POST")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Supabase {name}: HTTP {e.code} {e.read()[:200]!r}") from None

    def sync(self, state, events):
        return self.rpc("hs_bridge_sync", {"p_secret": self.secret, "p_state": state, "p_events": events})

    def ack(self, cid, ok, result):
        return self.rpc("hs_bridge_ack", {"p_secret": self.secret, "p_id": cid, "p_ok": ok, "p_result": result})

    def upload_snapshot(self, cam, jpeg, archive=False, label=""):
        q = f"cam={cam}&archive={'1' if archive else '0'}" + (f"&label={label}" if label else "")
        req = urllib.request.Request(f"{self.url}/functions/v1/hs-snap?{q}", data=jpeg,
                                     headers={"x-bridge-secret": self.secret, "Content-Type": "image/jpeg", "apikey": self.key}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Bild-Upload: HTTP {e.code} {e.read()[:200]!r}") from None


# ═════════════════════════ Kameras ═════════════════════════
def grab_jpeg(url, width=1280, timeout=15):
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-rtsp_transport", "tcp", "-i", url,
           "-frames:v", "1", "-vf", f"scale='min({width},iw)':-2", "-q:v", "6", "-f", "image2", "-c:v", "mjpeg", "pipe:1"]
    if url.startswith("http"):
        cmd = [c for c in cmd if c not in ("-rtsp_transport", "tcp")]
    p = subprocess.run(cmd, capture_output=True, timeout=timeout)
    if p.returncode != 0 or len(p.stdout) < 1000:
        raise RuntimeError(f"ffmpeg: {p.stderr.decode(errors='ignore').strip()[:200] or 'kein Bild'}")
    return p.stdout


class CamWorker(threading.Thread):
    """Holt Bilder im Hintergrund, damit die LOGO-Abfrage nie blockiert."""

    def __init__(self, sb, cams):
        super().__init__(daemon=True)
        self.sb, self.cams = sb, cams
        self.q = queue.Queue(maxsize=8)
        self.busy = threading.Event()
        self.ok = [None] * len(cams)

    def request(self, cam, archive=False, label=""):
        try:
            self.q.put_nowait((cam, archive, label))
        except queue.Full:
            pass

    def run(self):
        while True:
            cam, archive, label = self.q.get()
            self.busy.set()
            try:
                jpg = grab_jpeg(self.cams[cam]["url"])
                self.sb.upload_snapshot(cam, jpg, archive, label)
                self.ok[cam] = True
                log.debug("Bild cam%s hochgeladen (%d kB%s)", cam, len(jpg) // 1024, ", Archiv" if archive else "")
            except Exception as e:
                if self.ok[cam] is not False:
                    log.warning("Kamera %s: %s", self.cams[cam]["name"], e)
                self.ok[cam] = False
            finally:
                self.busy.clear()


# ═════════════════════════ Brücke ═════════════════════════
class Bridge:
    def __init__(self, ini):
        self.ini = ini
        L = ini["logo"]
        self.mb = ModbusTCP(L.get("host"), L.getint("port", 502), L.getint("unit_id", 1))
        sig = lambda k: Signal(L[k]) if L.get(k, "").strip() else None
        self.sig = {k: sig(k) for k in ("endschalter_oben", "endschalter_unten", "motor_auf", "motor_zu", "stoerung", "temperatur")}
        self.cmd_auf, self.cmd_zu = sig("befehl_auf"), sig("befehl_zu")
        for s in (self.cmd_auf, self.cmd_zu):
            if s and not s.writable:
                raise ValueError(f"Befehls-Adresse {s.spec} muss ein V-Bit oder Merker sein (z. B. V0.0)")
        self.pulse_s = L.getfloat("impuls_ms", 800) / 1000
        self.fahrzeit = L.getfloat("fahrzeit_max_s", 60)
        self.temp_f, self.temp_o = L.getfloat("temperatur_faktor", 0.1), L.getfloat("temperatur_offset", 0)
        S = ini["supabase"]
        self.sb = Supabase(S["url"], S["key"], S["bridge_secret"])
        K = ini["kamera"] if ini.has_section("kamera") else {}
        self.cams = []
        for i in range(4):
            url = (K.get(f"cam{i}_url") or "").strip()
            if url:
                self.cams.append({"name": (K.get(f"cam{i}_name") or f"Kamera {i + 1}").strip(), "url": url})
        self.snap_every = float(K.get("bild_alle_min", 10) or 10) * 60
        self.live_every = float(K.get("live_alle_s", 3) or 3)
        self.cam = CamWorker(self.sb, self.cams) if self.cams else None
        self.poll_s = L.getfloat("abfrage_s", 2)
        # Laufzeit-Zustand
        self.cfg = {}
        self.events = []
        self.door = "unbekannt"
        self.stable = None          # letzte Endlage: offen/zu
        self.io = {}
        self.logo_ok = None
        self.running = None         # {"id","cmd","t0","by"}
        self.last_cmd_src = None    # (Quelle, Zeit) für das nächste auf/zu-Ereignis
        self.done = {}              # Tageskennzeichen für Zeitsteuerung/Alarme
        self.motor_since = None
        self.motor_reported = False
        self.last_snap = 0
        self.last_live = 0
        self.server_offset = 0.0
        self.live_until = None
        self.sync_fail = 0

    # ───── LOGO ─────
    def read_logo(self):
        io, raw = {}, {}
        labels = {"endschalter_oben": "Endschalter oben", "endschalter_unten": "Endschalter unten", "motor_auf": "Motor auf",
                  "motor_zu": "Motor zu", "stoerung": "Störung"}
        try:
            for k, s in self.sig.items():
                if s is None:
                    continue
                v = s.read(self.mb)
                raw[k] = v
                if k == "temperatur":
                    io["Temperatur"] = round(v * self.temp_f + self.temp_o, 1)
                else:
                    io[labels[k]] = bool(v)
            if not self.logo_ok:
                log.info("LOGO %s erreichbar", self.mb.host)
                if self.logo_ok is False:
                    self.event("info", "LOGO wieder erreichbar")
            self.logo_ok = True
        except ModbusError as e:
            if self.logo_ok is not False:
                log.warning("LOGO nicht erreichbar: %s", e)
                self.event("fehler", f"LOGO nicht erreichbar ({e})")
            self.logo_ok = False
            return None, {}
        return raw, io

    def derive(self, raw):
        if raw is None:
            return "unbekannt"
        o, u = raw.get("endschalter_oben"), raw.get("endschalter_unten")
        ma, mz = raw.get("motor_auf"), raw.get("motor_zu")
        if raw.get("stoerung") or (o and u):
            return "stoerung"
        if ma:
            return "oeffnet"
        if mz:
            return "schliesst"
        if o:
            return "offen"
        if u:
            return "zu"
        if o is None and u is None:
            return self.stable or "unbekannt"   # keine Endschalter konfiguriert
        return "zwischen"

    def pulse(self, which):
        s = self.cmd_auf if which == "auf" else self.cmd_zu
        if s is None:
            raise RuntimeError(f"keine Befehls-Adresse für „{which}“ konfiguriert")
        self.mb.write_coil(s.addr, True)
        time.sleep(self.pulse_s)
        self.mb.write_coil(s.addr, False)

    # ───── Ereignisse ─────
    def event(self, kind, text, source="stall"):
        log.info("Ereignis %s: %s", kind, text)
        self.events.append({"kind": kind, "text": text, "source": source})
        self.events = self.events[-100:]

    # ───── Befehle ─────
    def run_command(self, c):
        which = "auf" if c["cmd"] == "open" else "zu"
        target = "offen" if which == "auf" else "zu"
        if not self.logo_ok:
            self.safe_ack(c["id"], False, "LOGO nicht erreichbar")
            return
        if self.door == target:
            self.safe_ack(c["id"], True, f"Klappe war schon {target}")
            return
        try:
            self.pulse(which)
        except Exception as e:
            self.safe_ack(c["id"], False, f"Impuls fehlgeschlagen: {e}")
            self.event("fehler", f"Befehl „{which}“ konnte nicht an die LOGO gesendet werden: {e}")
            return
        self.last_cmd_src = ("per App", time.time())
        if self.sig["endschalter_oben"] is None and self.sig["endschalter_unten"] is None:
            self.safe_ack(c["id"], True, "Impuls an LOGO gesendet (keine Endschalter konfiguriert)")
            return
        self.running = {"id": c["id"], "target": target, "t0": time.time(), "which": which}

    def check_running(self):
        r = self.running
        if not r:
            return
        if self.door == r["target"]:
            self.safe_ack(r["id"], True, f"Klappe {r['target']} nach {int(time.time() - r['t0'])} s")
            self.running = None
        elif time.time() - r["t0"] > self.fahrzeit:
            self.safe_ack(r["id"], False, f"Endlage nicht erreicht nach {int(self.fahrzeit)} s")
            self.event("fehler", f"Klappe hat beim {'Öffnen' if r['which'] == 'auf' else 'Schließen'} die Endlage nicht erreicht – bitte nachsehen!")
            self.running = None
            self.motor_reported = True

    def safe_ack(self, cid, ok, text):
        try:
            self.sb.ack(cid, ok, text)
        except Exception as e:
            log.warning("Quittung fehlgeschlagen: %s", e)

    # ───── Zeitsteuerung & Alarme ─────
    def flag(self, key):
        k = (key, date.today().isoformat())
        if k in self.done:
            return False
        self.done[k] = True
        if len(self.done) > 50:
            for x in sorted(self.done)[:-20]:
                self.done.pop(x, None)
        return True

    def timers(self):
        if not self.cfg or self.logo_ok is False:
            return
        now = now_local()
        p = plan_for(now.date(), self.cfg)
        auf, zu = p["auf"], p["zu"]
        app_mode = self.cfg.get("steuerung") == "app"
        # Pi steuert nach Zeit (nur wenn in der App „Pi / App“ gewählt)
        if app_mode and auf and auf <= now < zu and now - auf < timedelta(hours=2) and self.door in ("zu", "zwischen") and self.flag("auf"):
            log.info("Zeitsteuerung: öffnen")
            try:
                self.pulse("auf"); self.last_cmd_src = ("nach Zeitplan (Pi)", time.time())
            except Exception as e:
                self.event("fehler", f"Zeitsteuerung konnte nicht öffnen: {e}")
        if app_mode and zu and now >= zu and now - zu < timedelta(hours=3) and self.door in ("offen", "zwischen") and self.flag("zu"):
            log.info("Zeitsteuerung: schließen")
            try:
                self.pulse("zu"); self.last_cmd_src = ("nach Zeitplan (Pi)", time.time())
            except Exception as e:
                self.event("fehler", f"Zeitsteuerung konnte nicht schließen: {e}")
        # Alarm: abends noch offen
        if now >= p["alarm_zu"] and now.hour >= 12 and self.door not in ("zu", "unbekannt") and self.flag("alarm_zu"):
            self.event("alarm", f"Klappe ist um {now:%H:%M} noch nicht zu (sollte seit {hm(zu)} zu sein) – Fuchsgefahr!")
        # Alarm: morgens noch zu
        if p["alarm_auf"] <= now < zu and self.door == "zu" and self.flag("alarm_auf"):
            self.event("alarm", f"Klappe ist um {now:%H:%M} noch zu (sollte seit {hm(auf)} offen sein)")
        # Motor läuft zu lange
        if self.door in ("oeffnet", "schliesst"):
            self.motor_since = self.motor_since or time.time()
            if not self.running and not self.motor_reported and time.time() - self.motor_since > self.fahrzeit:
                self.motor_reported = True
                self.event("fehler", f"Motor läuft seit über {int(self.fahrzeit)} s – Klappe klemmt?")
        else:
            self.motor_since = None
            self.motor_reported = False
        return p

    # ───── Hauptschleife ─────
    def info(self, p):
        i = {"version": VERSION, "logo_ok": self.logo_ok, "steuerung": self.cfg.get("steuerung", "logo")}
        if self.cams:
            i["cams"] = [c["name"] for c in self.cams]
            i["cam_ok"] = self.cam.ok
        if p:
            i.update(sunrise=hm(p["rise"]), sunset=hm(p["set"]), plan_auf=hm(p["auf"]), plan_zu=hm(p["zu"]), alarm_ab=hm(p["alarm_zu"]))
        if "Temperatur" in self.io:
            i["temp"] = self.io["Temperatur"]
        return i

    def step(self):
        raw, io = self.read_logo()
        self.io = io
        new = self.derive(raw)
        if new != self.door:
            log.info("Klappe: %s → %s", self.door, new)
        self.door = new
        if new in ("offen", "zu") and new != self.stable:
            if self.stable is not None:
                src = self.last_cmd_src[0] if self.last_cmd_src and time.time() - self.last_cmd_src[1] < self.fahrzeit + 30 else (
                    "LOGO-Astro / Taster" if self.cfg.get("steuerung") != "app" else "LOGO / Taster")
                self.event("auf" if new == "offen" else "zu", f"Klappe {'geöffnet' if new == 'offen' else 'geschlossen'} – {src}")
                if self.cam:
                    for i in range(len(self.cams)):
                        self.cam.request(i, archive=True, label="auf" if new == "offen" else "zu")
            self.stable = new
            self.last_cmd_src = None
        if new == "stoerung" and self.flag(f"stoer{now_local():%H}"):
            self.event("fehler", "LOGO meldet Störung an der Klappe")
        self.check_running()
        p = self.timers()

        state = {"door": self.door, "io": self.io, "info": self.info(p)}
        events, self.events = self.events, []
        try:
            res = self.sb.sync(state, events)
            if self.sync_fail:
                log.info("Supabase wieder erreichbar")
            self.sync_fail = 0
        except Exception as e:
            self.events = events + self.events   # später erneut senden
            self.sync_fail += 1
            if self.sync_fail in (1, 10) or self.sync_fail % 150 == 0:
                log.warning("Sync fehlgeschlagen (%sx): %s", self.sync_fail, e)
            return
        if isinstance(res, dict):
            self.cfg = res.get("config") or self.cfg
            st = res.get("server_time")
            if st:
                self.server_offset = datetime.fromisoformat(st.replace("Z", "+00:00")).timestamp() - time.time()
            lu = res.get("live_until")
            self.live_until = datetime.fromisoformat(lu.replace("Z", "+00:00")).timestamp() if lu else None
            for c in res.get("commands") or []:
                log.info("Befehl aus der App: %s (#%s)", c["cmd"], c["id"])
                self.run_command(c)
        self.cameras()

    def cameras(self):
        if not self.cam:
            return
        t = time.time()
        live = self.live_until and self.live_until > t + self.server_offset
        if live and t - self.last_live >= self.live_every and not self.cam.busy.is_set() and self.cam.q.empty():
            for i in range(len(self.cams)):
                self.cam.request(i)
            self.last_live = t
            self.last_snap = t
        elif t - self.last_snap >= self.snap_every:
            for i in range(len(self.cams)):
                self.cam.request(i)
            self.last_snap = t

    def run(self):
        log.info("Hühnerhotel-Brücke %s startet – LOGO %s:%s, %d Kamera(s)", VERSION, self.mb.host, self.mb.port, len(self.cams))
        if self.cam:
            self.cam.start()
        self.event("start", f"Brücke gestartet (v{VERSION})")
        while True:
            t0 = time.time()
            try:
                self.step()
            except Exception:
                log.exception("Fehler im Durchlauf")
            time.sleep(max(0.2, self.poll_s - (time.time() - t0)))


# ═════════════════════════ Kommandozeile ═════════════════════════
def main():
    ap = argparse.ArgumentParser(description="Hühnerhotel-Brücke (LOGO! 8 ↔ Supabase)")
    ap.add_argument("-c", "--config", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "stallwache.ini"))
    ap.add_argument("--test", action="store_true", help="LOGO einmal auslesen")
    ap.add_argument("--pulse", choices=["auf", "zu"], help="Testimpuls an die LOGO")
    ap.add_argument("--snapshot", action="store_true", help="Testbild jeder Kamera hochladen")
    ap.add_argument("--sync", action="store_true", help="Supabase-Verbindung testen")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO, format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
    ini = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
    if not ini.read(a.config, encoding="utf-8"):
        sys.exit(f"Konfiguration nicht gefunden: {a.config}")
    b = Bridge(ini)
    if a.test:
        raw, io = b.read_logo()
        print("LOGO erreichbar:", b.logo_ok)
        for k, v in io.items():
            print(f"  {k:20s} {v}")
        print("Klappe:", b.derive(raw))
        return
    if a.pulse:
        b.read_logo(); b.pulse(a.pulse); print(f"Impuls „{a.pulse}“ gesendet."); return
    if a.snapshot:
        for i, c in enumerate(b.cams):
            try:
                jpg = grab_jpeg(c["url"]); print(f"{c['name']}: {len(jpg) // 1024} kB", b.sb.upload_snapshot(i, jpg))
            except Exception as e:
                print(f"{c['name']}: FEHLER {e}")
        return
    if a.sync:
        print(json.dumps(b.sb.sync(None, [{"kind": "info", "text": "Verbindungstest vom Pi"}]), indent=2, ensure_ascii=False)); return
    b.run()


if __name__ == "__main__":
    main()
