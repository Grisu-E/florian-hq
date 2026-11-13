# Alarmstufe Pink – App der Feuerwehrmädels

Weihnachtsmarkt-Orga für die Feuerwehrmädels: Standdienst zum Selbst-Eintragen, Aufgaben, Termine & Treffen, Einkaufsliste, Material & Deko, Angebot & Preise, Kasse, Infos & Kontakte.

- **Frontend:** eine statische Seite (`index.html`) auf GitHub Pages, installierbar als App (PWA).
- **Daten:** Supabase-Projekt `florian-hq`, Tabellen `fm_members`, `fm_items`, `fm_push_subs`; Zugriff pro Kachel über Row Level Security (kein Zugriff / ansehen / bearbeiten).
- **Anmeldung:** E-Mail + Passwort oder Login-Link. Neue Personen warten auf Freigabe unter „Personen & Freigaben“. Admins sehen und bearbeiten alles.
- **Standdienst:** Eintragen/Austragen über `fm_schicht_toggle` – dafür reicht „Ansehen“.
- **Push:** Edge Function `fm-push`, tägliche Erinnerungen `fm_daily_reminders()` (Cron `fm-daily`, ca. 18 Uhr).
