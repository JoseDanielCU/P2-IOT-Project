# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by creating a confidential issue or contacting the maintainers directly.

## Known Vulnerabilities

### Frontend Dependencies (as of March 4, 2026)

#### Critical
- **Next.js (0.9.9 - 15.5.9)** - Multiple vulnerabilities:
  - Cache Poisoning
  - Denial of Service (DoS) in image optimization
  - Authorization bypass
  - SSRF in middleware redirect handling
  - Information exposure in dev server
  - **Mitigation**: Update to Next.js 14.2.35+ requires breaking changes - tracked in Issue #[TBD]

#### High
- **glob (10.2.0 - 10.4.5)** - Command injection via -c/--cmd
  - **Mitigation**: Update eslint-config-next to 16.1.6 (breaking change) - tracked in Issue #[TBD]

- **minimatch (9.0.0 - 9.0.6)** - Multiple ReDoS vulnerabilities
  - **Mitigation**: Transitive dependency of @typescript-eslint - requires upstream update

### Backend Dependencies

No critical vulnerabilities detected as of March 4, 2026.

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
