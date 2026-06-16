<p align="center">
  <img src="frontend/public/wm2026-emblem.svg" width="100" alt="FIFA World Cup 2026 emblem" />
</p>

<h1 align="center">WM 2026 Prediction Game</h1>

<p align="center">
  Football prediction web app for company teams — live scores, bonus questions, team rankings, AI coach &amp; full admin panel
</p>

<p align="center">
  <a href="https://github.com/schmeckm/WM2026_Prediction/actions/workflows/ci.yml"><img src="https://github.com/schmeckm/WM2026_Prediction/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/schmeckm/WM2026_Prediction/actions/workflows/docker-publish.yml"><img src="https://github.com/schmeckm/WM2026_Prediction/actions/workflows/docker-publish.yml/badge.svg" alt="Docker Publish" /></a>
  <img src="https://img.shields.io/badge/version-1.0.6-blue" alt="Version 1.0.6" />
  <img src="https://img.shields.io/badge/node-20%2B-green" alt="Node.js 20+" />
  <img src="https://img.shields.io/badge/vue-3-42b883" alt="Vue 3" />
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="Proprietary License" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/DEPLOY-GITHUB-PORTAINER.md">Deployment</a> ·
  <a href="docs/GITHUB-SETUP.md">GitHub Setup</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="https://github.com/schmeckm/WM2026_Prediction">GitHub</a>
</p>

---

## Table of Contents

