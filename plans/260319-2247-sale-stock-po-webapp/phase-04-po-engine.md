# Phase 4: PO Suggestion Engine + PO Management

**Priority:** P1 | **Status:** Pending | **Effort:** 10h

---

## Overview

Build the PO Suggestion engine (auto-calculate pallets needed) and the PO Management screens (create, edit, track status).

## Context Links

- Phase 3: `phase-03-core-features.md` — must complete first
- `lib/calculations.ts` — add PO suggestion logic

## Key Insights

- PO suggestion = for each product where rollforward balance < 0, calculate `ceil(shortfall / packing_per_pallet)` pallets
- Container must be 22 or 44 pallets. If needed > 44, suggest multiple POs.
- Order this month → arrives 5 months later. The "arrival month" is always `current_month + 5`
- PO value = `pallets × packing × exw_price` in EUR
- PO status: `ordered → confirmed → in_transit → received`

## Architecture

### PO Suggestion Engine (`lib/calculations.ts`)

```typescript
interface POSuggestion {
  productId: number;
  productName: string;
  packingPerPallet: number;
  exwPriceEur: number;
  firstStockoutMonth: Month;        // earliest month balance goes negative
  shortfallUnits: Units;            // units short at that month
  palletsNeeded: Pallets;           // ceil(shortfallUnits / packing)
  containerConfig: 22 | 44 | 'mixed';
  poValueEur: number;               // palletsNeeded * packing * exwPrice
  urgency: 'critical' | 'warning';
}

function suggestPO(
  rollforward: RollforwardResult,
  currentMonth: Month
): POSuggestion | null {
  const firstDeficit = rollforward.entries.find(e => e.balance < 0);
  if (!firstDeficit) return null;

  const shortfallUnits = Math.abs(firstDeficit.balance);
  const palletsNeeded = Math.ceil(shortfallUnits / rollforward.packingPerPallet);

  // Determine container size
  let containerConfig: 22 | 44 | 'mixed' = 22;
  if (palletsNeeded > 44) containerConfig = 'mixed';
  else if (palletsNeeded > 22) containerConfig = 44;

  const poValueEur = palletsNeeded * rollforward.packingPerPallet * rollforward.exwPriceEur;
  const urgency = firstDeficit.month <= currentMonth + 2 ? 'critical' : 'warning';

  return {
    productId: rollforward.productId,
    productName: rollforward.productName,
    packingPerPallet: rollforward.packingPerPallet,
    exwPriceEur: rollforward.exwPriceEur,
    firstStockoutMonth: firstDeficit.month,
    shortfallUnits,
    palletsNeeded,
    containerConfig,
    poValueEur,
    urgency
  };
}
```

### Screen 4: PO Suggestion (`app/po-suggest/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  🔧 PO Suggestion Engine                Planning: Apr 26 │
├──────────────────────────────────────────────────────────┤
│  📦 PO Needed Now (order → arrives Sep 26)              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔴 Exeol OPA 5L         STOCKOUT Aug 26           │  │
│  │    Shortfall: 1,512 units                          │  │
│  │    Need: 16 pallets (16 × 96 = 1,536 units)        │  │
│  │    → 1 × 22-pallet container                        │  │
│  │    Value: €2,234.00                                 │  │
│  │    [Create PO →]                                    │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 🔴 Exeol GTA 2% 5L        Low: Jul 26             │  │
│  │    Shortfall: 480 units                             │  │
│  │    Need: 5 pallets                                  │  │
│  │    → 1 × 22-pallet container                        │  │
│  │    [Create PO →]                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  🟡 No issues — stock sufficient for 8 months           │
└──────────────────────────────────────────────────────────┘
```

### Screen 5: PO Management (`app/po/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  📦 Purchase Orders                                    │
├──────────────────────────────────────────────────────────┤
│  [+ New PO]  Filter: [All Status ▼]                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ PO-2026-001  Exeol OPA 5L (16 pallets)            │  │
│  │ Ordered: Apr 26 → Arrives: Sep 26  [ordered] 🟡   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ PO-2026-002  Exeol surf 30 1L (22 pallets)        │  │
│  │ Ordered: Apr 26 → Arrives: Sep 26  [confirmed] 🟢 │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ PO-2026-003  Exeol GTA 2% 5L (5 pallets)          │  │
│  │ Ordered: Apr 26 → Arrives: Sep 26  [in_transit] 🔵 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 4.1 — PO Suggestion Engine

1. Add `suggestPO()` to `lib/calculations.ts`
2. Create `app/api/po-suggest/route.ts` — returns `POSuggestion[]`
3. Build `app/po-suggest/page.tsx` — list of suggestions
4. Each suggestion card: show shortfall, pallets, container, value
5. "Create PO" button → pre-fills PO creation form

### Step 4.2 — PO Creation Form

1. Create `app/po/new/page.tsx`
2. Form fields: PO number (auto-generated), product (dropdown), qty pallets (number, min 1), order date, arrival month (auto: current + 5)
3. Show PO value preview: `pallets × packing × exw_price`
4. Container check: warn if qty ≠ 22 or 44 (but allow any number with confirmation)
5. Submit → POST `/api/po` → redirect to PO list

### Step 4.3 — PO Management List

1. Create `app/po/page.tsx` — table of all POs
2. Status badge per PO with color coding
3. Filter by status
4. Click row → PO detail/edit page

### Step 4.4 — PO Detail/Edit

1. Create `app/po/[id]/page.tsx`
2. Show: PO header (number, dates, status) + line items
3. Status update buttons: ordered → confirmed → in_transit → received
4. Edit qty pallets inline
5. Delete PO (with confirmation dialog)
6. When PO received → auto-update stock table

## Todo List

- [ ] Add `suggestPO()` to `lib/calculations.ts`
- [ ] Create `/api/po-suggest` endpoint
- [ ] Build PO Suggestion screen (`app/po-suggest/page.tsx`)
- [ ] Build PO Creation form (`app/po/new/page.tsx`)
- [ ] Build PO Management list (`app/po/page.tsx`)
- [ ] Build PO Detail/Edit page (`app/po/[id]/page.tsx`)
- [ ] Status transition logic (ordered → confirmed → in_transit → received)
- [ ] "Receive PO" → auto-adds units to stock table
- [ ] Container 22/44 validation with warning

## Success Criteria

- PO suggestions match manual calculation from rollforward
- Can create PO and it appears in PO list immediately
- Status transitions work and reflect in rollforward
- "Receive PO" correctly adds units to stock

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Mixed container (need >44 pallets) — how to split? | Medium | Show "need X pallets → suggest Y pallets in container Z" clearly |
| PO received but wrong expiry date | Low | Prompt for lot/expiry on receive flow |
| User orders 1 pallet but needs 0.8 pallets (over-ordering) | Low | Show overshoot warning: "Ordering 5 pallets = 480 units (overshoot 72 units)" |

## Security Considerations

- Prevent negative pallet qty (min 1)
- PO number must be unique

## Next Steps

Phase 5 (Polish + Export + Deploy) is unblocked after this phase.
