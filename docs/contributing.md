# Contributing Guide

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-05

---

## Setup

```bash
cd sale-stock-po-app
npm install
cp ../.env.local.example .env.local
npm run dev
```

Required runtime:

- Node.js 22.x
- npm
- Turso credentials for hosted DB, or no env vars for local SQLite fallback

---

## Development Workflow

1. Read `README.md` and relevant docs in `docs/`.
2. Keep changes focused and small.
3. Follow existing Next.js App Router and component patterns.
4. Add or update tests for behavior changes.
5. Run validation before handoff.

Recommended validation:

```bash
cd sale-stock-po-app
npm run test -- --run
npm run test:coverage -- --run
npm run test:e2e
npx tsc --noEmit --pretty false
npm run lint
```

---

## Code Standards

Primary reference: `docs/code-standards.md`.

Key rules:

- Use TypeScript strict patterns; avoid `any`.
- Use parameterized SQL only.
- Check session auth in protected API routes.
- Keep UI accessible via labels, roles, and keyboard-friendly controls.
- Follow existing file naming: Next.js convention files, PascalCase components, kebab-case utilities.

---

## Testing Requirements

New work should include:

- Unit tests for business logic and utilities.
- E2E tests for critical user flows.
- Regression tests for bug fixes.
- No production data in tests.

Do not skip failing tests to pass CI. Fix root cause or document blocker.

---

## Documentation Updates

Update docs when behavior changes:

- API changes → `docs/api-reference.md`
- Testing changes → `docs/testing-strategy.md`
- Architecture changes → `docs/system-architecture.md`
- Roadmap/progress changes → `docs/project-roadmap.md`
- User workflows → `docs/onboarding-guide.md`

---

## Commit Guidelines

Use conventional commits:

- `feat:` new behavior
- `fix:` bug fix
- `refactor:` internal restructuring
- `test:` tests only
- `docs:` documentation only
- `chore:` tooling or maintenance

Keep commits focused. Never commit real `.env` files, DB credentials, API tokens, or generated reports.

---

## Pull Request Checklist

- [ ] Tests pass locally.
- [ ] TypeScript passes.
- [ ] Lint issues reviewed.
- [ ] Docs updated when needed.
- [ ] No secrets or local DB files included.
- [ ] Screenshots included for UI changes.

## Unresolved Questions

- Should this repo enforce PR checks before merge, or keep validation manual for internal use?
