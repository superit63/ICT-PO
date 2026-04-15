# Phase 04 — Data Pages

- Priority: P1
- Status: Implemented
- Depends on: Phase 01
- Pages: Forecasts, Rollforward, PO Suggest, PO Management

## Current Issues Found

### Forecasts Page (`app/(app)/forecasts/page.tsx`)

1. **Input cells `focus:bg-white`** — hardcoded white; should use token `bg-background`
2. **Filter selects** use inline styles with `bg-card`; fine, but no blue accent on active state
3. **Summary footer** `bg-muted/30` is plain; could use subtle blue accent for grand total
4. **Customer region badge** `bg-primary/10 text-primary` — will auto-improve with blue tokens
5. **Sticky columns** `bg-card` and `bg-muted/50` — correct z-index pattern; keep

### Rollforward Page (`app/(app)/rollforward/page.tsx`)

1. **Product selector buttons** — inconsistent styling: uses hardcoded `bg-red-50 text-red-700` and `bg-yellow-50 text-yellow-700` instead of semantic classes
2. **Stockout alert box** — `border-red-200 bg-red-50` hardcoded; should use destructive tokens for consistency
3. **Balance row** uses hardcoded `STATUS_BG` map with `bg-green-50`, `bg-yellow-50`, etc. — these are functional colors for status, acceptable to keep hardcoded
4. **Product info badges** (`units/pallet`, `EXW price`) — plain `bg-muted`; could use subtle blue tint
5. **Detail breakdown table** — good structure with visual bar chart column; keep
6. **`text-red-700`** for negative balance — correct medical convention (red = danger)

### PO Suggest Page (`app/(app)/po-suggest/page.tsx`)

1. **Summary cards** use hardcoded `bg-red-50 border-red-200`, `bg-yellow-50 border-yellow-200` — acceptable for urgency signaling
2. **SuggestionCard left border** `border-l-4 border-l-red-500` — good visual pattern
3. **"Create PO" button** is full-width primary — good CTA pattern
4. **Container config info bar** `bg-muted/30` — could use blue tint

### PO Management Page (`app/(app)/po/page.tsx`)

1. **Status colors** `STATUS_COLORS` uses hardcoded `bg-blue-100 text-blue-700` etc. — fine for status semantics
2. **Table row** `onClick` navigates via `window.location.href` — works but not ideal; should use router
3. **Mobile card** `shadow-none hover:shadow-sm` — nice interaction; keep
4. **Delete confirmation** inline — good UX pattern with confirm/cancel
5. **TabsList** will auto-improve with new blue tokens

## Implementation Steps

### 1. Forecasts — fix hardcoded focus:bg-white

In `DebouncedCell`:
```tsx
className="... focus:bg-background ..."
```

### 2. Forecasts — blue-tinted grand total

```tsx
<td className="... bg-primary/5 border-l border-border text-sm font-bold text-primary">
```

### 3. Rollforward — product selector consistency

The product pills already use `bg-primary text-primary-foreground` for active. The red/yellow hardcodes for status indicators are correct (functional color). No change needed.

### 4. Rollforward — product info badges with blue tint

```tsx
<span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-md">
  EXW €{selected.exwPriceEur}
</span>
```

### 5. PO Suggest — container config bar blue tint

```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg px-3 py-2">
```

### 6. PO Management — replace window.location.href with router

Use Next.js `useRouter` for programmatic navigation:
```tsx
onClick={() => router.push(`/po/${po.id}`)}
```

### 7. All data pages — select elements styling

Ensure all `<select>` elements use consistent focus ring:
```tsx
className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
```
Already correct — will auto-improve with blue primary token.

## Files to Modify

- `app/(app)/forecasts/page.tsx`
- `app/(app)/rollforward/page.tsx`
- `app/(app)/po-suggest/page.tsx`
- `app/(app)/po/page.tsx`

## Todo

- [x] Fix `focus:bg-white` → `focus:bg-background` in forecast cells
- [x] Blue-tint forecast grand total cell
- [x] Blue-tint rollforward product info badges (EXW price)
- [x] Blue-tint PO suggest container config bar
- [x] Replace `window.location.href` with `router.push` in PO table
- [x] Verify all status colors still readable against new blue surfaces
- [x] Verify horizontal scroll on tables works at 375px
- [x] Verify sticky columns don't break with new bg colors

## Success Criteria

- Data-heavy pages feel cohesive with blue identity
- Status colors (red/yellow/green) remain clear against blue-neutral surfaces
- No hardcoded white backgrounds leaking through
- Table interactions smooth on mobile
