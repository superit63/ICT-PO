# Research Report: Phase 3 — Dashboard + Forecast Grid + Rollforward UI Patterns

**Author:** Researcher Agent
**Date:** 19/03/2026
**Focus:** UI/UX patterns for the 3 core screens of Sale-Stock-PO app

---

## 1. TanStack Table v8 + Next.js 14 — Editable Grid Pattern

### Key Concept: Client Components Only

`@tanstack/react-table` is a **client-side library**. In Next.js 14 App Router, the table component and its parent must use `"use client"`. The page itself can be a Server Component — fetch data server-side, pass to a `<ForecastGrid data={...} />` client component.

```tsx
// app/forecasts/page.tsx — SERVER COMPONENT (fetches data)
import { ForecastGrid } from "@/components/forecast-grid";

export default async function ForecastsPage() {
  const [products, customers, forecasts] = await Promise.all([
    db.query.products.all(),
    db.query.customers.all(),
    db.query.forecasts.all(),
  ]);
  return <ForecastGrid products={products} customers={customers} forecasts={forecasts} />;
}

// components/forecast-grid.tsx — CLIENT COMPONENT ("use client")
"use client";
import { useReactTable, getCoreRowModel, getExpandedRowModel } from "@tanstack/react-table";
import { useState, useCallback, useRef, useMemo } from "react";

interface EditableCellProps {
  value: number;
  forecastId: string | null;  // null = new row
  productId: number;
  customerId: number;
  month: string;
  onSave: (payload: ForecastPayload) => void;
}
```

### Editable Cell Pattern

Each data cell wraps a controlled `<input>`. Use `display: grid` trick so the `<input>` fills the cell:

```tsx
function EditableCell({ value, ... }: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalValue(val);  // optimistic UI

    // Debounce: only save 500ms after last keystroke
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave({ productId, customerId, month, qtyUnits: val });
    }, 500);
  };

  return (
    <div className="relative h-8">
      <input
        className="absolute inset-0 w-full h-full px-1 text-right bg-transparent border border-transparent rounded hover:border-border focus:border-primary focus:outline-none focus:bg-background"
        type="number"
        value={localValue}
        onChange={handleChange}
        min={0}
      />
    </div>
  );
}
```

**Alternative (no debounce on keystroke — save on blur only):**
If keystroke debounce feels risky for number entry, save only on `onBlur` + an explicit "Save" button for bulk saves.

### Optimistic UI Updates

Mutate React state **immediately** before the API call returns. If the API fails, rollback:

```tsx
const [forecasts, setForecasts] = useState<Forecast[]>(initialData);

const saveForecast = useCallback(async (payload: ForecastPayload) => {
  // 1. Optimistic update
  setForecasts(prev => prev.map(f =>
    f.productId === payload.productId &&
    f.customerId === payload.customerId &&
    f.month === payload.month
      ? { ...f, qtyUnits: payload.qtyUnits }
      : f
  ));

  // 2. API call
  const res = await fetch("/api/forecasts", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // 3. Rollback on failure
    setForecasts(prev);  // revert to previous state
    toast.error("Save failed — reverted");
  }
}, []);
```

---

## 2. TanStack Table — Row Grouping + Totals Row

```tsx
const table = useReactTable({
  data: forecastRows,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getGroupedRowModel: getGroupedRowModel(),  // group by customer
  getExpandedRowModel: getExpandedRowModel(),
  state: { grouping: ["customerName"] },
});

const totalsRow = table.getFilteredRowModel().rows.reduce((acc, row) => {
  months.forEach(m => { acc[m] = (acc[m] ?? 0) + (row.original[m] ?? 0); });
  return acc;
}, {} as Record<string, number>);
```

**Totals row** = fixed bottom row outside table, or use `footer` feature. Better UX: show totals in a **sticky footer row** inside `<table>` using `position: sticky; bottom: 0`.

### Horizontal Scroll

