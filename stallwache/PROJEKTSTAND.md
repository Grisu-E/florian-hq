# 🐔 Hühnerhotel – Projektstand (20.11.2026)

Kurzüberblick für den Wiedereinstieg. Ausführliche Bedienung: `README.md`, LOGO-Umbau: `LOGO_Aenderungen.pdf`.

## Was ist es?
Web-App für den Hühnerstall (plus zwei Ziegen) in Gitzensteig: Klappe (Siemens LOGO! 8) überwachen und fahren, Kamera, Eier, Pflege, Herde, Ziegentür mit RFID, Umzug Stall, Tränke-Heizung, Wetter-Warnungen. Gebaut wie H&E Hub / Florian HQ.

- **App:** https://grisu-e.github.io/florian-hq/stallwache/ · Einladung: `…/stallwache/?einladung`
- **Code:** Repo `Grisu-E/florian-hq`, Ordner `stallwache/` (Ordnername bleibt „stallwache“, App heißt **Hühnerhotel**)
- **Datenbank:** Supabase-Projekt `florian-hq` (`kdqtfbhwjqymfbaunkwg`), alles mit Präfix `hs_`
- **Admins:** Eva Egger (evi-93@web.de), Tobi (thoepfl@gmx.de)

## Aufbau
```
Handy/App (GitHub Pages) ⇄ Supabase (DB, Push, Edge Functions, Cron)
                                  ⇅ (nur ausgehend, alle 2 s)
                         Raspberry Pi 3B+  ── Modbus TCP ──► LOGO! 8 (Klappe, Q1 Relais)
                           │  └─ WLAN Gastnetz ─► GENBOLT-Kamera 192.168.179.11 (RTSP)
                           └─ HTTP/UDP 8088 ◄── ESP32 WT32-ETH01 + FDX-B-Reader (Ziegentür)
```
Die LOGO bleibt der Chef: Astro-Uhr fährt die Klappe auch ohne Pi. Die App gibt nur Impulse auf V-Bits (Netzwerkeingänge).

## Stand der Teile
| Teil | Stand |
|---|---|
| App (`index.html`, `sw.js`) | ✅ live. Schlüssel (Reihenfolge): Klappe, Kamera, Ziegen, Umzug Stall, Eier, Pflege, Herde, Tränke, Netzwerk, Personal (Admin). Gesundheit entfernt (Daten bleiben in `hs_items`, tile `gesundheit`). Motel-Design (Neonschild, Schlüsselanhänger, Bungee + Figtree). Passwort-Login, Registrieren, Passwort vergessen (kein E-Mail-Link-Login), Einladungslink, Push. |
| Supabase | ✅ eingerichtet und getestet |
| Wetter (Open-Meteo) | ✅ läuft (alle 3 h, Warn-Push 17:13 UTC ≈ 18 Uhr) |
| Raspberry Pi | ⏳ noch nicht installiert → `bash install.sh` (fragt LOGO-IP, Kamera, Gast-WLAN ab) |
| LOGO-Programm | ⏳ Änderungen laut `LOGO_Aenderungen.pdf` noch umzusetzen |
| Kamera | ⏳ verschoben. Hängt im FRITZ!Box-Gastnetz (192.168.179.11). Pi muss per WLAN ins Gastnetz, Haken „Gastgeräte dürfen untereinander kommunizieren“. App-Name/RTSP-Pfad noch unbekannt (Vorschlag `/11`). |
| Ziegentür | ⏳ Hardware fehlt (FDX-B-Chips, Reader, WT32-ETH01, fail-secure-Schloss). Im Pi `[ziegen] aktiv = no`. |

## Netzwerk Haus → Stall (Schlüssel „Netzwerk“)
FRITZ!Box → Switch (+ Raspberry Pi 3B+) → Zyxel PLA5215 (Powerline innen) ⚡ Zyxel PLA5215 (Balkon) → AdaLov CPE660 ┄ 400 m Richtfunk ┄ CPE660 → Linksys WRT54GL (Stall) → LOGO, Kamera (192.168.179.11).
Offen: Steckt die CPE am Linksys im Internet-Port (eigenes Netz) oder in Port 1–4? Steckt der Switch an FRITZ!Box-LAN 4 als Gastzugang? Der Pi 3B+ hängt im Haus am Switch nach der FRITZ!Box; er muss LOGO und Kamera hinter dem Linksys erreichen (geht nur, wenn der Linksys als Access Point läuft oder Portweiterleitungen hat).
Zugangsdaten je Gerät in der App (Tabelle `hs_geraete`, Passwörter mit pgcrypto verschlüsselt, Schlüssel in `fhq_private.hs_keys`).

## LOGO-Belegung (Programm des Nutzers + Ergänzungen)
| Adresse | Bedeutung |
|---|---|
| I1 / I2 | Taster öffnen / schließen |
| I3 → Q2 | Licht (Stromstoß, 5 Min.) |
| I4 / I5 | Endschalter oben / unten (`endschalter_oben/unten`) |
| Q1 | Relais Klappe: **an = auf, stromlos = zu** (aus RS B007), im Pi `soll_offen = Q1` |
| B002 | Astro-Uhr, +59 / +40 Min. ⚠ **steht noch auf Berlin**, muss N47°40′ / O9°35′ |
| V0.0 / V0.1 = NI1 / NI2 | App öffnen / schließen (Impuls 0,8 s, ODER mit I1 / I2) – *neu* |
| V0.3 = NI4 | Sperre „Umzug Stall“ (UND NICHT vor S von B007) – *neu* |
| V0.2 = NI3 → Q3 | Schloss Ziegentür (max. 120 s per LOGO-Timer) – *später* |
| V0.4 = NI5 → Q4 | Tränke-Heizung – *später* |
| I6 | Türkontakt Ziegentür – *später* |

