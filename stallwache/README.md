# 🐔 Hühnerhotel – Anleitung

Überwachung und Steuerung des Hühnerstalls: Klappe (LOGO! 8), Kamera (GENBOLT), Eier, Pflege, Herde und Gesundheit.

```
 Handy (App)  ──►  Supabase (Cloud)  ◄──  Raspberry Pi 3B+  ──Modbus TCP──►  LOGO! 8 ──► Klappen-Motor
 GitHub Pages      Datenbank + Push        (Hof-Netz)          Port 502          Endschalter
                                              └──RTSP (ffmpeg)──► GENBOLT-Kamera
```

Der Pi baut nur **ausgehende** Verbindungen auf. Im Router muss **kein Port geöffnet** werden.
Die **LOGO bleibt der Chef**: Ihre Astro-Uhr fährt die Klappe auch dann, wenn Pi, Richtfunk oder Internet ausfallen.

---

## Inhalt des Pakets

| Ordner | Was | Wohin |
|---|---|---|
| `stallwache/` | Web-App (index.html, sw.js, manifest, Icons) | läuft direkt über GitHub Pages |
| `stallwache/pi/` | Brücken-Programm, Konfiguration, Installationsskript | auf den Raspberry Pi kopieren. In der INI stehen hier im Repo nur **Platzhalter** für Brücken-Geheimnis und Reader-Kennwort, die echten Werte stehen in der `stallwache.ini` aus dem ZIP. ⚠️ Echte Werte **nie** ins Repo committen, das Repo ist öffentlich. |
| `supabase/stallwache.sql` | SQL zum Nachlesen (ist schon eingespielt) | nichts zu tun |
| `stallwache/esp32/` | Sketch für den Ziegentür-Reader (WT32-ETH01), Kennwort hier als Platzhalter | per Arduino IDE auf den ESP32 |

Supabase ist **bereits fertig eingerichtet** (Projekt florian-hq, Tabellen `hs_…`, Edge Functions `hs-push` und `hs-snap`, Cron-Jobs für Offline-Wächter und Pflege-Erinnerung).

---

## 1. Web-App online stellen

1. ✅ Erledigt: Die App liegt im Repo im Ordner `stallwache/`.
2. Supabase → **Authentication → URL Configuration → Redirect URLs**: `https://grisu-e.github.io/florian-hq/stallwache/` eintragen. Falls dort schon `https://grisu-e.github.io/florian-hq/**` steht, ist nichts zu tun.
3. App öffnen: **https://grisu-e.github.io/florian-hq/stallwache/**
4. **Du meldest dich als Erster an und wirst automatisch Admin.** Alle anderen erscheinen unter 👥 Mitglieder und werden dort freigeschaltet. Pro Kachel stellst du „sehen“ oder „bearbeiten“ ein.
5. Auf dem Handy: „Zum Home-Bildschirm“ hinzufügen, dann ⚙️ → **Benachrichtigungen aktivieren** → Testnachricht.

---

## 2. Vorschlag für das LOGO-Programm

Die Belegung ist noch offen, deshalb hier ein Vorschlag. Die Brücke ist genau so voreingestellt.

| LOGO | Funktion | Hinweis |
|---|---|---|
| **I1** | Taster AUF am Stall | optional |
| **I2** | Taster ZU am Stall | optional |
| **I3** | Endschalter **oben** (Klappe offen) | Schließer; bei Öffner in der INI `!I3` schreiben |
| **I4** | Endschalter **unten** (Klappe zu) | dito |
| **Q1** | Motor **AUF** | |
| **Q2** | Motor **ZU** | |
| **V0.0** | Netzwerkeingang **NI1 = AUF aus der App** | Impuls 0,8 s |
| **V0.1** | Netzwerkeingang **NI2 = ZU aus der App** | Impuls 0,8 s |
| **M1** | Störung (Laufzeit überschritten) | optional, dann in der INI `stoerung = M1` |

**Logik (Funktionsplan):**