Wrap `<table>` in a `div` with `overflow-x: auto` and a fixed max-width. For very wide tables (8+ months), add `min-width` on `<thead>`:

```tsx
<div className="overflow-x-auto rounded-md border">
  <table className="min-w-[800px] w-full">...</table>
</div>
```

**Sticky first columns** (Customer, Product): use `position: sticky; left: 0; z-index: 10` on those `<th>` and `<td>`.

---

## 3. Dashboard Card/Status UI

### Status Summary Cards (Top Row)

Using shadcn/ui `Card` + `Badge`:

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card className="border-red-300 bg-red-50">
    <CardHeader className="pb-1"><CardTitle className="text-sm text-red-700">Critical</CardTitle></CardHeader>
    <CardContent><span className="text-3xl font-bold text-red-600">{criticalCount}</span></CardContent>
  </Card>
  <Card className="border-yellow-300 bg-yellow-50">
    <CardHeader className="pb-1"><CardTitle className="text-sm text-yellow-700">Low Stock</CardTitle></CardHeader>
    <CardContent><span className="text-3xl font-bold text-yellow-600">{lowCount}</span></CardContent>
  </Card>
  <Card className="border-green-300 bg-green-50">
    <CardHeader className="pb-1"><CardTitle className="text-sm text-green-700">OK</CardTitle></CardHeader>
    <CardContent><span className="text-3xl font-bold text-green-600">{okCount}</span></CardContent>
  </Card>
  <Card>
    <CardHeader className="pb-1"><CardTitle className="text-sm">Active POs</CardTitle></CardHeader>
    <CardContent><span className="text-3xl font-bold">{openPOCount}</span></CardContent>
  </Card>
</div>
```

### Critical Products List

```tsx
const criticalProducts = rollforwardResults
  .filter(p => p.worstStatus === "critical" || p.worstStatus === "stockout")
  .sort((a, b) => a.lowestBalance - b.lowestBalance);

return (
  <section>
    <h2 className="text-red-600 font-semibold mb-3">⚠️ Critical ({criticalProducts.length})</h2>
    {criticalProducts.map(p => (
      <Card
        key={p.productId}
        className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => router.push(`/rollforward?product=${p.productId}`)}
      >
        <CardContent className="p-3 flex justify-between items-center">
          <div>
            <span className="font-medium">{p.productName}</span>
            <div className="text-xs text-muted-foreground">
              Stockout: {p.criticalMonths.join(", ") || "None"}
              {p.lowestBalance < 0 && ` ← ${Math.abs(p.lowestBalance)} units short`}
            </div>
          </div>
          <Badge variant={p.worstStatus === "stockout" ? "destructive" : "secondary"}>
            {p.worstStatus}
          </Badge>
        </CardContent>
      </Card>
    ))}
  </section>
);
```

### Color Coding

| Status | Badge Color | Card/Row BG | Threshold |
|--------|------------|-------------|-----------|
| `ok` | Green | `bg-green-50` | balance ≥ 3× packing |
| `low` | Yellow | `bg-yellow-50` | 1× ≤ balance < 3× packing |
| `critical` | Orange/Red | `bg-red-50` | 0 < balance < 1× packing |
| `stockout` | Red destructive | `bg-red-100` | balance ≤ 0 |

Use shadcn `Badge` with `variant` prop + custom class overrides for precise colors.

---

## 4. Stock Rollforward Timeline Design

### Table Structure

```tsx
// Month columns are dynamic: planningMonth, +1, +2, ... +7
// Rows are STATIC: Stock, +InPO, -Forecast, =Balance, Status

const ROW_LABELS = ["Stock", "+InPO", "-Forecast", "=Balance", "Status"] as const;

