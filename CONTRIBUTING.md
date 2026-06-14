# Contributing

Thank you for your interest in the WM 2026 Prediction Game. This repository is primarily for internal use; external contributions are welcome by arrangement.

## Development Setup

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run seed && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

| Service  | URL                           |
|----------|-------------------------------|
| Frontend | http://localhost:5173         |
| Backend  | http://localhost:3000         |
| Health   | http://localhost:3000/api/health |

## Branch Strategy

- `main` — stable branch, CI must pass
- Feature branches: `feature/short-description`
- Bug fixes: `fix/short-description`

## Pull Requests

1. Create a branch from `main`
2. Cover changes with tests where appropriate
3. Open a PR using the [PR template](.github/pull_request_template.md)
4. CI (backend + frontend + Postgres smoke) must pass

### PR Checklist

- [ ] `npm test` in `backend/` passes
- [ ] `npm test` in `frontend/` passes
- [ ] No secrets or `.env` files committed
- [ ] README/docs updated if behavior or setup changed
- [ ] Version bumped in `backend/package.json` and `frontend/package.json` for releases

## Code Style

- Follow existing conventions in each folder
- Keep changes minimal and focused — no unnecessary refactoring
- Comments only for non-obvious business logic

## Versioning

- [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- Source of truth: `backend/package.json` → `version`
- Keep `frontend/package.json` in sync
- Update [CHANGELOG.md](CHANGELOG.md)

## Commits

Short, descriptive commit messages in English:

```
fix: WebSocket reconnect on tab switch
feat: CSV export for team ranking
docs: update Portainer deploy guide
```

## Questions

Open a GitHub issue with the `question` label or contact the repository owner directly.