- **Astro-Uhr** (Sonderfunktion „Astronomische Uhr“): Breiten- und Längengrad von Gitzensteig ≈ 47,67 N / 9,59 O, Offset nach Wunsch, z. B. AUF = Sonnenaufgang + 30 Min, ZU = Sonnenuntergang + 20 Min.
- **AUF-Anforderung** = ODER( Astro *steigende Flanke*, I1, NI1 )
- **ZU-Anforderung** = ODER( Astro *fallende Flanke*, I2, NI2 )
- **Q1 (Motor auf)** über Selbsthalterelais (RS): Setzen = AUF-Anforderung UND NICHT I3 UND NICHT Q2; Rücksetzen = I3 ODER ZU-Anforderung ODER Laufzeit-Überwachung
- **Q2 (Motor zu)** genauso mit I4, Q1 und der AUF-Anforderung
- **Laufzeit-Überwachung:** Einschaltverzögerung ca. 60 s an Q1 ODER Q2 → setzt Q1/Q2 zurück und setzt **M1**. M1 wird bei der nächsten Anforderung zurückgesetzt.
- **Modbus freischalten:** LOGO!Soft Comfort → *Extras → Ethernet-Verbindungen* → Haken bei **„Modbus-Zugriff zulassen“** (Port 502), danach Programm übertragen.
- **Netzwerkeingänge NI1/NI2:** NI-Baustein einfügen und als Adresse den **V-Speicher V0.0 bzw. V0.1** wählen. Diese Bits setzt der Pi über Modbus.

> Der Pi schaltet **nie direkt** Q1/Q2, er gibt nur einen Impuls auf V0.0/V0.1. Verriegelung, Endschalter und Laufzeitgrenze bleiben in der LOGO. Das ist sicherer.
> Falls deine LOGO!Soft-Version die NI-Einstellung anders benennt: Screenshot schicken, dann passe ich die Adressen an.

---

## 3. Kamera (GENBOLT Dual-Lens)

Die App zeigt **Standbilder**: alle 10 Min, im Live-Modus alle ~3 s und beim Öffnen/Schließen der Klappe im Verlauf (14 Tage). Für flüssiges Video mit Ton bleibt die Hersteller-App.

1. In der GENBOLT-App ein **Gerätepasswort** setzen und, falls vorhanden, **RTSP/ONVIF** einschalten.
2. RTSP-Adresse zuerst **am PC mit VLC testen** (*Medien → Netzwerkstream öffnen*). Typische Adressen:
   - `rtsp://admin:PASSWORT@IP:554/11` (Hauptstream) bzw. `/12` (Substream)
   - `rtsp://admin:PASSWORT@IP:5544/11`
   - zweites Objektiv oft `/21` bzw. `/22` oder `…?channel=2`
   - Hilfe: ispyconnect.com → Hersteller „Genbolt“ → Modell auswählen
3. Die funktionierende Adresse in `stallwache.ini` bei `cam0_url` (und `cam1_url` für das zweite Objektiv) eintragen. Der **Substream** reicht und schont den Pi.

---

## 4. Raspberry Pi einrichten

Der Pi 3B+ läuft weiter mit der Energie-App, die Brücke braucht kaum Leistung.

```bash
# Ordner „pi“ auf den Pi kopieren, z. B. mit WinSCP oder:
scp -r pi/ pi@<PI-IP>:~/stallwache
ssh pi@<PI-IP>
cd ~/stallwache && bash install.sh
nano /opt/stallwache/stallwache.ini      # IP der LOGO + Kamera eintragen
```

**Testen, Schritt für Schritt:**

```bash
cd /opt/stallwache
python3 stallwache_bridge.py --sync       # Verbindung zu Supabase → zeigt Einstellungen
python3 stallwache_bridge.py --test       # liest die LOGO aus → Endschalter, Motor, Klappenstatus
python3 stallwache_bridge.py --pulse auf  # Klappe fährt auf? (Stall im Blick behalten!)
python3 stallwache_bridge.py --snapshot   # Kamerabild → erscheint in der App unter 📷
sudo systemctl start stallwache           # Dauerbetrieb
journalctl -u stallwache -f               # Log live ansehen
```

Danach zeigt die App oben **„online“** und den Klappenstatus.

---

## 5. Was die App kann