<table className="min-w-[700px] w-full text-sm">
  <thead>
    <tr>
      <th className="w-24 sticky left-0 bg-background z-10 border-r">Metric</th>
      {months.map(m => (
        <th key={m} className="min-w-[100px] text-center font-semibold border">
          {formatMonth(m)}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    <tr className="bg-muted/30">
      <td className="sticky left-0 bg-muted/30 font-medium border-r">Stock</td>
      {months.map((m, i) => (
        <td key={m} className={`text-center border ${i === 0 ? "font-bold" : "text-muted-foreground"}`}>
          {i === 0 ? data.currentStock : "—"}
        </td>
      ))}
    </tr>
    <tr>
      <td className="sticky left-0 bg-background font-medium border-r text-blue-600">+InPO</td>
      {months.map(m => (
        <td key={m} className="text-center text-blue-600 border">
          {data.incomingPOs[m] || "—"}
        </td>
      ))}
    </tr>
    <tr className="bg-muted/30">
      <td className="sticky left-0 bg-muted/30 font-medium border-r">-Forecast</td>
      {months.map(m => (
        <td key={m} className="text-center text-red-500 border">
          {data.forecastTotals[m] || "—"}
        </td>
      ))}
    </tr>
    <tr className="border-t-2 border-black">
      <td className="sticky left-0 bg-background font-bold border-r">Balance</td>
      {months.map(m => (
        <td
          key={m}
          className={`text-center font-bold border ${getBalanceColor(data.balances[m])}`}
        >
          {data.balances[m]}
        </td>
      ))}
    </tr>
    <tr>
      <td className="sticky left-0 bg-background border-r">Status</td>
      {months.map(m => (
        <td key={m} className="text-center border">
          <StatusBadge status={data.statuses[m]} />
        </td>
      ))}
    </tr>
  </tbody>
</table>
```

### Balance Cell Color Coding

```tsx
function getBalanceColor(balance: number, packing: number): string {
  if (balance <= 0) return "bg-red-200 text-red-800";     // stockout
  if (balance < packing) return "bg-orange-100 text-orange-800"; // critical
  if (balance < packing * 3) return "bg-yellow-100 text-yellow-800"; // low
  return "bg-green-100 text-green-800";                     // ok
}
```

### Stockout Row Highlight

```tsx
{stockoutMonths.map(month => (
  <tr key={month} className="bg-red-50 border border-red-300">
    <td colSpan={months.length + 1} className="px-4 py-2 text-red-700 font-medium">
      ⚠️ {productName} — STOCKOUT in {formatMonth(month)}. Need{" "}
      {Math.ceil(Math.abs(balances[month]) / packing)} pallets now.
    </td>
  </tr>
))}
```

---

## 5. Planning Month Selector

```tsx
// hooks/use-planning-month.ts
function usePlanningMonth() {
  const [anchorMonth, setAnchorMonth] = useState(() => {
    // Default: current month if past 25th, else previous month
    const now = new Date();
    const day = now.getDate();
    return day >= 25
      ? formatMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1))
      : formatMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  });

  const months = useMemo(() => {
    const [y, m] = anchorMonth.split("-").map(Number);
    return Array.from({ length: 8 }, (_, i) =>
      formatMonth(new Date(y, m - 1 + i, 1))
    );
  }, [anchorMonth]);

  return { anchorMonth, setAnchorMonth, months };
}

// usage in nav bar
<Select value={anchorMonth} onValueChange={setAnchorMonth}>
  <SelectTrigger className="w-[140px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {[-1, 0, 1].map(offset => {
      const d = new Date(); d.setMonth(d.getMonth() + offset);
      return <SelectItem key={offset} value={formatMonth(d)}>{formatMonth(d)}</SelectItem>;
    })}
  </SelectContent>
