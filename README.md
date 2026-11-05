# Florian HQ – eigenständige Version

Die Wehr-App mit Neues, Dienstplänen (Aktive/Jugend), Veranstaltungen mit Arbeitsdiensten, Organigramm, Reservierungen, Crushed-Eis und Übungsdoku. Läuft im Browser und lässt sich am Handy wie eine App auf den Startbildschirm legen. Jeder meldet sich mit E-Mail und Passwort an, ein Claude-Konto ist nicht nötig.

**Was du brauchst (alles kostenlos):** ein GitHub-Konto, ein Supabase-Konto, ein Vercel-Konto. Dauer: ca. 20 Minuten.

---

## Schritt 1 – Datenbank bei Supabase anlegen

1. Auf **supabase.com** registrieren und **New project** anlegen.
   - Name: `florian-hq`
   - Region: **Central EU (Frankfurt)**, damit die Daten in Deutschland liegen
   - Datenbank-Passwort vergeben und notieren
2. Wenn das Projekt bereit ist: links **SQL Editor** → **New query**.
3. Den kompletten Inhalt der Datei `supabase/schema.sql` hineinkopieren und **Run** drücken. Unten muss „Success“ stehen.
4. Links **Project Settings** → **API** (bzw. **API Keys**). Zwei Werte kopieren:
   - **Project URL** (z. B. `https://abcd1234.supabase.co`)
   - Schlüssel **anon public**
5. Beide Werte in die Datei `config.js` eintragen (statt `DEIN-PROJEKT…` und `DEIN-ANON-KEY`).

> Der anon-Schlüssel darf öffentlich sein. Die Datenbank lässt nur freigegebene Mitglieder an die Daten.

**Empfehlung:** Links **Authentication** → **Sign In / Providers** → **Email** → „Confirm email“ **ausschalten**. Neue Konten müssen ohnehin von einem Bearbeiter freigegeben werden, und der kostenlose Mailversand von Supabase schafft nur wenige Mails pro Stunde.

## Schritt 2 – Code zu GitHub

1. Auf **github.com** registrieren → oben rechts **+** → **New repository**.
   - Name: `florian-hq`, Sichtbarkeit: **Private**
   - **Create repository**
2. Auf der leeren Repository-Seite **uploading an existing file** wählen, den **Inhalt** dieses Ordners (inklusive `icons` und `supabase`) hineinziehen und **Commit changes** drücken.

Alternativ: Sag Claude den Namen des Repositorys (z. B. `deinname/florian-hq`), dann lädt Claude den Code direkt hoch und kann später Änderungen selbst eintragen.

## Schritt 3 – Online stellen mit Vercel

1. Auf **vercel.com** mit **Continue with GitHub** anmelden.
2. **Add New…** → **Project** → bei `florian-hq` auf **Import**.
3. Framework Preset: **Other**. Nichts weiter ändern → **Deploy**.
4. Nach ca. 1 Minute bekommst du eine Adresse wie `https://florian-hq.vercel.app`. Das ist der Link für alle.

## Schritt 4 – Adresse in Supabase eintragen

Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: deine Vercel-Adresse
- **Redirect URLs**: dieselbe Adresse noch einmal hinzufügen

Das ist für Bestätigungs- und „Passwort vergessen“-Mails nötig.

## Schritt 5 – Loslegen

1. Öffne deine Vercel-Adresse und **registriere dich als Erster**. Das erste Konto wird automatisch **Bearbeiter**.
2. Schick den Link an die Kameraden. Sie registrieren sich und sehen „Fast da – wartet auf Freigabe“.
3. Du gibst sie im Reiter **Mitglieder** frei: als **Mitglied** oder **Bearbeiter**.

| Rolle | Darf |
|---|---|
| Mitglied | alles lesen, reservieren, Crushed-Eis anmelden, in Arbeitsdienste eintragen |
| Bearbeiter | zusätzlich Neues, Dienstpläne, Veranstaltungen und Arbeitsdienste, Übungsdoku, Organigramm, Mitglieder freigeben/sperren/entfernen, fremde Einträge löschen |

## Aufs Handy legen

- **iPhone (Safari):** Link öffnen → Teilen-Symbol → **Zum Home-Bildschirm**
- **Android (Chrome):** Link öffnen → Menü ⋮ → **App installieren** bzw. **Zum Startbildschirm hinzufügen**

## Änderungen später

- **Inhalte** (Dienste, Neues, Organigramm …) pflegt ihr direkt in der App.
- **Funktionen und Design:** Änderungen an den Dateien in GitHub eintragen (oder von Claude eintragen lassen). Vercel stellt jede Änderung nach 1–2 Minuten automatisch online.

## Gut zu wissen

- **Supabase Free** pausiert ein Projekt nach etwa einer Woche **ohne jede Nutzung**. Wird die App regelmäßig benutzt, passiert das nicht. Falls doch: im Supabase-Dashboard auf „Restore“ klicken, die Daten bleiben erhalten.
- Telefonnummern und E-Mails im Organigramm sehen alle freigegebenen Mitglieder. Nur eintragen, was in der Wehr bekannt sein darf.
- Fotos der Anwesenheitslisten liegen in einem privaten Speicher und sind nur für angemeldete Mitglieder abrufbar.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `styles.css` | Gestaltung |
| `app.js` | App-Logik |
| `config.js` | Verbindung zu deiner Supabase-Datenbank |
| `supabase/schema.sql` | Tabellen, Rollen und Zugriffsregeln |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation als App am Handy |
