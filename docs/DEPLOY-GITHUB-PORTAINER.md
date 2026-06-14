# Deployment: GitHub + Docker + Portainer (with PostgreSQL)

This guide covers the path from local development to a production stack in Portainer.

## Prerequisites

- GitHub account
- Server with Docker and [Portainer](https://www.portainer.io/)
- Optional: domain + reverse proxy (Traefik/Nginx Proxy Manager) for HTTPS

---

## Step 1: Push the Project to GitHub

### 1.1 Check for secrets (important)

The following files **must not** be committed to the repository:

- `backend/.env`
- `.env` in the project root
- `*.sqlite` database files

These are already listed in `.gitignore`.

### 1.2 Initialize Git and push

In the project folder (PowerShell):

```powershell
cd c:\Users\marku\OneDrive\Dokumente\node_project\wm2026-tipspiel

git init
git add .
git commit -m "Initial commit: WM 2026 Prediction Game"
```

Create a **new empty repository** on GitHub (e.g. `aspire-make-tippspiel`), then:

```powershell
git branch -M main
git remote add origin https://github.com/schmeckm/aspire-make-tippspiel.git
git push -u origin main
```

> Replace `schmeckm/aspire-make-tippspiel` with your actual repository if different.

---

## Step 2: Prepare Environment Variables

Copy the template:

```powershell
copy .env.docker.example .env
```

For **production with PostgreSQL**, set at minimum:

| Variable | Example | Description |
|----------|---------|-------------|
| `JWT_SECRET` | long random string | Required, no default value |
| `DB_PASSWORD` | secure password | PostgreSQL password |
| `DB_USER` | `wm2026` | DB user |
| `DB_NAME` | `wm2026` | Database name |
| `APP_URL` | `https://tippspiel.example.com` | Public URL (emails, links) |
| `CORS_ORIGIN` | same as `APP_URL` | CORS for API/WebSocket |
| `FOOTBALL_API_KEY` | your API key | Optional, for live sync |
| `OPENAI_API_KEY` | your key (`sk-proj-...`, **no** leading `=`) | Optional, for AI features |
| `SMTP_*` | mail server | For registration / password reset |
| `GOOGLE_CLIENT_ID` | OAuth client ID | For Google SSO (both Google vars required) |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | **No leading `=`** |
| `GOOGLE_CALLBACK_URL` | `https://…/api/auth/google/callback` | Must be registered in Google Console |

**Google SSO:** Raw IPs are rejected by Google — instead of `http://136.244.90.128:8081`, use e.g. `http://136-244-90-128.sslip.io:8081` for `APP_URL`, `CORS_ORIGIN`, and `GOOGLE_CALLBACK_URL`.

`FRONTEND_PORT` controls the external port (default `8080`).

---

## Step 3: Deploy Stack in Portainer

### Option A: Git Repository (recommended)

1. Portainer → **Stacks** → **Add stack**
2. Name: e.g. `wm2026-tippspiel`
3. **Build method**: Git repository
4. Repository URL: `https://github.com/schmeckm/aspire-make-tippspiel`
5. Repository reference: `main`
6. **Compose path**: `docker-compose.prod.yml`
7. **Environment variables**: enter values from `.env` (or "Load variables from .env file")
8. **Deploy the stack**

Portainer clones the repo, builds images, and starts:

- `postgres` – PostgreSQL 16 (data in volume `postgres-data`)
- `backend` – Node.js API
- `frontend` – Nginx with Vue build (port `8080` → app)

### Option B: Manual on the Server

```bash
git clone https://github.com/schmeckm/aspire-make-tippspiel.git
cd aspire-make-tippspiel
cp .env.docker.example .env
# edit .env
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Step 4: Initialize the Database (one-time)

After the first start, create tables and load demo/seed data:

```bash
docker compose -f docker-compose.prod.yml exec backend node database/seed.js
```

In Portainer: container `backend` → **Console** → command:

```
node database/seed.js
```

Default admin (if included in seed): see `backend/database/demoData.js`.

---

## Step 5: HTTPS / Reverse Proxy (recommended)

The app listens internally on port `8080`. In front of Portainer, typically:

- **Nginx Proxy Manager** or **Traefik** as reverse proxy
- Domain → `http://server-ip:8080`
- Enable Let's Encrypt certificate
- Set `APP_URL` and `CORS_ORIGIN` to `https://…` and redeploy the stack

---

## Deploying Updates

For a Git-based stack in Portainer:

1. Push changes: `git push`
2. Portainer → Stack → **Pull and redeploy** (or webhook)

Manually:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Volumes & Backups

| Volume | Content |
|--------|---------|
| `postgres-data` | PostgreSQL data |
| `backend-uploads` | Profile pictures, uploads |
| `backend-backups` | DB dumps, SQLite copies, upload backups |

### Automatic Backups (scheduler)

| Job | Schedule | Content |
|-----|----------|---------|
| Postgres/SQLite | Daily 03:00 | Full DB dump or SQLite file copy |
| Postgres | Sunday 02:00 | Additional weekly dump |
| Uploads | Daily 03:30 | Copy of `/app/uploads` folder |
| Retention | automatic | PG: 14 days, SQLite/uploads: 7 days (configurable) |

Optional: set `BACKUP_OFFSITE_DIR` — backups are copied there after each run (e.g. mounted NAS or cloud sync folder).

Manual PostgreSQL backup:

```bash
docker compose -f docker-compose.prod.yml exec backend node database/postgres-backup-cli.js
```

### Disaster Recovery – Restore PostgreSQL

**Prerequisite:** stack stopped or maintenance window; current backup available under `backend/backups/postgres/`.

1. Identify backup file (latest `.sql` file in volume `backend-backups`):

```bash
docker compose -f docker-compose.prod.yml exec backend ls -la /app/backups/postgres/
```

2. **Restore to empty DB** (existing data will be overwritten):

```bash
docker compose -f docker-compose.prod.yml stop backend

docker compose -f docker-compose.prod.yml exec postgres psql -U wm2026 -d wm2026 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

docker compose -f docker-compose.prod.yml exec -T postgres psql -U wm2026 -d wm2026 < /path/to/postgres-YYYY-MM-DD.sql
```

In Portainer: copy SQL file into the `postgres` container, then:

```bash
psql -U wm2026 -d wm2026 -f /tmp/postgres-YYYY-MM-DD.sql
```

3. **Restore uploads** (if needed):

```bash
docker compose -f docker-compose.prod.yml exec backend cp -r /app/backups/uploads/uploads-YYYY-MM-DD/* /app/uploads/
```

4. Restart backend:

```bash
docker compose -f docker-compose.prod.yml start backend
```

5. **Verification:**

```bash
curl https://your-domain.com/api/health
docker compose -f docker-compose.prod.yml exec backend node -e "const {User}=require('./models'); User.count().then(c=>console.log('Users:',c))"
```

### Restore Test (recommended: quarterly)

1. Copy prod backup to staging server
2. Start staging stack with same `docker-compose.prod.yml`
3. Perform restore (see above)
4. Verify login, leaderboard, and sample predictions

---

## Important Production Rules

- **`DB_DIALECT=postgres` is required** — SQLite no longer starts in `NODE_ENV=production`
- **Single backend instance only** — cron jobs and WebSockets are not designed for horizontal scaling
- **`JWT_SECRET` and `DB_PASSWORD`** must be strong, unique values

---

## Local Test Before Deploy

```powershell
docker compose -f docker-compose.prod.yml up --build
docker compose -f docker-compose.prod.yml exec backend node database/seed.js
```

App: http://localhost:8080

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Stack won't start | Are `JWT_SECRET` and `DB_PASSWORD` set? |
| 502 / API error | Check backend logs in Portainer |
| WebSocket / live scores | Nginx proxies `/socket.io/` (see `frontend/nginx.conf`) |
| Profile pictures / uploads | Nginx proxies `/uploads/` to backend (see `frontend/nginx.conf`) |
| Email links wrong | `APP_URL` must be the public HTTPS URL |
| CORS error | `CORS_ORIGIN` = exact frontend URL |
| `{"google":false}` | Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in **stack environment** **and** pass through in `docker-compose.prod.yml` under `backend.environment`; redeploy stack. Check: `printenv \| grep GOOGLE` in backend container |

---

## File Overview

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production: Postgres + backend + frontend |
| `docker-compose.yml` | Local: SQLite or Postgres profile |
| `.env.docker.example` | Environment variable template |
| `backend/Dockerfile` | Backend image |
| `frontend/Dockerfile` | Frontend build + Nginx |
