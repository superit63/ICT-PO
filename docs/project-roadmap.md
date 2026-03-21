# Project Roadmap — Sale-Stock-PO

## Status: ✅ COMPLETE (v1.0.0)

---

## Phase 1 — Setup Environment ✅
- Next.js 14 scaffold + TypeScript + Tailwind
- shadcn/ui components installed (12 components)
- Turso SQLite client configured
- PIN auth (setup + verify + cookie)
- Project structure + env config

## Phase 2 — Database & Auth ✅
- Full SQLite schema (6 tables + indexes)
- CRUD API routes for all entities
- Auto-migration on app startup
- bcrypt PIN hashing, httpOnly cookie

## Phase 3 — Core Features ✅
- Dashboard: status cards + 8-month product table
- Forecast Entry: editable grid, debounced save, row/col totals
- Rollforward: color-coded balance grid, month selector

## Phase 4 — PO Engine ✅
- PO Suggestion: critical/warning sections, auto pallet calc
- PO Management: status tabs, create/edit/delete
- PO Detail: status transitions, Mark Received flow
- Auto stock creation on PO receipt

## Phase 5 — Polish ✅
- Excel export for forecasts, rollforward, PO
- JSON backup/restore in Settings
- Vercel deployment config (vercel.json)
- Onboarding guide (docs/onboarding-guide.md)

---

## Future Enhancements (Out of Scope)
- Email/SMS stockout alerts
- PDF report generation
- Multi-user / role-based access
- Historical data import from Excel
- 12-month planning horizon
- Mobile app (React Native)
- Supplier management
- Barcode/lot number scanning
