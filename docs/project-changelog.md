# Project Changelog — Sale-Stock-PO

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
