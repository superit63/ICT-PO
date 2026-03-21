# Phase 3: Core Features — Dashboard, Forecast Entry, Stock Rollforward

**Priority:** P1 | **Status:** Pending | **Effort:** 16h

---

## Overview

Build the 3 main screens: Dashboard overview, Forecast entry grid, and Stock rollforward timeline. These form the core daily workflow of the app.

## Context Links

- Phase 2: `phase-02-database-schema.md` — must complete first
- `lib/calculations.ts` — shared pallet math + rollforward logic

## Key Insights

- Dashboard = aggregation of rollforward data, grouped by status
- Forecast grid: editable cells, auto-save on blur (debounced 500ms)
- Rollforward: per-product rows × per-month columns, color-coded cells
- Use TanStack Table (already via shadcn) for all tabular views
- Planning horizon = current month + 7 months ahead = 8 columns

## Architecture

### Shared Calculation Logic (`lib/calculations.ts`)

```typescript
// Core types
type Month = string;       // "2026-04"
type Units = number;
type Pallets = number;

// Rollforward entry per product per month
interface RollforwardEntry {
  month: Month;
  currentStock: Units;       // from stock table
  incomingPOUnits: Units;    // sum of po_items arriving this month
  forecastUnits: Units;       // sum of forecasts for this month
  balance: Units;             // currentStock + incomingPOs - forecast
  status: 'ok' | 'low' | 'critical' | 'stockout';
}

interface RollforwardResult {
  productId: number;
  productName: string;
  packingPerPallet: number;
  exwPriceEur: number;
  entries: RollforwardEntry[];
}

// Stock status thresholds
function getStatus(balance: Units, packing: number): StockStatus {
  if (balance < 0) return 'stockout';
  if (balance < packing * 1) return 'critical';    // < 1 pallet worth
  if (balance < packing * 3) return 'low';          // < 3 pallets worth
  return 'ok';
}

// Dashboard aggregation
interface DashboardRow {
  productId: number;
  productName: string;
  packingPerPallet: number;
  currentStock: Units;
  status8Months: StockStatus;  // worst status in 8-month window
  criticalMonths: Month[];      // months where balance < 0
  lowestBalance: Units;
}
```

### Screen 1: Dashboard (`app/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  🔐 PIN verified          Sale-Stock-PO        [Logout]  │
├──────────────────────────────────────────────────────────┤
│  📊 Dashboard                        Planning: Apr 2026  │
├──────────────────────────────────────────────────────────┤
│  [🔴 Critical: 3]  [🟡 Low: 5]  [🟢 OK: 12]  [📦 2 POs] │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔴 Critical Products                                 │ │
│  │ Exeol OPA 5L      Stockout: Aug 26  ←3 pallets short│ │
│  │ Exeol GTA 2% 5L  Low: Jul-Aug 26                   │ │
│  │ Exeol surf 30 1L  Low: Sep 26                       │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🟡 Products to Watch                                │ │
│  │ ...                                                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  [+ New Forecast]  [+ Add Stock]  [+ Create PO]        │
└──────────────────────────────────────────────────────────┘
```

### Screen 2: Forecast Entry (`app/forecasts/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  📋 Forecast Entry                    Apr 2026 – Nov 2026 │
├──────────────────────────────────────────────────────────┤
│  Filter: [All Products ▼] [All Customers ▼]             │
│  ┌────────────┬─────────────┬──────┬──────┬─────┬───┐ │
│  │ Customer   │ Product     │Apr 26│May 26│Jun..│ T │ │
│  ├────────────┼─────────────┼──────┼──────┼─────┼───┤ │
│  │ BV An Binh │ Exeol OPA 5L│ 100  │  50  │  50 │200│ │
│  │ BV An Binh │Exeol surf..│   0  │ 100  │   0 │100│ │
│  │ BV Cho Ray │ Exeol OPA 5L│  50  │   0  │  50 │100│ │
│  │ BV Cho Ray │Exeol clean..│  30  │  30  │  30 │ 90│ │
│  ├────────────┼─────────────┼──────┼──────┼─────┼───┤ │
│  │ TOTAL      │             │ 180  │ 180  │ 130 │390│ │
│  └────────────┴─────────────┴──────┴──────┴─────┴───┘ │
│  [Save All]  Auto-saves on cell blur                   │
└──────────────────────────────────────────────────────────┘
```

### Screen 3: Stock Rollforward (`app/rollforward/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  📈 Stock Rollforward                    Apr 2026 – Nov 26│
├──────────────────────────────────────────────────────────┤
│  [Exeol OPA 5L ▼]  Pallet: 96 units  EXW: €15.21      │
│  ┌────────────────────────────────────────────────────┐  │
│  │         │ Apr 26│ May 26│ Jun 26│ Jul 26│ Aug 26..│  │
│  │ Stock   │  384  │   -   │   -   │   -   │   -    │  │
│  │ + InPO  │    0  │ 1632  │ 1536  │   96  │ 2112   │  │
│  │ - Fcast │  147  │  147  │  147  │  147  │  147   │  │
│  │ ═══════ │═══════│═══════│═══════│═══════│═══════ │  │
│  │ Balance │  237  │ 1722  │ 3111  │ 3060  │  5025  │  │
│  │ Status  │  🟢   │   🟢  │   🟢  │   🟢  │   🟢  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ⚠️ Exeol surf 30 1L — STOCKOUT in month: Sep 26       │
│     Balance: -36 units. Need 3 pallets now.            │
└──────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 3.1 — Dashboard