| Kachel | Funktion |
|---|---|
| 🚪 **Klappe** | Status live, Öffnen/Schließen per Knopf (mit Rückmeldung), heutige Sonnen- und Sollzeiten, Protokoll, Zeiten & Alarm einstellen |
| 📷 **Kamera** | Letztes Bild beider Objektive, Live-Modus, Verlauf mit Bildern beim Öffnen/Schließen |
| 🥚 **Eier** | Tageszähler (+/−), Statistik 7/30 Tage, Monate, Legequote |
| 🧹 **Pflege** | Futter, Wasser, Ausmisten … mit Intervall und Ampel, Push-Erinnerung ca. 17 Uhr |
| 🐔 **Herde** | Hühner mit Rasse, Fußring, Alter, Status |
| 🩺 **Gesundheit** | Behandlungen, Tierarzt, Wiedervorlage |
| 🐐 **Ziegen** | Ziegentür: Freigabe (aus/Zeitfenster/dauerhaft), Ziegen mit Chip, Protokoll, „Jetzt entriegeln“ |
| 👥 **Personal** | Mitglieder und Freigaben (nur Admin) |

**Push-Meldungen** (pro Gerät abwählbar):
- 🚨 **Fuchs-Alarm:** Klappe X Min nach Schließzeit noch offen (Standard 30 Min)
- 🚨 Klappe morgens X Min nach Öffnungszeit noch zu
- ⚠️ Endlage nicht erreicht, Motor läuft zu lange, LOGO-Störung (M1), LOGO nicht erreichbar
- 📡 Stall offline (> 10 Min keine Meldung vom Pi) und wieder online
- 🐔/🌙 jedes Öffnen und Schließen
- 🧹 Pflege fällig, 🩺 neuer Gesundheits-Eintrag

**Steuerung** (Klappe → Zeiten & Alarm):
- **LOGO-Astro** (Standard): Die LOGO fährt selbst. Die Zeiten in der App dienen nur der Überwachung, also **Offsets grob gleich wie in der LOGO einstellen**.
- **Pi / App:** Der Pi fährt nach den App-Zeiten. Dann die Astro-Uhr in der LOGO abschalten, sonst fahren beide.

---

## 6. Wenn etwas nicht geht

| Symptom | Ursache / Abhilfe |
|---|---|
| App: „Stall offline“ | `journalctl -u stallwache -f` auf dem Pi; Internet am Pi? |
| Log: „LOGO nicht erreichbar“ | IP/Ping prüfen, Richtfunk, „Modbus-Zugriff zulassen“ aktiv? |
| Log: „LOGO meldet Modbus-Fehler 2“ | Adresse gibt es nicht → Schreibweise in der INI prüfen |
| Status „Zwischenstellung“, obwohl offen/zu | Endschalter sind Öffner → `!I3` / `!I4` eintragen |
| Befehl kommt an, Klappe fährt nicht | NI1/NI2 im LOGO-Programm nicht mit V0.0/V0.1 verknüpft |
| Kamera: „ffmpeg: …“ | RTSP-Adresse/Passwort falsch, erst in VLC testen |
| Log: „Supabase … HTTP 400 unauthorized“ | `bridge_secret` in der INI falsch abgeschrieben |

---

## 8. Ziegentür mit RFID 🐐

**Prinzip:** Der Reader meldet nur, *welcher* Chip davorsteht. Ob das Schloss aufgeht, entscheidet der Pi anhand der **Freigabe aus der App**: aus, im Zeitfenster oder dauerhaft. Ist alles in Ordnung, entriegelt die LOGO das Schloss für ein paar Sekunden und die Ziegen drücken die Tür selbst auf. Unbekannte Chips öffnen **nie**.

```
 Halsband-Chip ──► Lesemodul + ESP32 (LAN) ──HTTP──► Pi ──Modbus──► LOGO NI3 (V0.2) ──► Q3 ──► Elektroschloss
```

### Hardware-Vorschlag

