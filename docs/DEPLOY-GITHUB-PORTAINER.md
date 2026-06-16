# Deployment: GitHub + Docker + Portainer

This guide walks you from the GitHub repository to a running production stack with **PostgreSQL**, **Redis**, **backend**, and **frontend**.

**Template for all variables:** [`.env.docker.example`](../.env.docker.example) (project root — not `backend/.env`)

---

## Architecture (production stack)

| Service | Image | Purpose |
|---------|-------|---------|
| `postgres` | `postgres:16-alpine` | Application database |
| `redis` | `redis:7-alpine` | Rate limits, presence, Socket.IO scaling helpers |
| `backend` | `ghcr.io/schmeckm/wm2026_prediction-backend:latest` | Node.js API + WebSocket + cron jobs |
| `frontend` | `ghcr.io/schmeckm/wm2026_prediction-frontend:latest` | Nginx serving the Vue build |

Images are built by **GitHub Actions** on every push to `main` and published to GitHub Container Registry (GHCR). Portainer **pulls** these images — it does not build them from source unless you override `BACKEND_IMAGE` / `FRONTEND_IMAGE`.

---

## Environment variables

### Mandatory (stack will not start without these)

These are enforced in `docker-compose.prod.yml` (`:?` syntax):

| Variable | Example | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `openssl rand -hex 32` | Secret for signing login tokens. **Min. 32 random characters.** |
| `DB_PASSWORD` | strong unique password | PostgreSQL password for the `postgres` service |

### Mandatory for a working public deployment

The stack starts without these, but login, API calls, or links will break if they are wrong:

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_URL` | `https://tippspiel.example.com` | Public URL of the app (emails, OAuth redirects, absolute links) |
| `CORS_ORIGIN` | same as `APP_URL` | Must **exactly** match the browser origin (scheme + host + port) |
| `FRONTEND_PORT` | `8080` or `8081` | Host port mapped to the frontend container (`host:80`) |

> **Google SSO:** Google rejects raw IP addresses. Use a hostname such as `http://136-244-90-128.sslip.io:8081` for `APP_URL`, `CORS_ORIGIN`, and `GOOGLE_CALLBACK_URL`.

### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `TRUST_PROXY` | `true` | Set when running behind Nginx/Traefik so rate limits use the real client IP |
| `DB_NAME` | `wm2026` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL user |
| `REDIS_URL` | `redis://redis:6379` | Leave default in Docker stack |
| `OPEN_REGISTRATION` | `true` | Set `false` after initial onboarding if you want invite-only |

### Optional — feature integrations

| Feature | Variables | Notes |
|---------|-----------|-------|
| **Football API sync** | `FOOTBALL_API_KEY`, `FOOTBALL_API_*` | Without key: CSV import + manual results still work |
| **YouTube highlights** | `YOUTUBE_API_KEY`, `YOUTUBE_REGION_CODE` | Match highlight search in admin; optional auto-fill via `AUTO_HIGHLIGHTS_*` |
| **OpenAI / AI coach** | `OPENAI_API_KEY`, `AI_*` | Disable with `AI_FEATURES_ENABLED=false` |
| **Email** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Without SMTP: emails are logged only (mock mode) |
| **Google SSO** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Both Google vars required; callback = `{APP_URL}/api/auth/google/callback` |
| **User feedback → GitHub** | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_FEEDBACK_LABELS` | Admin approves portal feedback as GitHub Issues |
| **First admin bootstrap** | `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Only used when no admin exists yet |
| **Sentry** | `SENTRY_DSN`, `VITE_SENTRY_DSN` | Error monitoring |
| **Rate limits** | `API_RATE_LIMIT_MAX`, `RATE_LIMIT_ENABLED` | See `.env.docker.example` |

### YouTube API (highlights)

```env
YOUTUBE_API_KEY=your-google-api-key
YOUTUBE_REGION_CODE=CH
AUTO_HIGHLIGHTS_ENABLED=false
AUTO_HIGHLIGHTS_CRON=15 */2 * * *
```

