#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Hühnerhotel – Installation auf dem Raspberry Pi
#  Aufruf im entpackten Ordner:   bash install.sh
#  Das Skript fragt nur ein paar Dinge ab und erledigt den Rest.
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"
ZIEL=/opt/stallwache
INI=$ZIEL/stallwache.ini
BENUTZER=${SUDO_USER:-$(whoami)}
gelb() { printf "\033[1;33m%s\033[0m\n" "$*"; }
gruen() { printf "\033[1;32m%s\033[0m\n" "$*"; }
rot() { printf "\033[1;31m%s\033[0m\n" "$*"; }
frage() { local t="$1" d="$2" v; read -r -p "$t [${d}]: " v </dev/tty; echo "${v:-$d}"; }
setze() { # setze <abschnitt> <schlüssel> <wert>
  sudo python3 - "$INI" "$1" "$2" "$3" <<'PY'
import sys, re
p, sec, key, val = sys.argv[1:5]
s = open(p, encoding="utf-8").read()
m = re.search(r"^\[" + re.escape(sec) + r"\]\s*$", s, re.M)
end = re.search(r"^\[", s[m.end():], re.M)
blk_end = m.end() + (end.start() if end else len(s) - m.end())
blk = s[m.end():blk_end]
pat = re.compile(r"^" + re.escape(key) + r"\s*=.*$", re.M)
blk = pat.sub(lambda _: f"{key} = {val}", blk, count=1) if pat.search(blk) else blk.rstrip("\n") + f"\n{key} = {val}\n"
open(p, "w", encoding="utf-8").write(s[:m.end()] + blk + s[blk_end:])
PY
}
lies() { sudo python3 -c "import configparser;c=configparser.ConfigParser(inline_comment_prefixes=(';','#'));c.read('$INI',encoding='utf-8');print(c.get('$1','$2',fallback=''))"; }

gelb "🐔 Hühnerhotel-Brücke wird installiert"
echo

# ─── 1. Pakete ───
gelb "1/6  Pakete (ffmpeg für Kamerabilder) …"
sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg python3 >/dev/null
gruen "     ok"

# ─── 2. Dateien ───
gelb "2/6  Dateien nach $ZIEL …"
sudo mkdir -p "$ZIEL"
sudo cp stallwache_bridge.py "$ZIEL/"
if [ -f "$INI" ]; then
  echo "     vorhandene Einstellungen bleiben erhalten"
else
  sudo cp stallwache.ini "$ZIEL/"
fi
sudo chown -R "$BENUTZER":"$BENUTZER" "$ZIEL"; sudo chmod 600 "$INI"
gruen "     ok"

# ─── 3. Fragen ───
gelb "3/6  Ein paar Angaben (Enter = Vorschlag übernehmen)"
LOGO_IP=$(frage "     IP-Adresse der LOGO" "$(lies logo host)")
setze logo host "$LOGO_IP"
echo "     Kamera: RTSP-Adresse (leer lassen = Kamera später einrichten)"
echo "       z. B. rtsp://admin:PASSWORT@192.168.179.11:554/11"
CAM=$(frage "     Kamera-Adresse" "$(lies kamera cam0_url)")
setze kamera cam0_url "$CAM"
CAM_IP=$(echo "$CAM" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | tail -1 || true)
if [[ "$CAM_IP" == 192.168.179.* ]]; then
  echo "     Die Kamera liegt im FRITZ!Box-Gastnetz. Der Pi verbindet sich zusätzlich per WLAN damit."
  echo "     (Vorher in der FRITZ!Box: Gastzugang → „Geräte dürfen untereinander kommunizieren“ anhaken)"
  GAST=$(frage "     Name des Gast-WLANs (leer = überspringen)" "")
  if [ -n "$GAST" ]; then
    read -r -s -p "     Passwort des Gast-WLANs: " GASTPW </dev/tty; echo
    if command -v nmcli >/dev/null; then
      if sudo nmcli dev wifi connect "$GAST" password "$GASTPW" ifname wlan0 >/dev/null && \
         sudo nmcli con modify "$GAST" ipv4.never-default yes ipv4.route-metric 600 && \
         sudo nmcli con up "$GAST" >/dev/null; then gruen "     Gast-WLAN verbunden (Internet bleibt am Kabel)"
      else rot "     Gast-WLAN-Verbindung hat nicht geklappt – siehe Anleitung"; fi
    else
      rot "     nmcli fehlt (älteres Raspberry Pi OS) – Gast-WLAN bitte von Hand einrichten, siehe Anleitung"
    fi
  fi
fi
ZIEG=$(frage "     Ziegentür-Reader schon montiert? (j/n)" "n")
if [[ "$ZIEG" =~ ^[jJyY] ]]; then setze ziegen aktiv yes; else setze ziegen aktiv no; fi
gruen "     gespeichert in $INI"

# ─── 4. Dienst ───
gelb "4/6  Dienst einrichten …"
sudo tee /etc/systemd/system/stallwache.service >/dev/null <<EOF
[Unit]
Description=Hühnerhotel-Brücke (LOGO ↔ App)
After=network-online.target
Wants=network-online.target

[Service]
User=$BENUTZER
WorkingDirectory=$ZIEL
ExecStart=/usr/bin/python3 $ZIEL/stallwache_bridge.py -c $INI
Restart=always
RestartSec=10
Nice=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload; sudo systemctl enable stallwache >/dev/null
gruen "     ok"

# ─── 5. Tests ───
gelb "5/6  Verbindungen testen …"
B="python3 $ZIEL/stallwache_bridge.py -c $INI"
if $B --sync >/dev/null 2>&1; then gruen "     ✔ Supabase (App) erreichbar"; else rot "     ✘ Supabase nicht erreichbar – Internet am Pi prüfen"; fi
if ping -c 1 -W 2 "$LOGO_IP" >/dev/null 2>&1; then
  OUT=$($B --test 2>&1 || true)
  if echo "$OUT" | grep -q "LOGO erreichbar: True"; then gruen "     ✔ LOGO antwortet"; echo "$OUT" | sed 's/^/       /'
  else rot "     ✘ LOGO antwortet nicht auf Modbus – in LOGO!Soft „Modbus-Zugriff zulassen“ aktivieren"; fi
else rot "     ✘ LOGO ($LOGO_IP) nicht erreichbar – IP und Netzwerkkabel prüfen"; fi
if [ -n "$CAM" ]; then
  if $B --snapshot 2>&1 | grep -q "kB"; then gruen "     ✔ Kamerabild hochgeladen – in der App unter 📷 sichtbar"
  else rot "     ✘ Kein Kamerabild – RTSP-Adresse/Passwort prüfen (erst mit VLC testen)"; fi
fi

# ─── 6. Start ───
gelb "6/6  Starten …"
sudo systemctl restart stallwache
sleep 3
if systemctl is-active --quiet stallwache; then gruen "     ✔ läuft – die App zeigt jetzt „Stall online“"; else rot "     ✘ startet nicht – Log: journalctl -u stallwache -n 50"; fi

echo
PI_IP=$(hostname -I | awk '{print $1}')
gruen "Fertig! 🐔"
echo "  Log ansehen:        journalctl -u stallwache -f"
echo "  Einstellungen:      nano $INI   (danach: sudo systemctl restart stallwache)"
echo "  IP dieses Pi:       $PI_IP   (der Ziegentür-Reader findet ihn automatisch)"
