# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

This project is intended for internal use. Please **do not** report security issues publicly as GitHub issues.

Instead:

1. Contact the repository owner via GitHub Private Security Advisory or direct contact
2. Include: affected component, steps to reproduce, potential impact
3. Do not publish public exploits or proof-of-concept code before a fix is available

## Security Measures

- JWT-based authentication with configurable secret
- bcrypt for password hashing
- Optional TOTP two-factor authentication
- Helmet, CORS, rate limiting in the backend
- No direct Football API calls from the frontend
- Secrets only via environment variables (`.env`, never in the repository)

## Production Recommendations

- Use strong, unique values for `JWT_SECRET` and `DB_PASSWORD`
- HTTPS via reverse proxy
- Keep npm dependencies up to date (Dependabot)
- Do not leave demo accounts (`admin@example.com`) in production
