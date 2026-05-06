# Project Changelog — Sale-Stock-PO

## v1.0.0-maintenance — 2026-05-05

### Added
- API reference documentation for 15 current Next.js route files.
- Vitest + React Testing Library test infrastructure.
- Playwright E2E infrastructure and GitHub Actions test workflow.
- Unit tests for calculations, utilities, session helpers, and Button UI primitive.
- E2E tests for auth, dashboard navigation, and master-data CRUD flows.
- Testing strategy and contributing guide.
- Safe `.env.local.example` template.

### Changed
- Archived completed/obsolete app plan directories under `sale-stock-po-app/plans/archive/`.
- Updated README documentation and testing links.
- Normalized `next.config.ts` to a single typed config export.
- Excluded Playwright specs from Vitest collection and ran Playwright serially for SQLite-backed dev tests.

### Validation
- `npm run test -- --run` passed: 43 tests.
- `npm run test:coverage -- --run` passed.
- `npm run test:e2e` passed: 9 tests.
- `npx tsc --noEmit --pretty false` passed.

## v1.0.0 — 2026-03-19

### Added
- **Full app scaffold**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database layer**: SQLite via `@libsql/client` (Turso), 6 tables, auto-migration
- **PIN authentication**: bcrypt hashing, httpOnly cookie, 30-day session, setup + verify + reset flows
- **Dashboard**: 4 status cards (OK/Low/Critical/Stockout), 8-month product sparkline table, open PO value
- **Forecast Entry**: editable grid (customer × product × month), debounced 500ms auto-save, row/col/grand totals, product/customer filters
- **Stock Rollforward**: 8-month balance grid per product, color-coded cells, incoming PO + forecast breakdown, month selector (±3)
- **PO Suggestion Engine**: auto-calculates pallets needed, container config (22/44), PO value estimate, critical/warning urgency sorting
- **PO Management**: full lifecycle (ordered → confirmed → in_transit → received), tabbed list, PO detail with line items
- **Mark Received**: dialog for lot/expiry entry per line item, auto-creates stock records
- **Excel Export**: client-side via `xlsx` — forecasts, rollforward, PO suggestions, PO list
- **JSON Backup**: Settings → Export All Data downloads full database snapshot
- **Settings page**: PIN change, data backup, app info
- **Onboarding guide**: `docs/onboarding-guide.md`
- **Vercel config**: `vercel.json` with Node 22 runtime, Cache-Control headers
- **Seed script**: 25 Exeol products + 10 hospital customers
