# WM 2026 Prediction Game — Admin & Setup Handbook

A short guide for installing the portal, getting started as an administrator, and understanding the main features.

**Related docs:** [README](../README.md) · [Deployment (Portainer)](DEPLOY-GITHUB-PORTAINER.md)

---

## Table of contents

1. [What is this app?](#1-what-is-this-app)
2. [Installation](#2-installation)
3. [First steps for administrators](#3-first-steps-for-administrators)
4. [Main features](#4-main-features)
5. [Admin panel reference](#5-admin-panel-reference)
6. [Q&A — frequently asked questions](#6-qa--frequently-asked-questions)

---

## 1. What is this app?

The **WM 2026 Prediction Game** is a company-wide World Cup tipping portal. Players predict match scores and bonus questions; departments compete by **average points per member** (not raw totals).

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, PWA, 7 languages (DE / EN / FR / ES / PT / PL / TR) |
| Backend | Node.js, Express, Socket.IO, cron jobs |
| Database | SQLite (local dev) · PostgreSQL + Redis (production) |
| Deployment | Docker images via GitHub Actions → Portainer |

**Important:** All official scoring is computed **deterministically in the backend**. AI features are optional helpers and never change official results.

---

## 2. Installation

### 2.1 Local development (quick test)

**Requirements:** Node.js 20+, npm

```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |

After seeding, log in with the demo admin:

- **Email:** `admin@example.com`
- **Password:** `admin123`

> The seed script only runs on an **empty** database. To reset locally: `npm run db:reset -- --confirm` (backend folder).

### 2.2 Production (Docker / Portainer)

Production runs as a **four-service stack**: PostgreSQL, Redis, backend, and frontend.

1. Copy [`.env.example`](../.env.example) to `.env` on your server (never commit it).
2. Set at minimum:
   - `JWT_SECRET` — at least 32 random characters (`openssl rand -hex 32`)
   - `DB_PASSWORD` — strong PostgreSQL password
   - `APP_URL` — public URL (e.g. `https://tippspiel.example.com`)
   - `CORS_ORIGIN` — must **exactly** match the browser URL
   - `FRONTEND_PORT` — host port (e.g. `8080`)
3. Deploy in Portainer using `docker-compose.prod.yml` from the Git repository.
4. Create the first admin (choose one method below).

**Full step-by-step:** [DEPLOY-GITHUB-PORTAINER.md](DEPLOY-GITHUB-PORTAINER.md)

### 2.3 Creating the first admin account

| Method | When to use |
|--------|-------------|
| **Bootstrap env vars** | Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` before first deploy. Admin is created automatically if none exists. |
| **Seed script** | After containers are running: `docker compose -f docker-compose.prod.yml exec backend node database/seed.js` |
| **CLI (existing DB)** | `npm run db:create-admin -- --email admin@company.com --password YourSecurePassword` |

### 2.4 Optional integrations

These are **not required** for basic operation:

| Feature | Environment variables |
|---------|----------------------|
| Live match sync | `FOOTBALL_API_KEY` ([football-data.org](https://www.football-data.org/)) |
| YouTube highlights | `YOUTUBE_API_KEY` |
| AI coach / admin assistant | `OPENAI_API_KEY` |
| Email (registration, reminders) | `SMTP_*` |
| Google SSO | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Feedback → GitHub Issues | `GITHUB_TOKEN`, `GITHUB_REPO` |

Without a football API key, you can still run the portal using **CSV import** and **manual result entry**.

---

## 3. First steps for administrators

Use this checklist before inviting players.

### Step 1 — Log in and verify system health

1. Open your app URL and log in as admin.
2. Go to **Admin → System Status** (`/admin/system`).
3. Confirm:
   - Database: ✓
   - WebSocket: ✓
   - Email configured (if you use reminders)
   - Football API configured (if you use auto-sync)

### Step 2 — Load match data

Choose **one** approach:

| Approach | Admin path | Notes |
|----------|------------|-------|
| **API sync** | `/admin/sync` | Set `FOOTBALL_API_KEY`, then trigger fixture sync |
| **CSV import** | `/admin/import` | Import schedule when no API key is available |
| **Built-in schedule** | Automatic on first run | WM 2026 schedule is seeded with the app |

Verify matches under **Admin → Matches** (`/admin/matches`).

### Step 3 — Set up departments (teams)

1. Go to **Admin → Teams** (`/admin/teams`).
2. Create departments (e.g. IT, Finance, HR) or import them.
3. Ensure **Require team on registration** matches your policy (configurable in app settings).

### Step 4 — Configure registration and access

| Setting | Where | Recommendation |
|---------|-------|----------------|
| Open registration | Env: `OPEN_REGISTRATION` or app settings | Keep `true` during onboarding; set `false` for invite-only later |
| Email verification | App settings | Enable for production |
| Google SSO | `.env` + Google Cloud Console | Use a hostname, not a raw IP |

### Step 5 — Review scoring and bonus questions

1. **Scoring rules** — `/admin/scoring-rules` (default: exact 4 pts, goal diff 3, tendency 2, wrong 0).
2. **Bonus questions** — `/admin/bonus-questions` (champion, top scorer, etc.).
3. **Prizes** (optional) — `/admin/prizes`.

Players can read the full rules in-app at `/help`.

### Step 6 — Test the player experience

1. Register a test user (or use demo account in dev).
2. Submit a prediction on an upcoming match.
3. Check the dashboard, leaderboard, and team ranking.
4. Optionally open **Display mode** at `/display` for TV/office screens.

### Step 7 — Communicate and go live

1. Share the app URL and registration instructions.
2. Enable **email reminders** (`/admin/email`) if SMTP is configured.
3. Monitor **Admin → Dashboard** for missing predictions and online users.

---

## 4. Main features

### 4.1 Player experience

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/dashboard` | Upcoming matches, open picks, rank, optional AI insights |
| Matches | `/matches` | All 104 games with filters and kickoff countdown |
| Group standings | `/standings` | Live group tables |
| Knockout bracket | `/bracket` | Tournament tree with zoom |
| National teams | `/national-teams` | Squads, scorers, head-to-head |
| Bonus questions | `/bonus` | Long-term predictions (champion, top scorer, …) |
| Leaderboard | `/leaderboard` | Overall, match, bonus, group, knockout filters · CSV export |
| Team ranking | `/team-ranking` | Departments ranked by **average points per member** |
| AI coach | `/ai-coach` | Optional strategy chat (does not affect scoring) |
| Notifications | In-app | Real-time updates via WebSocket |
| Report a gap | `/feedback` | Users submit bugs and ideas |
| PWA | Browser install | Add to home screen on mobile/tablet |
| Help / rules | `/help` | Scoring rules and participation info |

### 4.2 Admin experience

| Area | Route | Key actions |
|------|-------|-------------|
| Dashboard | `/admin` | Stats, online users, recalculate points, top 10 |
| Sync | `/admin/sync` | Football API sync, logs, manual triggers |
| CSV import | `/admin/import` | Import schedules and users |
| Matches | `/admin/matches` | Schedule, locks, kickoff times |
| Results | `/admin/results` | Enter or correct scores, YouTube highlights |
| Results Copilot | `/admin/results-copilot` | Fast bulk result entry workflow |
| Group standings | `/admin/group-standings` | Review and adjust tables |
| Users | `/admin/users` | Roles, departments, 2FA |
| Teams | `/admin/teams` | Department management |
| Predictions | `/admin/predictions` | View all player tips |
| Bonus & scoring | `/admin/bonus-questions`, `/admin/scoring-rules` | Questions and point rules |
| Backup | `/admin/backup` | JSON backup + Excel emergency export |
| Feedback | `/admin/feedback` | Review submissions → promote to GitHub Issue |
| Audit log | `/admin/audit-log` | Full history of admin actions |
| API documentation | `/admin/api-docs` | Interactive Swagger UI for all REST endpoints |
| System | `/admin/system` | Health, version, last sync status |
| AI assistant | `/admin/ai-assistant` | Optional admin helper (requires OpenAI key) |

### 4.3 Display mode (TV / office screen)

Public, read-only views — no login required:

| Route | Content |
|-------|---------|
| `/display` | Live leaderboard and matches |
| `/display/bracket` | Knockout bracket |

Enable or disable in app settings (`displayModeEnabled`). Useful for break rooms or event screens.

### 4.4 Default scoring

| Outcome | Points |
|---------|--------|
| Exact score | 4 |
| Correct goal difference | 3 |
| Correct tendency (win / draw / loss) | 2 |
| Wrong | 0 |

**Team ranking** uses average points per department member so small and large teams compete fairly.

---

## 5. Admin panel reference

### Daily operations during the tournament

1. **Check sync** — `/admin/sync` or dashboard banner. Cron jobs pull fixtures, live scores, and results when the API key is set.
2. **Enter missing results** — `/admin/results` or Results Copilot. Manually locked matches (`isManuallyLocked`) are never overwritten by sync.
3. **Recalculate points** — Dashboard → **Recalculate** if scores were corrected manually.
4. **Monitor missing tips** — Dashboard shows `missingPredictions` count.
5. **Send reminders** — `/admin/email` (requires SMTP).

### User management

- Promote users to admin under **Users**.
- Assign departments under **Teams** or during user edit.
- Disable open registration after onboarding via `OPEN_REGISTRATION=false` or app settings.

### Data safety

- **Backup** — `/admin/backup`: JSON player data + Excel export for emergencies.
- **Audit log** — Every admin action is logged at `/admin/audit-log`.
- Hourly player-data JSON backups run automatically in production (`PLAYER_DATA_BACKUP_*`).

### Locking matches

If you manually set a result, lock the match to prevent the API sync from overwriting it. Manage locks in **Admin → Matches** or **Results**.

### API documentation (Swagger)

Admins can explore and test the full REST API without leaving the portal:

1. Open **Admin → API Documentation** (`/admin/api-docs`).
2. Browse endpoints grouped by tags (Auth, Matches, Admin, Sync, …).
3. Use **Try it out** — requests are sent with your current admin JWT and `X-Language` header.

The machine-readable spec is available at `GET /api/docs/openapi.json` (same admin auth). It is generated automatically from the Express route files under `backend/routes/`. Alias path: `/api/v1/docs/openapi.json`.

Useful for integrations, debugging, and onboarding developers. Response schemas are generic today; extend `backend/openapi/buildOpenApiSpec.js` for richer field documentation.

---

## 6. Q&A — frequently asked questions

### Installation & deployment

**Q: The Docker stack won't start. What am I missing?**  
A: Set `JWT_SECRET` (min. 32 characters) and `DB_PASSWORD`. Both are mandatory in `docker-compose.prod.yml`.

**Q: I see a blank page or 502 error after deploy.**  
A: Wait for the backend health check to pass. Check backend container logs. Ensure PostgreSQL is running and `DB_PASSWORD` matches.

**Q: API calls fail with CORS errors.**  
A: `CORS_ORIGIN` must **exactly** match the URL in the browser bar (scheme + host + port). After changing it, redeploy the stack.

**Q: How do I update to a new version?**  
A: Push to `main` → wait for GitHub Actions → Portainer **Pull and redeploy**. Hard-refresh the browser (`Ctrl+F5`).

**Q: Can I run multiple backend instances for scaling?**  
A: No. Cron jobs and WebSockets are designed for a **single backend instance**.

---

### Admin & accounts

**Q: How do I create an admin if I forgot to set bootstrap credentials?**  
A: Run inside the backend container:  
`node database/create-admin.js --email you@company.com --password YourPassword`  
Or use `npm run db:create-admin` locally.

**Q: Can I stop new users from registering?**  
A: Yes. Set `OPEN_REGISTRATION=false` in `.env` or disable registration in app settings.

**Q: Should admins appear on the public leaderboard?**  
A: By default, no. Toggle **Include admins in leaderboard** on the admin dashboard if you want them visible.

**Q: How do I reset the database completely?**  
A: Development only: `npm run db:reset -- --confirm` in the backend folder. In production, restore from backup or recreate PostgreSQL volume (data loss).

---

### Match data & results

**Q: Live results are not updating. What should I check?**  
A: 1) `FOOTBALL_API_KEY` is set. 2) Sync is enabled in `/admin/sync`. 3) Check `/admin/system` for last sync time and errors. 4) Match is not manually locked.

**Q: Can I run without a football API key?**  
A: Yes. Import the schedule via CSV (`/admin/import`) and enter results manually in `/admin/results`.

**Q: The API overwrote my manual result. How do I prevent that?**  
A: Lock the match after manual entry. Locked matches are skipped by automatic sync.

**Q: How do I add YouTube highlight links to matches?**  
A: Set `YOUTUBE_API_KEY`, then search highlights per match in the admin results UI. Optional: enable `AUTO_HIGHLIGHTS_ENABLED=true` for automatic suggestions.

---

### Scoring & fairness

**Q: How are points calculated?**  
A: Exact score = 4 pts, correct goal difference = 3, correct W/D/L = 2, wrong = 0. Full rules are at `/help`.

**Q: Why is team ranking based on average points, not total?**  
A: So departments with fewer members are not penalized. A team of 5 is compared fairly to a team of 50.

**Q: I corrected a result but points look wrong.**  
A: Click **Recalculate** on the admin dashboard. Points are recomputed for all affected predictions.

**Q: Do AI coach suggestions affect the official score?**  
A: No. AI is advisory only. Official scoring always comes from backend logic.

---

### Email, SSO & integrations

**Q: Registration emails are not sent.**  
A: Configure `SMTP_*` variables. Without SMTP, emails are logged in mock mode (visible in backend logs). Check `/admin/system` — Email should show ✓.

**Q: Google SSO login fails or shows `{"google":false}`.**  
A: Set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Use a **hostname** for `APP_URL` and `GOOGLE_CALLBACK_URL` (Google rejects raw IPs). Callback URL must be `{APP_URL}/api/auth/google/callback`.

**Q: How does the feedback → GitHub workflow work?**  
A: Users submit at `/feedback`. Admins review at `/admin/feedback` and click **OK → GitHub** to create an issue. Requires `GITHUB_TOKEN` with Issues write access and `GITHUB_REPO`.

**Q: Where can I see or test the REST API?**  
A: Log in as admin and open **Admin → API Documentation** (`/admin/api-docs`). Swagger UI lists all endpoints and supports “Try it out” with your session token. The OpenAPI JSON is at `/api/docs/openapi.json`.

---

### Display mode & privacy

**Q: Can anyone see the leaderboard without logging in?**  
A: Only via **Display mode** (`/display`) when enabled. The main leaderboard requires login unless `leaderboardPublic` is enabled in settings.

**Q: How do I turn off display mode?**  
A: Disable `displayModeEnabled` in app settings. Display routes will return forbidden.

**Q: Can players see each other's predictions before kickoff?**  
A: Controlled by `showPredictionsBeforeKickoff` and `showPredictionsAfterKickoff` in app settings. Default: hidden before kickoff, hidden after kickoff.

---

### Troubleshooting

**Q: WebSocket / live notifications don't work behind Nginx.**  
A: Ensure your reverse proxy forwards `/socket.io/` to the backend. See `frontend/nginx.conf` for the reference configuration.

**Q: All users hit rate limits at once.**  
A: Set `TRUST_PROXY=true` and ensure the reverse proxy sends `X-Forwarded-For`.

**Q: Where can I get more help?**  
A: See [DEPLOY-GITHUB-PORTAINER.md#troubleshooting](DEPLOY-GITHUB-PORTAINER.md#troubleshooting), submit feedback via `/feedback`, or open an issue on GitHub.

---

<p align="center">
  <sub>WM 2026 Prediction Game · Admin Handbook</sub>
</p>
