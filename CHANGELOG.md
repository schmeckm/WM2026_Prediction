# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.6] - 2026-06-15

### Added

- Admin **User feedback** page (`/admin/feedback`) with **OK → GitHub Issue** workflow
- YouTube highlight search and optional auto-fill (`YOUTUBE_API_KEY`, `AUTO_HIGHLIGHTS_*`)
- Admin online presence panel
- Redis in production stack (rate limits, presence)

### Changed

- README redesigned with MIT license, match-data provider section, and cleaner structure
- License changed from proprietary to **MIT**
- Deploy guide updated with mandatory/recommended env vars for Portainer
- Rate limiting: per-user keys, isolated Redis counters per limiter
- Knockout leaderboard only active after knockout phase starts

## [1.0.5] - 2026-06-14

### Added

- Professional GitHub documentation (README header, badges, screenshots)
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`
- GitHub issue and PR templates, Dependabot configuration
- Deployment and release documentation under `docs/`

### Changed

- Renamed GitHub repository from `aspire-make-tippspiel` to `WM2026_Prediction`
- Updated Docker image names to `ghcr.io/schmeckm/wm2026_prediction-*`
- Updated deploy guide to repository `WM2026_Prediction`
- All repository documentation translated to English

## [1.0.4] - 2026

### Added

- Frontend improvements and PWA icons
- Extended admin and player views

## [1.0.1] - 2026

### Added

- Initial stable release of the WM 2026 prediction game
- Vue 3 frontend with PWA, i18n (DE/EN/FR/ES)
- Node.js backend with REST API, WebSocket, cron jobs
- Admin panel, AI features, Football API sync
- Docker Compose for development and production
- CI/CD with GitHub Actions

[1.0.6]: https://github.com/schmeckm/WM2026_Prediction/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/schmeckm/WM2026_Prediction/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/schmeckm/WM2026_Prediction/compare/v1.0.1...v1.0.4
[1.0.1]: https://github.com/schmeckm/WM2026_Prediction/releases/tag/v1.0.1