| Teil | Empfehlung | Hinweis |
|---|---|---|
| Chips | **FDX-B 134,2 kHz** (ISO 11784/11785) als Anhänger am Halsband | Tier-Standard. Falls eure Ziegen schon eine **elektronische Ohrmarke** haben, prüfen, ob sie FDX-B ist, dann passt derselbe Reader. |
| Lesemodul | FDX-B-Modul mit **TTL-Ausgang (9600 Baud)** und Spulen-Antenne, z. B. „WL-134“ | Reichweite meist nur **wenige cm bis ca. 10 cm**. Antenne an einer Engstelle auf **Halsband-Höhe** montieren, sodass der Anhänger daran vorbeistreift. Reicht das nicht, wären UHF-Tags mit UHF-Reader die Alternative (Reichweite in Metern). |
| Steuerung am Stall | **WT32-ETH01** (ESP32 mit LAN-Buchse) + 5-V-Netzteil, wetterfestes Gehäuse | hängt am LAN über die Richtfunkstrecke |
| Schloss | **Elektroschloss / Riegel „stromlos verriegelt“ (fail-secure)**, 12 oder 24 V DC | Bei Stromausfall bleibt die Tür zu. **Kein** „stromlos offen“ verwenden! |
| Türkontakt | Reed-Kontakt an der Tür → LOGO **I5** | optional; die App zeigt dann „Tür auf/zu“ und meldet, wenn sie zu lange offen steht |
| Tür | Pendeltür oder Tür mit Feder, die die Ziegen aufdrücken | schließt von selbst, dann rastet das Schloss wieder ein |

### LOGO-Erweiterung

| LOGO | Funktion |
|---|---|
| **V0.2 → NI3** | „Ziegentür entriegeln“ vom Pi (bleibt 1, solange entriegelt sein soll) |
| **Q3** | Elektroschloss |
| **I5** | Türkontakt Ziegentür (optional) |

**Logik:** Q3 = NI3 UND NICHT T1. Dabei ist T1 eine **Einschaltverzögerung 120 s** am Eingang NI3. Das ist die Sicherheitsgrenze: Bleibt das Signal vom Pi hängen (Absturz genau beim Entriegeln), verriegelt die LOGO nach 2 Min. trotzdem.

### ESP32 einrichten

1. Arduino IDE → Boardverwalter: **esp32** von Espressif installieren → Board **„WT32-ETH01 Ethernet Module“**.
2. Sketch `esp32/ziegentuer_reader/ziegentuer_reader.ino` öffnen und oben eintragen: **IP des Pi** (`PI_HOST`). Das Kennwort `TOKEN` muss zu `[ziegen] token` in `stallwache.ini` passen (im ZIP ist es schon gleich eingetragen).
3. Hochladen mit USB-Seriell-Adapter: IO0 beim Einschalten auf GND = Flash-Modus.
4. Seriellen Monitor (115200 Baud) öffnen und einen Chip an die Antenne halten. Es erscheint `Chip 900 … → HTTP 200 …`. Die **Rohdaten** stehen ebenfalls dort, falls ein Modul ein anderes Format sendet. Dann einfach mir schicken.
5. LED-Bedeutung: **grün 1,5 s** = darf durch, **rot 3×** = abgewiesen, **rot schnell** = Pi nicht erreichbar.

### Pi und App

1. In `stallwache.ini` im Abschnitt `[ziegen]` **`aktiv = yes`** setzen und den Dienst neu starten: `sudo systemctl restart stallwache`.
2. Test ohne Ziege: `python3 stallwache_bridge.py --entriegeln` → Schloss ist 10 s offen.
3. In der App unter 🐐 **Ziegen**: Ziege anlegen. Halsband einmal an den Reader halten, dann kann die Chip-Nummer per Knopf übernommen werden.
4. **Freigabe** wählen: *Aus*, *Im Zeitfenster* (z. B. 08:00–18:00) oder *Dauerhaft*, dazu die Entriegelungszeit in Sekunden. **„Jetzt entriegeln“** öffnet einmalig, auch außerhalb der Freigabe.
5. Wer die Ziegen bedienen darf, stellst du unter 👥 Personal beim Schlüssel **Ziegen** ein. Das ist unabhängig von den Rechten an der Hühnerklappe.

---

## 9. Sicherheit

- Die App nutzt dieselbe Anmeldung (E-Mail-Link) wie Florian HQ / H&E Hub, aber **eigene Freigaben**.
- Klappe fahren dürfen nur Personen mit **„bearbeiten“ bei Klappe**.
- Der Pi meldet sich mit einem eigenen Geheimnis an. In der Datenbank liegt nur dessen Hash. Wer die INI hat, kann Statusmeldungen fälschen, aber nichts in der LOGO tun, was die App nicht auch kann.
- Neues Brücken-Geheimnis gewünscht? Kurz Bescheid sagen, dann tausche ich es aus.