- [Screenshots](#screenshots)
- [Overview](#overview)
- [Features](#features)
- [Scoring Rules](#scoring-rules)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [API Overview](#api-overview)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Screenshots

> Add screenshots under `docs/images/` and link them here. See [docs/images/README.md](docs/images/README.md).

<p align="center">
  <img src="docs/images/dashboard.svg" width="45%" alt="Dashboard" />
  <img src="docs/images/matches.svg" width="45%" alt="Matches" />
</p>

<p align="center">
  <img src="docs/images/bracket.svg" width="45%" alt="Knockout bracket" />
  <img src="docs/images/leaderboard.svg" width="45%" alt="Leaderboard" />
</p>

---

## Overview

This prediction game is built for **internal company teams** (e.g. IT, Finance, HR). Each participant independently predicts all **104 World Cup matches** (72 group stage + 32 knockout games). Points, leaderboard, and team rankings are calculated **deterministically in the backend** — optionally complemented by AI helpers that do not produce official results.

| | |
|---|---|
| **Frontend** | Vue 3 SPA, PWA-ready, 7 languages (DE/EN/FR/ES/PT/PL/TR) |
| **Backend** | Node.js REST API + WebSocket |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Cache** | Redis (prod — rate limits, presence, live features) |
| **Operations** | Manual (CSV) or automatic (Football API + YouTube) |

---

## Features

### For Players

| Feature | Description |
|---------|-------------|
| **Dashboard** | Personal overview: upcoming matches, open predictions, rank, AI insights |
| **Matches** | All 104 World Cup games with filters (open, finished, missing picks), kickoff countdown |
| **My Predictions** | Compact overview of all submitted forecasts |
| **Group Standings** | Live tables for groups A–L with projections |
| **Knockout Bracket** | Bracket with zoom, list view, and match linking |
| **National Teams** | Squads, tables, scorers, live matches, World Cup head-to-head history |
| **Bonus Questions** | Special bets (champion, runner-up, third place, top scorer, team progress) |
| **Leaderboard** | Rankings with filters (overall, matches, bonus, group, knockout), CSV export |
| **Team Ranking** | Department ranking by **average points per member** (not total sum) |
| **Statistics** | Personal performance with Chart.js diagrams |
| **Prizes** | Visible prizes for places 1–3 (enabled by admin) |
| **Profile** | Avatar, favorite team, top scorer pick, language, dark mode, optional 2FA |
| **Rules** | Official guidelines at `/help` |
| **AI Coach** | Chat about strategy, missing predictions, and points |
| **Notifications** | In-app messages with live updates via WebSocket |
| **Report a gap** | Users submit bugs/changes/features at `/feedback` |
| **PWA** | Installable on smartphone/tablet |

### Authentication & Profile

- Email/password registration with verification
- **Google SSO** (optional, via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- Password reset via email
- **Two-factor authentication** (TOTP) in profile
- Reminder for incomplete profile (favorite team + top scorer)

### Public Display Mode

For projector/TV without login:

| Route | Content |
|-------|---------|
| `/display` | Leaderboard & highlights |
| `/display/bracket` | Knockout bracket |

Enabled and access-controlled via admin settings (`displayModeEnabled`).

### AI Features (optional)

> **AI is not a source of truth.** It does not calculate points, invent results, or change predictions.

| Feature | Audience | Description |
|---------|----------|-------------|
| Match preview | Players | Neutral opinion per match |
| AI coach | Players | Chat about predictions, rank, and strategy |
| Leaderboard commentary | Players | Short summary of rank movements |
| Dashboard insights | Players | Personalized hint cards |
| Admin assistant | Admin | Diagnostics, recommendations, copy |
| Bonus suggestions | Admin | Suggestions for new bonus questions |
| Reminder copy | Admin | Email and in-app reminder text |

Enable via `OPENAI_API_KEY` in `backend/.env`. Individual features can be disabled separately.

### Admin Panel

| Area | Functions |
|------|-----------|
| **Dashboard** | System overview, quick actions, AI insights, **who is online** |
| **Users** | Create, roles, lock, admin rights |
| **Teams** | Manage departments |
| **Matches** | Edit schedule, lock, correct; **YouTube highlight** search & auto-fill |
| **Results** | Manual result entry |
| **Predictions** | View and manage all forecasts |
| **Import** | CSV schedule import |
| **Sync** | Football API: fixtures, results, live scores, player images |
| **Bonus Questions** | Create, resolve, apply tournament suggestions |
| **Scoring Rules** | Exact / goal difference / tendency configurable |
| **Prizes** | Define and publish places 1–3 |
| **Email** | SMTP reminders for missing predictions |
| **Notifications** | In-app messages to all or individual users |
| **User feedback** | Review portal submissions; **OK → GitHub Issue** |
| **Statistics** | Overview, completeness, missing predictions |
| **Favorites** | Users' favorite teams and top scorers |
| **Player Images** | Sync via TheSportsDB / Wikimedia |
| **Backup** | JSON export/import, **Excel emergency export** (leaderboard, predictions, bonus, matches) |
| **Audit Log** | Log of all admin actions |
| **System** | Settings, display mode, app title |
| **AI Assistant** | Admin AI with interaction log |

### Automation

| Job | Schedule | Description |
|-----|----------|-------------|
| Fixture sync | Daily 06:00 | Update fixed schedules |
| Fixture sync (tournament) | Every 6 hours | During World Cup period |
| Result sync | Every 15 minutes | During World Cup period |
| Live sync | Every 5 minutes | Only during live matches |
| Email reminders | Daily 09:00 | Missing predictions & bonus questions |
| Leaderboard snapshot | Hourly | Save rank history |
| Player data backup | Hourly | JSON backup of users, teams, predictions |
| Auto highlights | Configurable | YouTube highlight suggestions for finished matches (`AUTO_HIGHLIGHTS_*`) |

### YouTube Highlights (optional)

Requires `YOUTUBE_API_KEY` ([YouTube Data API v3](https://console.cloud.google.com/)):

| Mode | Description |
|------|-------------|
| **Manual search** | Admin finds highlight videos per match in match administration |
| **Auto-fill** | Cron job (`AUTO_HIGHLIGHTS_ENABLED=true`) attaches suggestions after matches finish |

```env
YOUTUBE_API_KEY=
YOUTUBE_REGION_CODE=CH
AUTO_HIGHLIGHTS_ENABLED=false
AUTO_HIGHLIGHTS_CRON=15 */2 * * *
```

### User Feedback → GitHub (optional)

Players report gaps at `/feedback`. Admins manage them at `/admin/feedback` and promote approved items to GitHub Issues:

```env
GITHUB_TOKEN=ghp_...
GITHUB_REPO=schmeckm/WM2026_Prediction
GITHUB_FEEDBACK_LABELS=feedback
```

---

## Scoring Rules

### Points per Match

After full time, only the **best matching category** counts:

| Outcome | Points (default) |
|---------|------------------|
| Exact score | 4 |
| Correct goal difference (when predicting a win) | 3 |
| Correct tendency (win/draw) | 2 |
| Wrong prediction | 0 |

### Bonus Questions (default)

| Question | Points |
|----------|--------|
| World champion | 8 |
| Runner-up | 4 |
| Third place | 2 |
| Top scorer | 4 |
| How far does your favorite team go? | 2 |

### Team Ranking

Each department is rated by **average points per registered member** — the largest department does not automatically win.

### Prediction Requirement

Technically, not all matches are mandatory (missing predictions = 0 points). **House rule:** Every participant predicts all 104 matches themselves.

Full rules are available in the app under **Rules** (`/help`).

---

## Tech Stack

| Area | Technologies |
|------|--------------|
| **Frontend** | Vue 3, Vite, Pinia, Vue Router, Vue I18n, Axios, Chart.js, Socket.IO Client, PWA |
| **Backend** | Node.js, Express, Sequelize, Socket.IO, node-cron, nodemailer, OpenAI, ExcelJS |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **Cache** | Redis 7 (production — rate limits, presence) |
| **Auth** | JWT, bcrypt, Google OIDC, TOTP (speakeasy) |
| **Monitoring** | Sentry (optional), Prometheus metrics |
| **CI/CD** | GitHub Actions → GHCR Docker images |

---

## Quick Start

### Prerequisites

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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/api/health |

### Demo Accounts (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | max.mueller@example.com | user123 |

### Database Commands

```bash
cd backend
npm run db:migrate          # Apply schema changes (no data loss)
npm run db:seed-teams       # Default company teams
npm run db:reset -- --confirm   # Full reset (dev only!)
npm run seed                # Demo data (empty DB only)
```

---

## Configuration

| File | Use case |
|------|----------|
| [`backend/.env.example`](backend/.env.example) | Local development (SQLite) |
| [`.env.docker.example`](.env.docker.example) | **Production / Portainer** (copy to `.env`, never commit) |

### Local development (quick reference)

```env
PORT=3000
JWT_SECRET=your-secret-key
APP_URL=http://localhost:5173
DB_DIALECT=sqlite
DB_PATH=./database/wm2026.sqlite
FOOTBALL_API_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Football API

**Default:** CSV import + manual results — the app works **fully without an API key**.

| Provider | `FOOTBALL_API_PROVIDER` | Recommendation |
|----------|-------------------------|----------------|
| football-data.org v4 | `football-data` | **Recommended** |
| API-Football | `api-football` | Alternative |
| Sportmonks | `sportmonks` | Alternative |
| TheStatsAPI | `thestatsapi` | Alternative |

The frontend **never** calls external APIs directly. Admin sync is at `/admin/sync`.

**Overwrite protection:**

- `isManuallyLocked = true` → API will not overwrite
- `isApiManaged = false` → match skipped during sync
- All sync operations logged in `SyncLog`

### AI Cost Control

| Measure | Description |
|---------|-------------|
| Caching | Previews and commentary in `AICommentary` |
| Token limit | `AI_MAX_TOKENS=800` |
| Rate limits | Coach: 20/day, Admin: 50/day, Bonus: 20/day |
| Model | `gpt-4o-mini` (default) |

---

## Deployment

### Docker (local development)

```bash
# SQLite
docker compose up --build
docker compose exec backend node database/seed.js

# PostgreSQL profile
docker compose --profile postgres up --build
```

### Production (GitHub + Portainer + GHCR)

**Full guide:** [**docs/DEPLOY-GITHUB-PORTAINER.md**](docs/DEPLOY-GITHUB-PORTAINER.md)

The production stack (`docker-compose.prod.yml`) runs **PostgreSQL**, **Redis**, **backend**, and **frontend**. Images are published to GHCR on every push to `main`:

```
ghcr.io/schmeckm/wm2026_prediction-backend:latest
ghcr.io/schmeckm/wm2026_prediction-frontend:latest
```

#### Quick start (Portainer)

1. Copy [`.env.docker.example`](.env.docker.example) → `.env` and fill in variables (see tables below)
2. Portainer → **Stacks** → **Add stack**
3. Git repo: `https://github.com/schmeckm/WM2026_Prediction`, branch `main`, compose path `docker-compose.prod.yml`
4. **Load variables from .env file** (or paste variables manually)
5. **Deploy the stack**
6. Optional first-time: `docker compose exec backend node database/seed.js` or set `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`

#### Mandatory environment variables

| Variable | Required by | Description |
|----------|-------------|-------------|
| `JWT_SECRET` | Docker Compose (`:?`) | Random secret, min. 32 characters — **stack fails without it** |
| `DB_PASSWORD` | Docker Compose (`:?`) | PostgreSQL password — **stack fails without it** |

#### Required for a working public URL

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_URL` | `https://tippspiel.example.com` | Public app URL (emails, OAuth, links) |
| `CORS_ORIGIN` | same as `APP_URL` | Must **exactly** match browser origin |
| `FRONTEND_PORT` | `8080` | External port (host → frontend container) |

#### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `TRUST_PROXY` | `true` | Behind reverse proxy — correct client IPs for rate limits |
| `DB_NAME` / `DB_USER` | `wm2026` / `postgres` | PostgreSQL credentials |
| `REDIS_URL` | `redis://redis:6379` | Leave default in Docker stack |

#### Optional integrations

| Feature | Key variables |
|---------|---------------|
| Football live sync | `FOOTBALL_API_KEY`, `FOOTBALL_API_SYNC_ENABLED` |
| YouTube highlights | `YOUTUBE_API_KEY`, `YOUTUBE_REGION_CODE`, `AUTO_HIGHLIGHTS_*` |
| OpenAI / AI coach | `OPENAI_API_KEY`, `AI_FEATURES_ENABLED` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |
| Google SSO | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| Feedback → GitHub | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_FEEDBACK_LABELS` |
| First admin | `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` |
| Sentry | `SENTRY_DSN`, `VITE_SENTRY_DSN` |

> **Google SSO in production:** Do not use raw IPs — use e.g. `136-244-90-128.sslip.io` for `APP_URL`, `CORS_ORIGIN`, and `GOOGLE_CALLBACK_URL`.

#### Updating production

```bash
git push   # triggers GitHub Actions image build
# Portainer → Stack → Pull and redeploy
```

**Never commit** `.env` or `backend/.env` to Git.

---

## Architecture

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

    subgraph data [Data]
        DB[(SQLite / PostgreSQL)]
        Redis[(Redis – production)]
    end

    subgraph external [External – optional]
        FAPI[Football API]
        YT[YouTube Data API]
        GH[GitHub Issues API]
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
    API --> YT
    API --> GH
    API --> SMTP
    AI --> OAI
    SIO --> Redis
```

---

## API Overview

Full endpoints are in route files under `backend/routes/`.

### Core (Players)

```
GET  /api/matches
GET  /api/matches/:id/highlight-suggestions
POST /api/predictions
GET  /api/leaderboard
GET  /api/leaderboard/tournament-phase
GET  /api/leaderboard/export
POST /api/feedback
GET  /api/bonus-questions
GET  /api/scoring-rules
GET  /api/statistics/me
```

### AI (Players)

```
GET  /api/ai/status
POST /api/ai/match-preview/:matchId
POST /api/ai/user-coach
GET  /api/ai/leaderboard-summary
GET  /api/ai/dashboard-insights
```

### Admin (selection)

```
POST /api/admin/sync/fixtures
POST /api/admin/sync/results
GET  /api/admin/feedback
POST /api/admin/feedback/:id/github-issue
GET  /api/admin/presence
POST /api/admin/bonus-questions/:id/resolve
GET  /api/admin/audit-log
POST /api/admin/backup/export-excel
POST /api/admin/ai/assistant
```

### Display (public)

```
GET  /api/display/leaderboard
GET  /api/display/bracket
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Stack won't start | Set `JWT_SECRET` and `DB_PASSWORD` in Portainer / `.env` |
| API sync fails | Check `FOOTBALL_API_KEY` and provider, test connection at `/admin/sync` |
| YouTube highlights empty | Set `YOUTUBE_API_KEY`; enable YouTube Data API v3 in Google Cloud |
| Feedback → GitHub fails | Set `GITHUB_TOKEN` + `GITHUB_REPO`; token needs Issues write access |
| Rate limit for everyone | Set `TRUST_PROXY=true`; reverse proxy must send `X-Forwarded-For` |
| No emails | Configure SMTP in `.env` or check mock log in console |
| WebSocket won't connect | Restart backend, check Nginx `/socket.io/` proxy |
| DB schema outdated | Run `npm run db:migrate` or restart backend with migration |
| Port 3000 in use | Set `PORT=3001` in `.env` |
| AI not responding | Check `OPENAI_API_KEY`, set `AI_FEATURES_ENABLED=true` |
| Google SSO error | Callback URL and `APP_URL` must exactly match the domain |
| Player image sync stuck | Resume sync in admin; stale jobs are detected after timeout |
| Old UI after deploy | Portainer **Pull and redeploy**; hard refresh (`Ctrl+F5`) |

---

## License

Proprietary software — for private/internal use only. See [LICENSE](LICENSE).

---

<p align="center">
  <sub>WM 2026 Prediction Game · Version 1.0.6</sub><br />
  <a href="https://github.com/schmeckm/WM2026_Prediction">GitHub Repository</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="SECURITY.md">Security</a>
</p>
