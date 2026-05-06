# Project Roadmap

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Current Version:** 1.0.0  
**Status:** ✅ Production Complete  
**Last Updated:** 2026-05-04

---

## Version History

### v1.0.0 — Production Release (2026-03-19)

**Status:** ✅ Complete  
**Deployment:** Vercel (Frankfurt region)  
**Database:** Turso (libSQL)

All core features implemented and deployed to production. System is actively used by sale manager for daily operations.

---

## Development Phases

### Phase 1 — Setup Environment ✅

**Duration:** Week 1  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Next.js 16.2.0 scaffold with App Router
- [x] TypeScript 5.x configuration (strict mode)
- [x] Tailwind CSS 4.x setup with PostCSS
- [x] shadcn/ui components installed (11 primitives)
- [x] Turso SQLite client configured (@libsql/client)
- [x] PIN authentication flow (setup + verify + cookie)
- [x] Project structure established
- [x] Environment variable configuration
- [x] Git repository initialized

**Key Files Created:**
- `tsconfig.json` — TypeScript configuration
- `next.config.ts` — Next.js configuration
- `components.json` — shadcn/ui configuration
- `vercel.json` — Deployment configuration
- `lib/db.ts` — Database client singleton
- `lib/session.ts` — Authentication utilities

---

### Phase 2 — Database & Authentication ✅

**Duration:** Week 2  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Full SQLite schema (7 tables + 10 indexes)
- [x] CRUD API routes for all entities (15 endpoints)
- [x] Auto-migration on app startup (`/api/init`)
- [x] bcrypt PIN hashing with salt rounds
- [x] httpOnly session cookies (30-day expiration)
- [x] PIN reset functionality
- [x] Database seeding script (25 products + 10 customers)

**Database Tables:**
- `app_config` — Key-value store (PIN hash)
- `products` — Product catalog
- `customers` — Hospital customers
- `forecasts` — Monthly demand forecasts
- `stock` — Inventory with lot tracking
- `stock_adjustments` — Audit trail
- `purchase_orders` — PO headers
- `po_items` — PO line items

**API Endpoints:**
- `/api/auth/*` — Authentication (setup, verify, reset)
- `/api/products/*` — Product CRUD + bulk import
- `/api/customers/*` — Customer CRUD + bulk import
- `/api/forecasts` — Forecast query + upsert
- `/api/stock/*` — Stock CRUD + adjustment history
- `/api/po/*` — PO CRUD + receive workflow
- `/api/rollforward` — Rollforward calculation
- `/api/init` — Database migration

---

### Phase 3 — Core Features ✅

**Duration:** Weeks 3-4  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Dashboard with status overview
  - Status cards (OK/Low/Critical/Stockout counts)
  - Open PO value summary
  - 8-month product status table
- [x] Forecast Entry page
  - Editable grid (customer × product × month)
  - Debounced auto-save (500ms)
  - Row/column/grand totals
  - Product and customer filtering
- [x] Stock Rollforward page
  - Color-coded balance grid (🟢🟡🟠🔴)
  - 8-month projection per product
  - Month-by-month breakdown
  - Month selector (±3 months)

**Components Created:**
- `ForecastEntryTable` — Complex editable grid
- `DebouncedCell` — Optimized input cell
- Rollforward display components
- Dashboard status cards

**Business Logic:**
- Rollforward calculation algorithm (server-side)
- Status determination (ok/low/critical/stockout)
- Date arithmetic utilities (addMonths, formatMonth)

---

### Phase 4 — PO Engine ✅

**Duration:** Weeks 5-6  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] PO Suggestion Engine
  - Automated pallet calculation
  - Container optimization (22/44 pallets)
  - Urgency classification (Critical/Warning)
  - One-click PO creation
- [x] PO Management
  - Status tabs (All/Ordered/Confirmed/In Transit/Received)
  - Create/edit/delete PO
  - Line item management
- [x] PO Detail Page
  - Status transitions (Ordered → Confirmed → In Transit → Received)
  - Mark Received workflow
  - Lot/expiry entry per line item
- [x] Auto Stock Creation
  - Stock records created on PO receipt
  - Stock adjustments logged (type: "receipt")

**Components Created:**
- PO suggestion cards
- PO list with status filtering
- PO detail with line items
- Mark Received dialog

**Business Logic:**
- PO suggestion algorithm (client-side)
- Container configuration logic
- Arrival month calculation (order + 5 months)
- Stock creation on receipt

---

### Phase 5 — Stock Control ✅

**Duration:** Week 7  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Stock Control Workspace
  - Stock lot CRUD (product, lot, expiry, quantity)
  - Expiry status indicators (Expired/≤30 days/≤90 days/Healthy)
  - Manual adjustments with reason tracking
  - Real-time metrics (total units, expiring soon, stocked products)
- [x] Stock Adjustment History
  - Audit trail display
  - Change types (create, update, delete, receipt)
  - Timestamp and reason tracking
  - Reference to related entities (PO)