- **Manual:** Admins search YouTube highlight videos per match in the admin UI.
- **Automatic:** Set `AUTO_HIGHLIGHTS_ENABLED=true` — cron job suggests highlights for finished matches.
- API key from [Google Cloud Console](https://console.cloud.google.com/) → enable **YouTube Data API v3**.

### GitHub feedback integration

Portal users submit feedback at `/feedback`. Admins review at `/admin/feedback` and click **OK → GitHub** to create an issue.

```env
GITHUB_TOKEN=ghp_xxxxxxxx
GITHUB_REPO=schmeckm/WM2026_Prediction
GITHUB_FEEDBACK_LABELS=feedback
```

Token needs **Issues: Read and write** on the target repository.

---

## Step 1: Prepare your `.env` file

On your machine (do **not** commit this file):

```powershell
copy .env.docker.example .env
```

Fill in at minimum:

```env
JWT_SECRET=your-long-random-secret-min-32-chars
DB_PASSWORD=your-strong-db-password
APP_URL=https://tippspiel.example.com
CORS_ORIGIN=https://tippspiel.example.com
FRONTEND_PORT=8080
```

Add optional keys (`FOOTBALL_API_KEY`, `YOUTUBE_API_KEY`, `OPENAI_API_KEY`, `GITHUB_TOKEN`, …) as needed.

---

## Step 2: Deploy in Portainer

### Option A: Git repository (recommended)

1. Portainer → **Stacks** → **Add stack**
2. Name: e.g. `wm2026-prediction`
3. **Build method:** Git repository
4. **Repository URL:** `https://github.com/schmeckm/WM2026_Prediction`
5. **Repository reference:** `main`
6. **Compose path:** `docker-compose.prod.yml`
7. **Environment variables:** paste from your `.env` file, or use **Load variables from .env file** and upload `.env`
8. **Deploy the stack**

Portainer clones the compose file and starts four services. Backend and frontend images are pulled from GHCR.

### Option B: Web editor

1. Portainer → **Stacks** → **Add stack**
2. Paste the contents of `docker-compose.prod.yml` from the repository
3. Add environment variables (same as Option A)
4. Deploy

### Option C: Manual on the server

```bash
git clone https://github.com/schmeckm/WM2026_Prediction.git
cd WM2026_Prediction
cp .env.docker.example .env
# edit .env — set JWT_SECRET, DB_PASSWORD, APP_URL, CORS_ORIGIN
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Step 3: First-time database setup

After containers are healthy, create schema and optional demo data:

```bash
docker compose -f docker-compose.prod.yml exec backend node database/seed.js
```

In Portainer: container **backend** → **Console** → run `node database/seed.js`

**Alternatively** for production without demo users, set once:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@yourcompany.com
BOOTSTRAP_ADMIN_PASSWORD=secure-password
```

Redeploy — the first admin is created automatically if none exists.

---

## Step 4: HTTPS / reverse proxy (recommended)

The frontend listens on `FRONTEND_PORT` (default `8080`). In production, put **Nginx Proxy Manager**, **Traefik**, or similar in front:

1. Proxy `https://your-domain` → `http://server-ip:8080`
2. Enable TLS (Let's Encrypt)
3. Set `APP_URL` and `CORS_ORIGIN` to `https://your-domain`
4. Set `TRUST_PROXY=true`
5. Redeploy the stack

---

## Deploying updates

1. Push changes to `main` on GitHub
2. Wait for GitHub Actions **Docker Publish** workflow to finish
3. Portainer → your stack → **Pull and redeploy**

Or manually:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Volumes & backups

| Volume | Content |
|--------|---------|
| `postgres-data` | PostgreSQL data |
| `backend-uploads` | Avatars, team logos, prize images |
| `backend-backups` | JSON player backups, DB dumps |

Hourly player-data JSON backups run in the backend (`PLAYER_DATA_BACKUP_*`). Admin UI: **Datensicherung** (`/admin/backup`).

---

## Production rules

- **`DB_DIALECT=postgres`** is fixed in `docker-compose.prod.yml` — SQLite is not used in production
- **Single backend instance** — cron jobs and WebSockets are not designed for horizontal scaling
- **Never commit** `.env`, `backend/.env`, or database files to Git
- **Secrets** live only in Portainer / server `.env`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Stack won't start | Set `JWT_SECRET` and `DB_PASSWORD` |
| 502 / blank page | Check backend container logs; wait for healthcheck |
| CORS / API blocked | `CORS_ORIGIN` must exactly match the browser URL |
| WebSocket / live updates | Nginx must proxy `/socket.io/` (see `frontend/nginx.conf`) |
| `{"google":false}` | Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`; redeploy |
| YouTube highlights empty | Set `YOUTUBE_API_KEY`; enable YouTube Data API v3 in Google Cloud |
| Feedback → GitHub fails | Set `GITHUB_TOKEN` + `GITHUB_REPO`; token needs Issues write access |
| Rate limit errors for all users | Set `TRUST_PROXY=true`; ensure reverse proxy sends `X-Forwarded-For` |
| Old UI after deploy | Hard refresh (`Ctrl+F5`); confirm GHCR images were pulled |

---

## File reference

| File | Purpose |
|------|---------|
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | Production stack (Postgres + Redis + backend + frontend) |
| [`.env.docker.example`](../.env.docker.example) | Environment variable template for Portainer |
| [`backend/.env.example`](../backend/.env.example) | Local development only (SQLite) |
| [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) | CI: build & push GHCR images |
