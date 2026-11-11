# H&E Hub

Haushalts-App für zwei – Fahrzeuge mit TÜV, Termine, Rechnungen (H&E Tools), wichtige Rechnungen, Miete & Versicherungen, Müllplan (Tettnang, Bezirk III) und Geburtstage.

- **Frontend:** eine statische Seite (`index.html`) auf GitHub Pages, installierbar als App (PWA).
- **Daten:** Supabase (Tabellen `he_members`, `he_items`, Storage-Bucket `he-belege`), Zugriff pro Kachel über Row Level Security.
- **Anmeldung:** Login-Link per E-Mail. Die erste Person wird Admin, alle weiteren werden im Bereich „Personen & Freigaben“ freigegeben.
- **Belege lesen:** Supabase Edge Function `he-beleg-lesen` (braucht das Secret `ANTHROPIC_API_KEY`).

Der Supabase-Schlüssel in `index.html` ist der öffentliche „publishable“ Key – die Daten sind durch Login und RLS geschützt.