</Select>
```

---

## 6. Forecast Grid UX

### Filters + Product/Customer Selector

```tsx
<div className="flex gap-3 mb-4">
  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="All Products" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Products</SelectItem>
      {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
    </SelectContent>
  </Select>
  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="All Customers" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Customers</SelectItem>
      {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
    </SelectContent>
  </Select>
</div>
```

### Empty State

```tsx
{filteredRows.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <Package className="mx-auto h-12 w-12 mb-4 opacity-20" />
    <p className="text-lg font-medium">No forecasts yet</p>
    <p className="text-sm">Add your first forecast entry above</p>
  </div>
) : (
  <ForecastTable rows={filteredRows} ... />
)}
```

### Loading Skeleton

```tsx
function TableSkeleton({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Rollforward Computation — Client vs Server

| Approach | When to Use | Trade-off |
|---|---|---|
| **Server-side** (API) | Many products, large forecast datasets | One source of truth, consistent |
| **Client-side** (in `lib/calculations.ts`) | <100 products, <10k forecasts | Instant re-compute on filter change, no extra round-trip |

**Recommended for Phase 3:** Compute rollforward in **API route** (`/api/rollforward`), cache with `RevalidatePath` or `unstable_cache` (5-min TTL). Pass result to both Dashboard and Rollforward page.

```typescript
// lib/calculations.ts
export function computeRollforward(
  product: Product,
  stock: number,
  incomingPOs: Record<Month, number>,
  forecastTotals: Record<Month, number>,
  months: Month[]
): RollforwardEntry[] {
  let runningBalance = stock;
  return months.map((month, i) => {
    const po = incomingPOs[month] ?? 0;
    const fc = forecastTotals[month] ?? 0;
    const balance = i === 0
      ? runningBalance + po - fc
      : runningBalance + po - fc;
    runningBalance = balance;
    return {
      month,
      currentStock: i === 0 ? stock : 0,
      incomingPOUnits: po,
      forecastUnits: fc,
      balance,
      status: getStatus(balance, product.packingPerPallet),
    };
  });
}
```

---

## 8. Responsive Strategy

| Screen | Strategy |
|---|---|
| **Desktop (>1024px)** | Full table with all columns visible, sticky first column |
| **Tablet (768–1024px)** | Horizontal scroll, slightly narrower columns |
| **Mobile (<768px)** | Stack to card view: each month = one card row; or horizontal swipe carousel |

For the Rollforward table on mobile, consider a **transposed card view** — each month becomes a card with rows for Stock/InPO/Forecast/Balance:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
  {months.map(m => (
    <div key={m} className={`p-3 rounded-lg border ${getBalanceColor(balances[m], packing)}`}>
      <div className="font-semibold text-sm mb-2">{formatMonth(m)}</div>
      <div className="text-xs space-y-1">
        <div>Stock: {currentStock}</div>
        <div>+InPO: {incomingPOs[m]}</div>
        <div>-Fcast: {forecastTotals[m]}</div>
        <div className="font-bold border-t pt-1">= {balances[m]}</div>
      </div>
    </div>
  ))}
</div>
```

---

## 9. Summary Recommendations

| Pattern | Recommendation |
|---|---|
| Table library | `@tanstack/react-table` v8 (shadcn/ui DataTable wraps it) |
| Component boundary | Server page → client `<Grid>` component via props |
| Editable cells | Controlled `<input>` per cell, `onBlur` save with 500ms debounce |
| Optimistic updates | Mutate state immediately, rollback on API failure |
| Auto-save UX | Show subtle "Saving..." → "Saved ✓" toast on success |
| Dashboard layout | 4-card summary row + scrollable critical/low lists below |
| Status colors | Use Tailwind bg color classes, not just Badge text |
| Rollforward table | Static row labels × dynamic month columns, sticky first column |
| Planning month | shadcn `Select` in nav bar, defaults to current month |
| Mobile | Card grid for rollforward, horizontal scroll for forecast |

---

## Unresolved Questions

1. **Should forecasts auto-save on every keystroke debounce, or only on blur?** Blur is safer for number entry; debounce-on-keystroke feels snappier but risks lost updates on accidental tab-close.
2. **Should the rollforward compute client-side (instant) or server-side (cached API)?** Both are viable — pick server-side if data volume grows.
3. **Should the dashboard pull live from `/api/rollforward` or use SWR/React Query caching?** SWR gives free revalidation + loading states; plain fetch is simpler for a single-user app.
