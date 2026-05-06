# Phase 03 — Dashboard Page

- Priority: P1
- Status: Implemented
- Depends on: Phase 01, Phase 02

## Current Issues Found

1. **Status cards `border-t-4`** — emerald/amber/orange/rose colors are fine (industry standard), but card body lacks blue integration
2. **SummaryTile** uses `bg-secondary/65` — will naturally improve with blue tokens but could benefit from subtle blue border or icon
3. **MiniChart bars** — hard to read at 2.5px width; consider making slightly wider or adding tooltip
4. **Quick action cards** — `bg-secondary` icon frames are plain; add subtle blue-tinted frames
5. **"Immediate risk detected" alert** — destructive styling is correct; keep
6. **Table header** uses `text-[0.68rem]` uppercase tracking — good pattern, keep
7. **Table "Open" button** in last column could be more styled as a link, less like a full button
8. **Page header badge** `Supply planning` — could use blue primary tint
9. **Inventory detail table** — mini chart bars are good; keep the status bar classes
10. **Large card border-radius** `rounded-[20px]` from card component — will auto-fix with radius token change

## Implementation Steps

### 1. SummaryTile — add icon and blue accent

Add a subtle blue left-border or icon slot to each summary tile:

```tsx
<div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
```

### 2. Quick action icon frames — blue tint

```tsx
<div className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
```

### 3. Table "Open" link — simplify to text link

Replace the border+bg button with a lightweight text link:
```tsx
<Link href={...} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
  View <ArrowRight className="size-3.5" />
</Link>
```

### 4. Page header badge — blue tint

The `Badge variant="outline"` will naturally pick up the new blue border from tokens.

### 5. Status info chips in header

```tsx
<div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary font-medium">
  {results.length} SKUs tracked
</div>
```

### 6. "No urgent replenishment" success box — keep green, it's correct

Green = positive signal in medical/clinical context. Correct pattern.

## Files to Modify

- `app/(app)/page.tsx`

## Todo

- [x] Update SummaryTile to use card bg with subtle shadow
- [x] Blue-tint quick action icon frames
- [x] Simplify table "Open" button to text link
- [x] Add blue tint to header info chips
- [x] Verify all status colors still contrast well against new blue-tinted card bg
- [x] Test empty state renders correctly
- [x] Test responsive: 375px → 1440px

## Success Criteria

- Dashboard reads as "medical operations center" — professional, blue-dominant
- Status severity (emerald/amber/red) stands out against blue-neutral base
- Data table is scannable at desktop widths
- Mobile view maintains readability