**Components Created:**
- `StockControlWorkspace` — Main stock management
- `StockAdjustmentHistory` — Audit trail display

**Business Logic:**
- Expiry status calculation
- Stock adjustment logging
- Audit trail maintenance

---

### Phase 6 — Master Data Management ✅

**Duration:** Week 8  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Master Data Workspace
  - Tabs for Products and Customers
  - Metrics cards (product count, customer count)
- [x] Products Manager
  - CRUD operations
  - Excel import with flexible column mapping
  - Excel export
  - Search and filter
- [x] Customers Manager
  - CRUD operations
  - Excel import/export
  - Search and filter

**Components Created:**
- `MasterDataWorkspace` — Parent workspace
- `ProductsManager` — Product CRUD + import/export
- `CustomersManager` — Customer CRUD + import/export

**Utilities Created:**
- `master-data-sheet.ts` — Excel import/export utilities
- `export.ts` — Generic Excel export functions
- `export-po.ts` — PO-specific exports

---

### Phase 7 — Polish & Deployment ✅

**Duration:** Week 9  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Excel Export
  - Forecasts export with monthly columns
  - Rollforward export (one sheet per product)
  - PO suggestions export
  - PO list export
- [x] JSON Backup
  - Export all data from Settings page
  - Timestamped filename
  - Complete database snapshot
- [x] Settings Page
  - PIN change functionality
  - Data backup/export
  - App information
- [x] Vercel Deployment
  - `vercel.json` configuration
  - Environment variables setup
  - Frankfurt region deployment
- [x] Documentation
  - Onboarding guide for users
  - Setup guide for developers
  - System architecture documentation
  - Project changelog

**Files Created:**
- `docs/onboarding-guide.md` — User guide
- `docs/system-architecture.md` — Technical architecture
- `docs/project-changelog.md` — Version history
- `docs/project-roadmap.md` — This file

---

## Current Status Summary

### Completed Features (v1.0.0)

**Authentication & Security:**
- ✅ PIN-based authentication (6-digit)
- ✅ bcrypt hashing
- ✅ httpOnly session cookies
- ✅ Session validation on all API routes

**Master Data:**
- ✅ Product catalog management
- ✅ Customer management
- ✅ Excel import/export
- ✅ Search and filtering

**Forecasting:**
- ✅ 8-month rolling forecast
- ✅ Editable grid with auto-save
- ✅ Real-time totals
- ✅ Excel export

**Stock Management:**
- ✅ Lot number tracking
- ✅ Expiry date tracking
- ✅ Stock adjustments with reasons
- ✅ Audit trail (immutable log)
- ✅ Expiry status indicators

**Rollforward:**
- ✅ 8-month stock projection
- ✅ Color-coded status cells
- ✅ Server-side calculation
- ✅ Excel export

**Purchase Orders:**
- ✅ Automated PO suggestions
- ✅ Container optimization (22/44 pallets)
- ✅ PO lifecycle management
- ✅ Mark Received workflow
- ✅ Auto-stock creation on receipt

**Reporting:**
- ✅ Dashboard with status overview
- ✅ Excel exports for all major reports
- ✅ JSON backup for disaster recovery

**Deployment:**
- ✅ Vercel hosting (Frankfurt)
- ✅ Turso database (libSQL)
- ✅ Production-ready configuration

---

## Future Enhancements (Out of Scope for v1.0)

### v2.0 — Multi-User & Notifications (Planned)

**Priority:** Medium  
**Estimated Effort:** 4-6 weeks

**Features:**
- [ ] Multi-user support with user accounts
- [ ] Role-based access control (Admin, Manager, Viewer)
- [ ] Email notifications for stockout alerts
- [ ] SMS notifications for critical stockouts
- [ ] User activity audit log
- [ ] Password-based authentication (replace PIN)

**Technical Requirements:**
- User management system
- Email service integration (SendGrid, Resend)
- SMS service integration (Twilio)
- Role-based middleware
- User session management

---

### v2.1 — Advanced Reporting (Planned)

**Priority:** Medium  
**Estimated Effort:** 2-3 weeks

**Features:**
- [ ] PDF report generation
- [ ] Customizable report templates
- [ ] Scheduled report delivery
- [ ] Historical trend analysis
- [ ] Demand forecasting algorithms (ML-based)

**Technical Requirements:**
- PDF generation library (Puppeteer, jsPDF)
- Report template engine
- Background job queue
- Time-series analysis

---

### v2.2 — Data Import & Migration (Planned)

**Priority:** Low  
**Estimated Effort:** 2 weeks

**Features:**
- [ ] Historical data import from Excel
- [ ] Bulk forecast import
- [ ] Data validation and error reporting
- [ ] Import preview before commit

**Technical Requirements:**
- Enhanced Excel parsing
- Data validation rules
- Transaction support for bulk operations

---

### v3.0 — Extended Planning Horizon (Planned)

**Priority:** Low  
**Estimated Effort:** 1-2 weeks

