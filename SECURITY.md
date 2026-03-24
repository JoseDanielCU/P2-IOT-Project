# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by creating a confidential issue or contacting the maintainers directly.

## Known Vulnerabilities

### Frontend Dependencies (as of March 4, 2026)

✅ **All critical and high severity vulnerabilities have been resolved!**

**Latest Update**: All dependencies updated to secure versions on March 4, 2026
- **Next.js**: Updated to 16.1.6 (no known vulnerabilities)
- **React**: 18.3.1 (stable, no vulnerabilities)

**Note**: Next.js 16 removed ESLint integration. This project uses **Prettier** for code formatting and **npm audit** for security scanning. Code quality is enforced through CI/CD workflows and build-time checks.

### Backend Dependencies

No critical vulnerabilities detected as of March 4, 2026.

### Backend Configuration (as of March 24, 2026)

✅ **Security configuration hardening applied.**

- **SECRET_KEY**: Now read from environment variable via `os.getenv()` — no longer hardcoded.
- **CORS_ORIGINS**: Fixed wildcard `*` with `credentials=True` (violates CORS spec and OWASP A05 — Security Misconfiguration). Origins are now loaded from the `CORS_ORIGINS` environment variable.
- **DATABASE_URL**: Default fallback uses generic credentials only for local development.

## Security Scanning

This project uses automated security scanning:

- **Backend**: Bandit (code analysis) + pip-audit (dependencies)
- **Frontend**: npm audit (dependencies)
- **Schedule**: Weekly scans run every Monday at 9 AM UTC via GitHub Actions

See [.github/workflows/backend-security.yml](.github/workflows/backend-security.yml) and [.github/workflows/frontend-security.yml](.github/workflows/frontend-security.yml) for details.

## Development Guidelines

- Run security scans before pushing code:
  - Backend: `bandit -r app/` and `pip-audit`
  - Frontend: `npm audit`
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Keep dependencies updated regularly
- Review dependency updates for breaking changes before applying

## Dependency Updates

1. Create a feature branch: `git checkout -b fix/update-dependencies`
2. Update dependencies with testing
3. Run full test suite to verify compatibility
4. Create Pull Request with detailed testing notes
5. Require review before merging
