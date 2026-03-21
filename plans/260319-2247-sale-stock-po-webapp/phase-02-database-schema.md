# Phase 2: Database Schema & Data Layer

**Priority:** P1 | **Status:** Pending | **Effort:** 4h

---

## Overview

Design and implement the full SQLite schema, write all DB utility functions, implement API routes for all entities, and add PIN auth middleware.

## Context Links

- Phase 1: `phase-01-setup-environment.md` — must complete first
- Brainstorm: `../reports/brainstorm-260319-2247-sale-stock-po-webapp.md`

## Key Insights

- SQLite (Turso) is schema-first — no ORM needed, raw SQL via `@libsql/client`
- Keep migrations as SQL files in `scripts/migrations/`
- All dates stored as `YYYY-MM-DD` strings for simplicity
- Months stored as `YYYY-MM` strings (e.g. `2026-04`)
- PIN is a simple bcrypt hash, stored in a single `app_config` table

## Architecture

### Database Schema

```sql
-- App config (PIN, settings)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Products master list
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Exeol surf 30 1L"
  sku TEXT UNIQUE NOT NULL,     -- "EXS0034FR"
  exw_price_eur REAL NOT NULL,  -- 3.906
  packing_per_pallet INTEGER NOT NULL,  -- 288 units/pallet
  created_at TEXT DEFAULT (date('now'))
);

-- Customers (hospitals)
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  region TEXT NOT NULL,         -- "MB" | "MN" | "MN-South"
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);

-- Monthly forecasts: one row per (customer × product × month)
CREATE TABLE forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  month TEXT NOT NULL,          -- "2026-04"
  qty_units INTEGER NOT NULL DEFAULT 0,
  UNIQUE(customer_id, product_id, month)
);

-- Current physical stock with LOT/expiry
CREATE TABLE stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  lot_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,     -- "2027-04-11"
  qty_units INTEGER NOT NULL,
  updated_at TEXT DEFAULT (date('now'))
);

-- Purchase orders (header)
CREATE TABLE purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ordered',  -- ordered|confirmed|in_transit|received
  order_date TEXT NOT NULL,    -- date order placed
  arrival_month TEXT NOT NULL, -- month goods arrive (5mo lead time)
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);

-- PO line items (product × qty)
CREATE TABLE po_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_pallets INTEGER NOT NULL  -- whole pallets only, min 1
);

-- Indexes for common queries
CREATE INDEX idx_forecasts_product_month ON forecasts(product_id, month);
CREATE INDEX idx_forecasts_customer ON forecasts(customer_id);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_po_items_po ON po_items(po_id);
CREATE INDEX idx_po_items_product ON po_items(product_id);
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/verify` | POST | Verify PIN, set session cookie |
| `/api/auth/setup` | POST | Set initial PIN (first-time) |
| `/api/products` | GET/POST | List all products / add product |
| `/api/products/[id]` | GET/PUT/DELETE | Single product CRUD |
| `/api/customers` | GET/POST | List/add customers |
| `/api/forecasts` | GET/POST/PUT | Get or upsert forecasts (bulk) |
| `/api/stock` | GET/POST/PUT | Stock entries |
| `/api/po` | GET/POST | List/create POs |
| `/api/po/[id]` | GET/PUT/DELETE | Single PO |
| `/api/rollforward` | GET | Compute rollforward for all products |

## Implementation Steps

1. **Write migration SQL** — `scripts/migrations/001_initial_schema.sql`
2. **Create `lib/db.ts`** — Turso client singleton with typed helpers
3. **Create `lib/migrations.ts`** — auto-run migrations on app start
4. **Implement PIN auth**
   - On first visit, redirect to setup PIN page
   - Store `pin_hash` in `app_config` table
   - Verify on every API call via middleware cookie check
   - Session: httpOnly cookie `session_pin`, 30-day expiry
5. **Write all API routes** — CRUD for each entity
6. **Add auth middleware** — protect all routes except `/setup` and `/api/auth/verify`
7. **Test all routes** with `curl` or Postman

## Todo List

- [ ] Write `scripts/migrations/001_initial_schema.sql`
- [ ] Create `lib/db.ts` with Turso client + typed query helpers
- [ ] Create `lib/migrations.ts` auto-run on startup
- [ ] Implement `/api/auth/verify` + `/api/auth/setup`
- [ ] Implement `/api/products` CRUD
- [ ] Implement `/api/customers` CRUD
- [ ] Implement `/api/forecasts` CRUD (upsert per customer/product/month)
- [ ] Implement `/api/stock` CRUD
- [ ] Implement `/api/po` + `/api/po/[id]` CRUD
- [ ] Add auth middleware to all `/api/*` routes
- [ ] Test all routes

## Success Criteria

- All 5 entities (products, customers, forecasts, stock, POs) are CRUD-able via API
- PIN setup flow works (first-time → set PIN → redirect to dashboard)
- Unauthorized API calls return 401

## Security Considerations

- PIN bcrypt hash: `bcrypt.hash(pin, 10)` — never store plain text
- Cookie: `httpOnly`, `sameSite: strict`, `secure` in production
- All DB writes parameterized (prevent SQL injection)

## Next Steps

Phase 3 (Core Features) blocked on this phase. Phase 3 builds the UI on top of these APIs.