## Supabase (Projekt florian-hq)
- **Tabellen:** `hs_members` (Rechte je Schlüssel in `tiles`: none/view/edit, erster = Admin), `hs_items` (Eier, Pflege, Herde, Ziegen …), `hs_config` (eine Zeile, JSON: Zeiten, Offsets 59/40, `pflege`, `ziegen`, `stallpflicht`, `traenke`, `wetter`), `hs_state` (Zustand vom Pi), `hs_commands` (open/close/unlock), `hs_events` (Protokoll, `bild` = Archivfoto), `hs_push_subs`, `hs_wetter`, privat `fhq_private.hs_bridge` (Hash des Brücken-Geheimnisses)
- **RPCs (App):** `hs_command`, `hs_live`, `hs_set_ziegen`, `hs_set_stallpflicht`, `hs_set_traenke`, `hs_names`
- **RPCs (Pi, mit Geheimnis):** `hs_bridge_sync` (Zustand/Ereignisse hin, Befehle/Config/Ziegen/Wetter zurück), `hs_bridge_ack`
- **Edge Functions:** `hs-push` (Web-Push, VAPID von Florian HQ, Bild per signierter URL), `hs-snap` (Kamerabild vom Pi → Bucket `hs-cam`, Archiv 14 Tage), `hs-wetter` (Open-Meteo)
- **Cron:** `hs-watchdog` (5 Min., „Stall offline“), `hs-daily` (Pflege-Erinnerung 17:11 UTC), `hs-wetter` (alle 3 h), `hs-wetter-abend` (17:13 UTC mit Push)
- **Push-Kategorien:** alarm, klappe, pflege, wetter

## Raspberry Pi – `stallwache_bridge.py` (v1.6)
- Nur Python-Standardbibliothek + ffmpeg. Läuft als systemd-Dienst `stallwache`, Konfig `/opt/stallwache/stallwache.ini`.
- Testbefehle: `--sync`, `--test`, `--pulse auf|zu`, `--snapshot`, `--entriegeln`
- Funktionen: Klappenstatus aus I4/I5 + Q1, Befehle als V-Bit-Impuls, Fuchs-Alarm (Schließzeit + 30 Min. noch offen), Morgen-Alarm, Klemm-Erkennung (60 s), Umzug Stall-Sperrbit, Tränke-Heizung (Auto mit Hysterese 1/3 °C, Fühler AI1 oder Wetter), Kamera (alle 10 Min., Live alle 3 s, Foto beim Schließen in der Push-Meldung), Ziegentür (HTTP `/rfid`, UDP-Suche, Freigabe aus/Zeitfenster/dauerhaft).

## Geheimnisse (Werte stehen NICHT im Repo)
- Brücken-Geheimnis (`bridge_secret`) und Reader-Kennwort (`[ziegen] token`): nur in `stallwache.ini` / `.ino` aus dem ZIP „Huehnerhotel-Geraete“. Im Repo Platzhalter.
- Neues Geheimnis: Hash in `fhq_private.hs_bridge` ersetzen (SQL in `supabase/stallwache.sql`).

## Sicherheit (Stand 20.11.2026)
- Supabase-Advisor: ohne Anmeldung sind nur noch `hs_bridge_sync`/`hs_bridge_ack` aufrufbar (gewollt, Pi mit Geheimnis). Florian-HQ-Hilfsfunktionen und `handle_new_user` für anon gesperrt, `he_eur` mit festem search_path.
- 42 Hinweise „für angemeldete Nutzer aufrufbar“ sind gewollt (Rechte-Funktionen der Apps prüfen intern).
- Schutz vor geleakten Passwörtern: nur im Supabase-Pro-Tarif, daher aus.
- App-Prüfer (unabhängiger Agent) nach größeren Änderungen laufen lassen, siehe Skill „app-baukasten“.

## Arbeitsweise / Hinweise
- Änderungen an der App: `stallwache/index.html` + **Cache-Version in `sw.js` hochzählen** (`huehnerhotel-vNN`, zuletzt v22), Commit auf `main` → GitHub Pages ist nach ca. 1 Min. live.
- Tests: `stallwache/tests/` (simulierte LOGO per Modbus, Fake-Supabase). `python3 test_real.py` testet die echte Belegung.
- Alle Apps teilen sich ein Login. Wer schon bei Florian HQ, H&E Hub oder Alarmstufe Pink ist, meldet sich an, statt sich zu registrieren.
- Kostenloser Supabase-Mailversand: nur wenige Mails pro Stunde.
- iPhone zeigt kein Bild in der Push-Meldung (Foto steht im Protokoll). Push nur über das Icon auf dem Home-Bildschirm.

## Offene Punkte / nächste Schritte
1. LOGO-Programm nach `LOGO_Aenderungen.pdf` ändern (Berlin → Gitzensteig!, NI1/NI2, NI4, Modbus, feste IP)
2. Pi: `bash install.sh`
3. Kamera: Pi ins Gast-WLAN, Kamera-App/RTSP-Pfad klären
4. Ziegentür-Hardware beschaffen, Sketch aufspielen, `[ziegen] aktiv = yes`
5. Ideen, noch nicht gebaut: Versorgungsplan/Urlaubsvertretung (3), Kosten & Eier-Bilanz (4), Ziegen-Gesundheit (5), Fuchs-Wache per Bewegungserkennung (6), Füllstand Wasser/Futter (8), Brutkalender (10)
