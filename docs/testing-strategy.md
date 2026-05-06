# Testing Strategy

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-05

---

## Overview

ICT-PO uses two test layers:

- **Unit tests:** Vitest + React Testing Library for utilities, business logic, and isolated UI primitives.
- **E2E tests:** Playwright for protected user flows, navigation, and master-data CRUD.

Current setup lives inside `sale-stock-po-app/`.

---

## Commands

```bash
cd sale-stock-po-app

npm run test              # Unit tests
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright E2E
npm run test:e2e:ui       # Playwright UI
npm run test:e2e:debug    # Playwright debugger
```

---

## Unit Tests

**Location:** `sale-stock-po-app/__tests__/`  
**Config:** `sale-stock-po-app/vitest.config.ts`  
**Setup:** `sale-stock-po-app/vitest.setup.ts`

Covered areas:

- `lib/calculations.ts`: stock status, month arithmetic, PO suggestion rules.
- `lib/utils.ts`: Tailwind class merging.
- `lib/session.ts`: session cookie validation behavior.
- `components/ui/button.tsx`: accessible rendering, variants, disabled/click behavior.

Guidelines:

- Test public behavior, not implementation details.
- Mock database and framework boundaries in unit tests.
- Keep tests deterministic and fast.
- Add tests for business rules before changing calculations.

---

## E2E Tests

**Location:** `sale-stock-po-app/e2e/`  
**Config:** `sale-stock-po-app/playwright.config.ts`

Covered flows:

- Auth redirects, setup validation, login/logout, wrong PIN handling.
- Dashboard protected rendering and primary navigation.
- Master data product/customer create, edit, validation, delete, import/export controls.

E2E constraints:

- Tests run serially because current app uses one SQLite-backed dev database.
- Test data uses timestamped names/SKUs.
- Cleanup is best-effort; unique test data keeps runs isolated if cleanup fails.
- Full DB reset endpoint does not exist. Do not add one unless guarded for test-only environments.

---

## Coverage

Configured thresholds:

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

Coverage currently targets tested source files only. E2E specs, config files, generated reports, and generated app output are excluded.

---

## CI

Workflow: `.github/workflows/test.yml`

Jobs:

- **Unit:** `npm test -- --run`
- **E2E:** install Chromium, then `npm run test:e2e -- --pass-with-no-tests`

CI uses Node.js 22 and npm cache from `sale-stock-po-app/package-lock.json`.

---

## Troubleshooting

- **Vitest collects Playwright specs:** ensure `e2e/**` is excluded in `vitest.config.ts`.
- **Playwright hangs on CRUD:** check app DB lock/contention; E2E is serial by design.
- **Auth tests skip:** existing app PIN differs from `E2E_TEST_PIN` and no reset endpoint exists.
- **Generated artifacts:** coverage output, Playwright reports, and test results are local artifacts.

---

## Future Work

- Add API route integration tests with isolated DB setup.
- Add stable test database reset strategy.
- Add accessibility checks for critical pages.
- Expand unit coverage for import/export utilities.

## Unresolved Questions

- Should the project add a test-only DB reset route guarded by `NODE_ENV === "test"`?
