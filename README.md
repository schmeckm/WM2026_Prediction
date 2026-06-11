# WM 2026 Tippspiel

**Version 1.0.1** 

> Private Fußball-Tipp-Webanwendung für die FIFA Weltmeisterschaft 2026 — mit Live-Ergebnissen, Bonusfragen, Teamwertung, KI-Coach und vollständigem Admin-Bereich.

**Repository:** [github.com/schmeckm/aspire-make-tippspiel](https://github.com/schmeckm/aspire-make-tippspiel)

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Features](#features)
- [Spielregeln](#spielregeln)
- [Technologie-Stack](#technologie-stack)
- [Schnellstart](#schnellstart)
- [Konfiguration](#konfiguration)
- [Deployment](#deployment)
- [Architektur](#architektur)
- [API-Übersicht](#api-übersicht)
- [Fehlerbehebung](#fehlerbehebung)
- [Lizenz](#lizenz)

---

## Überblick

Das Tippspiel richtet sich an **interne Firmen-Teams** (z. B. IT, Finance, HR). Jeder Teilnehmer tippt eigenständig alle **104 WM-Spiele** (72 Gruppenspiele + 32 K.-o.-Partien). Punkte, Hitliste und Teamwertung werden **deterministisch im Backend** berechnet — optional ergänzt durch KI-Hilfen, die keine offiziellen Ergebnisse erzeugen.

| | |
|---|---|
| **Frontend** | Vue 3 SPA, PWA-fähig, 4 Sprachen (DE/EN/FR/ES) |
| **Backend** | Node.js REST-API + WebSocket |
| **Datenbank** | SQLite (Dev) / PostgreSQL (Prod) |
| **Betrieb** | Manuell (CSV) oder automatisch (Football-API) |

---

## Features

### Für Spieler

| Feature | Beschreibung |
|---------|--------------|
| **Dashboard** | Persönliche Übersicht: nächste Spiele, offene Tipps, Rang, KI-Insights |
| **Spiele** | Alle 104 WM-Partien mit Filter (offen, beendet, fehlende Tipps), Countdown bis Anpfiff |
| **Meine Tipps** | Kompakte Übersicht aller abgegebenen Prognosen |
| **Gruppentabelle** | Live-Tabellen der Gruppen A–L mit Projektionen |
| **Turnierbaum** | K.-o.-Bracket mit Zoom, Listenansicht und Spielverknüpfung |
| **Nationalmannschaften** | Kader, Tabellen, Torschützen, Live-Spiele, WM-Duelle (Head-to-Head) |
| **Bonusfragen** | Sonderwetten (Weltmeister, Vize, Dritter, TSK, Team-Fortschritt) |
| **Hitliste** | Rangliste mit Filtern (Gesamt, Spiele, Bonus, Gruppe, K.-o.), CSV-Export |
| **Teamwertung** | Abteilungs-Ranking nach **Ø Punkte pro Mitglied** (nicht Summe) |
| **Statistiken** | Eigene Leistung mit Chart.js-Diagrammen |
| **Preise** | Sichtbare Preise für Platz 1–3 (vom Admin freigeschaltet) |
| **Profil** | Avatar, Lieblingsteam, Torschützenkönig, Sprache, Dark Mode, optional 2FA |
| **Spielregeln** | Offizielle RTE-Guideline unter `/help` |
| **KI-Coach** | Chat zu Strategie, fehlenden Tipps und Punkten |
| **Benachrichtigungen** | In-App-Meldungen mit Live-Updates via WebSocket |
| **PWA** | Installierbar auf Smartphone/Tablet |

### Authentifizierung & Profil

- E-Mail/Passwort-Registrierung mit Verifizierung
- **Google SSO** (optional, über `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- Passwort zurücksetzen per E-Mail
- **Zwei-Faktor-Authentifizierung** (TOTP) im Profil
- Erinnerung bei unvollständigem Profil (Lieblingsteam + Torschütze)

### Öffentlicher Display-Modus

Für Beamer/TV ohne Login:

| Route | Inhalt |
|-------|--------|
| `/display` | Hitliste & Highlights |
| `/display/bracket` | Turnierbaum |

Aktivierung und Zugriff über Admin-Einstellungen (`displayModeEnabled`).

### KI-Funktionen (optional)

> **Die KI ist keine Quelle der Wahrheit.** Sie berechnet keine Punkte, erfindet keine Ergebnisse und ändert keine Tipps.

| Feature | Zielgruppe | Beschreibung |
|---------|------------|--------------|
| Spielvorschau | Spieler | Neutrale Meinung pro Partie |
| KI-Coach | Spieler | Chat zu Tipps, Rang und Strategie |
| Hitlisten-Kommentar | Spieler | Kurze Zusammenfassung der Rangbewegungen |
| Dashboard-Insights | Spieler | Personalisierte Hinweiskarten |
| Admin-Assistent | Admin | Diagnose, Empfehlungen, Texte |
| Bonus-Vorschläge | Admin | Vorschläge für neue Bonusfragen |
| Reminder-Texte | Admin | E-Mail- und In-App-Texte für Erinnerungen |

Aktivierung über `OPENAI_API_KEY` in `backend/.env`. Einzelne Features können separat deaktiviert werden.

### Admin-Bereich

| Bereich | Funktionen |
|---------|------------|
| **Dashboard** | Systemübersicht, Schnellaktionen, KI-Insights |
| **Benutzer** | Anlegen, Rollen, Sperren, Admin-Rechte |
| **Teams** | Abteilungen verwalten |
| **Spiele** | Spielplan bearbeiten, sperren, korrigieren |
| **Ergebnisse** | Manuelle Ergebniserfassung |
| **Tipps** | Alle Prognosen einsehen und verwalten |
| **Import** | CSV-Spielplan importieren |
| **Synchronisierung** | Football-API: Spielplan, Ergebnisse, Live-Scores, Spielerbilder |
| **Bonusfragen** | Erstellen, auflösen, Turnier-Vorschläge übernehmen |
| **Punkteregeln** | Exakt / Tordifferenz / Tendenz konfigurierbar |
| **Preise** | Platz 1–3 definieren und freischalten |
| **E-Mail** | SMTP-Erinnerungen für fehlende Tipps |
| **Benachrichtigungen** | In-App-Nachrichten an alle oder einzelne Nutzer |
| **Statistiken** | Gesamtübersicht, Vollständigkeit, fehlende Tipps |
| **Favoriten** | Lieblingsteams und Torschützen der Nutzer |
| **Spielerbilder** | Sync über TheSportsDB / Wikimedia |
| **Backup** | JSON-Export/Import, **Excel-Notfall-Export** (Hitliste, Tipps, Bonus, Spiele) |
| **Audit-Log** | Protokoll aller Admin-Aktionen |
| **System** | Einstellungen, Display-Modus, App-Titel |
| **KI-Assistent** | Admin-KI mit Interaktions-Log |

### Automatisierung

| Job | Zeitplan | Beschreibung |
|-----|----------|--------------|
| Spielplan-Sync | Täglich 06:00 | Fixe Spielpläne aktualisieren |
| Spielplan-Sync (Turnier) | Alle 6 Stunden | Während WM-Zeitraum |
| Ergebnis-Sync | Alle 15 Minuten | Während WM-Zeitraum |
| Live-Sync | Alle 5 Minuten | Nur bei laufenden Spielen |
| E-Mail-Erinnerungen | Täglich 09:00 | Fehlende Tipps & Bonusfragen |
| Hitliste-Snapshot | Stündlich | Rangverlauf speichern |

---

## Spielregeln

### Punkte pro Spiel

Nach Abpfiff zählt nur die **beste Trefferkategorie**:

| Treffer | Punkte (Standard) |
|---------|-------------------|
| Exaktes Ergebnis | 4 |
| Richtige Tordifferenz (bei Sieg) | 3 |
| Richtige Tendenz (Sieg/Unentschieden) | 2 |
| Falscher Tipp | 0 |

### Bonusfragen (Standard)

| Frage | Punkte |
|-------|--------|
| Weltmeister | 8 |
| Vize-Weltmeister | 4 |
| Dritter | 2 |
| Torschützenkönig | 4 |
| Wie weit kommt dein Lieblingsteam? | 2 |

### Teamwertung

Jede Abteilung wird nach **Durchschnittspunkten pro registriertem Mitglied** bewertet — die größte Abteilung gewinnt nicht automatisch.

### Tipp-Pflicht

Technisch sind nicht alle Spiele Pflicht (fehlende Tipps = 0 Punkte). **RTE-Regel:** Jeder Teilnehmer tippt alle 104 Spiele selbst.

Die vollständigen Regeln stehen in der App unter **Spielregeln** (`/help`).

---

## Technologie-Stack

| Bereich | Technologien |
|---------|--------------|
| **Frontend** | Vue 3, Vite, Pinia, Vue Router, Vue I18n, Axios, Chart.js, Socket.IO Client, PWA |
| **Backend** | Node.js, Express, Sequelize, Socket.IO, node-cron, nodemailer, OpenAI, ExcelJS |
| **Datenbank** | SQLite (Entwicklung) / PostgreSQL (Produktion) |
| **Auth** | JWT, bcrypt, Google OIDC, TOTP (speakeasy) |
| **Monitoring** | Sentry (optional), Prometheus-Metriken |
| **CI/CD** | GitHub Actions (Docker Build) |

---

## Schnellstart

### Voraussetzungen

- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

| Dienst | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/api/health |

### Demo-Zugänge (nach `npm run seed`)

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@example.com | admin123 |
| User | max.mueller@example.com | user123 |

### Datenbank-Befehle

```bash
cd backend
npm run db:migrate          # Schema ergänzen (ohne Datenverlust)
npm run db:seed-teams       # Standard-Firmen-Teams
npm run db:reset -- --confirm   # Vollständiger Reset (nur Dev!)
npm run seed                # Demo-Daten (nur leere DB)
```

---

## Konfiguration

Alle Variablen mit Kommentaren: [`backend/.env.example`](backend/.env.example)

### Wichtige Einstellungen

```env
# Basis
PORT=3000
JWT_SECRET=ihr-geheimer-schlüssel
APP_URL=http://localhost:5173

# Datenbank
DB_DIALECT=sqlite
DB_PATH=./database/wm2026.sqlite
# Produktion: DB_DIALECT=postgres + DB_HOST, DB_NAME, DB_USER, DB_PASSWORD

# Football-API (optional — ohne Key: CSV/Manuell-Modus)
FOOTBALL_API_PROVIDER=football-data
FOOTBALL_API_KEY=
FOOTBALL_API_SYNC_ENABLED=false

# E-Mail (optional — ohne SMTP: Mock-Modus in Konsole)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# KI (optional)
OPENAI_API_KEY=
AI_FEATURES_ENABLED=true

# Google SSO (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Football-API

**Standard:** CSV-Import + manuelle Ergebnisse — die App funktioniert **ohne API-Key** vollständig.

| Provider | `FOOTBALL_API_PROVIDER` | Empfehlung |
|----------|-------------------------|------------|
| football-data.org v4 | `football-data` | **Empfohlen** |
| API-Football | `api-football` | Alternative |
| Sportmonks | `sportmonks` | Alternative |
| TheStatsAPI | `thestatsapi` | Alternative |

Das Frontend ruft externe APIs **niemals** direkt auf. Admin-Sync unter `/admin/sync`.

**Überschreib-Schutz:**

- `isManuallyLocked = true` → API überschreibt nicht
- `isApiManaged = false` → Spiel wird beim Sync übersprungen
- Alle Sync-Vorgänge in `SyncLog` protokolliert

### KI-Kostenkontrolle

| Maßnahme | Beschreibung |
|----------|--------------|
| Caching | Vorschauen und Kommentare in `AICommentary` |
| Token-Limit | `AI_MAX_TOKENS=800` |
| Rate-Limits | Coach: 20/Tag, Admin: 50/Tag, Bonus: 20/Tag |
| Modell | `gpt-4o-mini` (Standard) |

---

## Deployment

### Docker (lokal)

```bash
# SQLite
docker compose up --build
docker compose exec backend node database/seed.js

# PostgreSQL
docker compose --profile postgres up --build
```

### Produktion (GitHub + Portainer)

Ausführliche Anleitung: [**docs/DEPLOY-GITHUB-PORTAINER.md**](docs/DEPLOY-GITHUB-PORTAINER.md)

```bash
git clone https://github.com/schmeckm/aspire-make-tippspiel.git
# Stack in Portainer mit docker-compose.prod.yml deployen
```

**Google SSO in Produktion:** Keine Raw-IPs verwenden — stattdessen z. B. `sslip.io`-Hostname für `APP_URL`, `CORS_ORIGIN` und `GOOGLE_CALLBACK_URL`.

---

## Architektur

```mermaid
flowchart TB
    subgraph client [Browser / PWA]
        Vue[Vue 3 Frontend]
        WS[Socket.IO Client]
    end

    subgraph server [Node.js Backend]
        API[Express REST API]
        SIO[Socket.IO Server]
        Cron[node-cron Jobs]
        AI[OpenAI Service]
    end

    subgraph data [Daten]
        DB[(SQLite / PostgreSQL)]
        Redis[(Redis – optional)]
    end

    subgraph external [Extern – optional]
        FAPI[Football API]
        SMTP[SMTP Server]
        OAI[OpenAI API]
    end

    Vue --> API
    WS --> SIO
    API --> DB
    SIO --> DB
    Cron --> API
    Cron --> FAPI
    API --> FAPI
    API --> SMTP
    AI --> OAI
    SIO --> Redis
```

---

## API-Übersicht

Vollständige Endpunkte in den Route-Dateien unter `backend/routes/`.

### Kern (Spieler)

```
GET  /api/matches
POST /api/predictions
GET  /api/leaderboard
GET  /api/leaderboard/export
GET  /api/bonus-questions
GET  /api/scoring-rules
GET  /api/statistics/me
```

### KI (Spieler)

```
GET  /api/ai/status
POST /api/ai/match-preview/:matchId
POST /api/ai/user-coach
GET  /api/ai/leaderboard-summary
GET  /api/ai/dashboard-insights
```

### Admin (Auswahl)

```
POST /api/admin/sync/fixtures
POST /api/admin/sync/results
POST /api/admin/bonus-questions/:id/resolve
GET  /api/admin/audit-log
POST /api/admin/backup/export-excel
POST /api/admin/ai/assistant
```

### Display (öffentlich)

```
GET  /api/display/leaderboard
GET  /api/display/bracket
```

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| API-Sync schlägt fehl | `FOOTBALL_API_KEY` und Provider prüfen, Verbindung unter `/admin/sync` testen |
| Keine E-Mails | SMTP in `.env` konfigurieren oder Mock-Log in Konsole prüfen |
| WebSocket verbindet nicht | Backend neu starten, `VITE_SOCKET_URL` / Proxy prüfen |
| DB-Schema veraltet | `npm run db:migrate` oder Backend-Neustart mit Migration |
| Port 3000 belegt | `PORT=3001` in `.env` |
| KI antwortet nicht | `OPENAI_API_KEY` prüfen, `AI_FEATURES_ENABLED=true` |
| Google SSO Fehler | Callback-URL und `APP_URL` müssen exakt zur Domain passen |
| Spielerbilder-Sync hängt | Sync in Admin fortsetzen; hängende Jobs werden nach Timeout als stale erkannt |

---

## Lizenz

Internes Projekt — nur für private/interne Nutzung.

---

<p align="center">
  <a href="https://github.com/schmeckm/aspire-make-tippspiel">GitHub Repository</a>
</p>