1. Create `lib/calculations.ts` with shared rollforward engine
2. Create `app/api/rollforward/route.ts` — compute rollforward for all products
3. Create `app/page.tsx` — Dashboard with status summary cards
4. Add product selector to switch between products in rollforward
5. Add "critical months" list — click to jump to that product

### Step 3.2 — Forecast Entry

1. Create `app/forecasts/page.tsx` with TanStack Table
2. Implement filter bar: product dropdown + customer dropdown
3. Build editable grid: each cell = `<input>` with qty_units
4. Auto-save: `onBlur` → debounced 500ms → PUT `/api/forecasts`
5. Row totals: sum per product per month
6. Column totals: sum per customer
7. "Add Customer" inline button — create customer without leaving page

### Step 3.3 — Stock Rollforward

1. Create `app/rollforward/page.tsx`
2. Product selector at top (dropdown)
3. 8-column table: Stock | +InPO | -Forecast | =Balance | Status per month
4. Fetch: current stock + all forecasts + all incoming POs
5. Compute: `lib/rollforwardEngine()` → `RollforwardResult[]`
6. Color-code status cells: green/red/yellow background
7. Highlight row where balance < 0 (stockout)

### Step 3.4 — Navigation + Layout

1. Build shared `app/components/layout/nav.tsx` — top nav bar
2. Add sidebar or tab bar for screen switching
3. Add "current planning month" selector — defines "this month" anchor
4. Apply consistent padding, fonts, card styles

## Todo List

- [ ] Create `lib/calculations.ts` — rollforward engine + pallet math
- [ ] Build `/api/rollforward` — compute balance for all products
- [ ] Build Dashboard (`app/page.tsx`) — status cards + critical products list
- [ ] Build Forecast Entry (`app/forecasts/page.tsx`) — editable grid
- [ ] Build Stock Rollforward (`app/rollforward/page.tsx`) — per-product timeline
- [ ] Add shared nav + layout with screen navigation
- [ ] Add "planning month" selector
- [ ] Test all 3 screens end-to-end

## Success Criteria

- Dashboard shows correct counts matching DB data
- Forecast grid saves qty correctly and shows totals
- Rollforward table shows accurate balance per month per product
- Color coding matches balance thresholds (green/yellow/red)
- Stockout rows clearly highlighted

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Rollforward calculation is slow with many forecasts | Medium | Index on (product_id, month), cache result for 5 min |
| Editable grid feels sluggish | Low | Use optimistic UI update, debounce saves |
| Planning month confusion | Medium | Always show month label clearly in nav + page headers |

## Next Steps

Phase 4 blocked on Phase 3. Phase 4 adds PO suggestion + management on top of rollforward data.
