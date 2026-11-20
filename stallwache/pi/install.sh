#!/bin/bash
# Hühnerhotel-Brücke auf dem Raspberry Pi installieren
# Aufruf im entpackten Ordner:  bash install.sh
set -e
ZIEL=/opt/stallwache
BENUTZER=${SUDO_USER:-$(whoami)}

echo "▶ ffmpeg installieren (für Kamerabilder) …"
sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg python3 >/dev/null

echo "▶ Dateien nach $ZIEL kopieren …"
sudo mkdir -p "$ZIEL"
sudo cp stallwache_bridge.py "$ZIEL/"
if [ -f "$ZIEL/stallwache.ini" ]; then
  echo "  (vorhandene stallwache.ini bleibt erhalten)"
else
  sudo cp stallwache.ini "$ZIEL/"
fi
sudo chown -R "$BENUTZER":"$BENUTZER" "$ZIEL"
sudo chmod 600 "$ZIEL/stallwache.ini"

echo "▶ Dienst einrichten …"
sudo tee /etc/systemd/system/stallwache.service >/dev/null <<EOF
[Unit]
Description=Hühnerhotel-Brücke (LOGO ↔ App)
After=network-online.target
Wants=network-online.target

[Service]
User=$BENUTZER
WorkingDirectory=$ZIEL
ExecStart=/usr/bin/python3 $ZIEL/stallwache_bridge.py -c $ZIEL/stallwache.ini
Restart=always
RestartSec=10
Nice=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable stallwache >/dev/null

echo
echo "✅ Installiert. Nächste Schritte:"
echo "   1) IP-Adressen eintragen:      nano $ZIEL/stallwache.ini"
echo "   2) Supabase testen:            python3 $ZIEL/stallwache_bridge.py -c $ZIEL/stallwache.ini --sync"
echo "   3) LOGO testen:                python3 $ZIEL/stallwache_bridge.py -c $ZIEL/stallwache.ini --test"
echo "   4) Kamera testen:              python3 $ZIEL/stallwache_bridge.py -c $ZIEL/stallwache.ini --snapshot"
echo "   5) Starten:                    sudo systemctl start stallwache"
echo "   Log ansehen:                   journalctl -u stallwache -f"
