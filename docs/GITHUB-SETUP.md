# GitHub Repository Setup

Manual steps in the GitHub web UI that cannot be set via repository files.

## About Section (Settings → General)

Edit **About** on the repository homepage:

| Field | Value |
|-------|-------|
| **Description** | WM 2026 Prediction Game — Vue 3 + Node.js PWA for company teams with live scores, bonus questions, AI coach & admin |
| **Website** | *(enter live URL if available)* |
| **Topics** | `vue3`, `nodejs`, `football`, `world-cup-2026`, `pwa`, `docker`, `prediction-game`, `express`, `websocket` |

### Social Preview Image

1. Create an image **1280×640 px** (logo + app name + tagline)
2. **Settings → General → Social preview** → Upload
3. Template: see [docs/images/README.md](images/README.md)

## First GitHub Release

After pushing these changes:

1. **Releases → Draft a new release**
2. **Choose a tag:** `v1.0.5` (create new, target: `main`)
3. **Release title:** `v1.0.5 — Professional GitHub documentation`
4. **Description:** use the template below
5. **Publish release**

The `docker-publish.yml` workflow automatically builds images with the release tag on `release: published`.

### Release Notes Template (v1.0.5)

```markdown
## WM 2026 Prediction Game v1.0.5

### Highlights

- Professional README with badges, screenshots, and architecture overview
- Complete GitHub documentation (LICENSE, SECURITY, CONTRIBUTING, CHANGELOG)
- Issue and PR templates, Dependabot for npm and GitHub Actions
- All repository documentation in English

### Docker Images (GHCR)

| Image | Tag |
|-------|-----|
| Backend | `ghcr.io/schmeckm/wm2026_prediction-backend:1.0.5` |
| Frontend | `ghcr.io/schmeckm/wm2026_prediction-frontend:1.0.5` |

### Deployment

See [docs/DEPLOY-GITHUB-PORTAINER.md](docs/DEPLOY-GITHUB-PORTAINER.md).

### Full Changelog

[CHANGELOG.md](CHANGELOG.md)
```

## Labels (optional)

Create recommended labels under **Issues → Labels**:

| Label | Color | Purpose |
|-------|-------|---------|
| `bug` | red | Bugs |
| `enhancement` | blue | Feature requests |
| `dependencies` | gray | Dependabot PRs |
| `documentation` | green | Documentation changes |
| `question` | yellow | Questions |

## Branch Protection (optional)

**Settings → Branches → Add rule** for `main`:

- Require a pull request before merging
- Require status checks: `test-sqlite`, `test-frontend`, `test-postgres`
- Do not allow bypassing the above settings

## Repository Visibility

This project is intended as an internal company tool. For a **private** repository:

- About description and topics still help with internal discoverability
- SECURITY.md points to confidential reporting channels