**Features:**
- [ ] 12-month planning horizon (vs current 8 months)
- [ ] Configurable planning horizon
- [ ] Long-term trend visualization

**Technical Requirements:**
- Database schema updates
- UI adjustments for wider grids
- Performance optimization for larger datasets

---

### v4.0 — Mobile Application (Future)

**Priority:** Low  
**Estimated Effort:** 8-12 weeks

**Features:**
- [ ] React Native mobile app (iOS + Android)
- [ ] Offline mode with sync
- [ ] Barcode scanning for lot numbers
- [ ] Push notifications
- [ ] Mobile-optimized UI

**Technical Requirements:**
- React Native setup
- Offline storage (SQLite)
- Sync mechanism
- Camera integration
- Push notification service

---

### v5.0 — Supplier Management (Future)

**Priority:** Low  
**Estimated Effort:** 4-6 weeks

**Features:**
- [ ] Supplier database
- [ ] Lead time tracking per supplier
- [ ] Supplier performance metrics
- [ ] Multi-supplier support per product
- [ ] Supplier communication log

**Technical Requirements:**
- New database tables (suppliers, supplier_products)
- Supplier management UI
- Lead time configuration

---

---

### Maintenance Sprint — Documentation & Test Foundation ✅

**Date:** 2026-05-05  
**Status:** Complete  
**Completion:** 100%

**Deliverables:**
- [x] Archived completed/obsolete plan directories
- [x] Added safe `.env.local.example` template
- [x] Added API reference for current production routes
- [x] Added Vitest + React Testing Library setup
- [x] Added Playwright E2E setup and CI workflow
- [x] Added 43 unit tests
- [x] Added 9 E2E tests
- [x] Added testing strategy and contributing docs
- [x] Updated README documentation links

**Validation:**
- `npm run test -- --run` ✅
- `npm run test:coverage -- --run` ✅
- `npm run test:e2e` ✅
- `npx tsc --noEmit --pretty false` ✅

## Technical Debt & Improvements

### High Priority

- [x] Add automated tests (unit and E2E foundation) — completed 2026-05-05
- [ ] Add API integration tests with isolated DB setup
- [ ] Implement error boundaries for component errors
- [ ] Add error monitoring (Sentry)
- [x] Create `.env.local.example` file — completed 2026-05-05
- [x] Add API endpoint documentation — completed 2026-05-05

### Medium Priority

- [ ] Implement caching layer for frequently accessed data
- [ ] Add transaction support for multi-step operations
- [ ] Optimize rollforward calculation for large datasets
- [ ] Add date range filters to stock adjustment history
- [ ] Implement theme toggle (dark mode)

### Low Priority

- [ ] Extract CRUD patterns into reusable hooks
- [ ] Add Storybook for component documentation
- [ ] Implement code splitting by route
- [ ] Add loading states for all async operations
- [ ] Standardize empty state designs

---

## Success Metrics

### v1.0 Goals (Achieved)

- ✅ Replace Excel-based workflow
- ✅ Reduce forecast entry time by 50%
- ✅ Provide real-time stock projections
- ✅ Automate PO suggestions
- ✅ Maintain complete audit trail
- ✅ Deploy to production

### v2.0 Goals (Planned)

- [ ] Support 3+ concurrent users
- [ ] Reduce stockouts by 30% (via email alerts)
- [ ] Generate 100+ automated reports per month
- [ ] Achieve 99.5% uptime

---

## Risk Assessment

### Current Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| User forgets PIN | High | Medium | Developer-assisted reset process |
| Data loss (no backup) | High | Low | Weekly JSON export reminder |
| Vercel cold starts | Medium | High | Accept as free tier limitation |
| Turso free tier limits | Low | Low | Monitor usage, upgrade if needed |

### Future Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scaling beyond free tier | Medium | Medium | Plan for paid tier upgrade |
| Multi-user concurrency issues | High | Medium | Implement proper locking mechanisms |
| Data migration complexity | Medium | Low | Test migration scripts thoroughly |

---

## Dependencies & Blockers

### Current Blockers

None — v1.0 is complete and deployed.

### Future Blockers

**For v2.0 (Multi-User):**
- Need email service account (SendGrid, Resend)
- Need SMS service account (Twilio)
- Requires user authentication redesign

**For v4.0 (Mobile App):**
- Need React Native expertise
- Need iOS Developer account ($99/year)
- Need Google Play Developer account ($25 one-time)

---

## Timeline

```
2026-01 to 2026-03: v1.0 Development (9 weeks)
2026-03-19: v1.0 Production Release ✅
2026-04 to 2026-05: v1.0 Stabilization, documentation, and test foundation ✅
2026-06 to 2026-08: v2.0 Development (Multi-User) [Planned]
2026-09: v2.0 Release [Planned]
2026-10 to 2026-11: v2.1 Development (Reporting) [Planned]
2026-12: v2.1 Release [Planned]
```

---

**Document Owner:** Development Team  
**Review Cycle:** Monthly during active development, quarterly during maintenance
