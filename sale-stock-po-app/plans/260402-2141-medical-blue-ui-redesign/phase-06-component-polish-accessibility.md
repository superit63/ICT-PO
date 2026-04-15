# Phase 06 — Component Polish & Accessibility

- Priority: P2
- Status: Implemented
- Depends on: Phase 01

## Current Issues Found

### Components

1. **Card** `rounded-[20px]` — hardcoded; should be derived from `--radius` token. Currently `--radius: 0.95rem`, card uses hardcoded 20px. After token change to 0.625rem, card should use `rounded-xl` (12px) or keep at `rounded-2xl` (16px)
2. **Card shadow** `shadow-[0_16px_36px_-30px_rgba(15,23,42,0.16)]` — heavy slate shadow; replace with blue-tinted lighter shadow
3. **Button default variant** shadow `rgba(37,99,235,0.45)` — update to match new primary
4. **Button destructive** uses `bg-destructive/10 text-destructive` — good pattern; keep
5. **Badge** — variants are fine; auto-update through tokens
6. **Input** `rounded-xl` (12px) — will become 10px via `--radius`; acceptable
7. **Tabs** `rounded-2xl` container, `rounded-xl` triggers — good; will tighten via tokens
8. **Tab trigger active state** `data-active:border-white/80` — hardcoded white; should be token-based

### Accessibility Audit

| Check | Status | Notes |
|-------|--------|-------|
| Skip link | Present | `app/layout.tsx` — properly implemented |
| Focus rings | Present | 2px ring on buttons, inputs, nav items |
| aria-label on icon buttons | Partial | Mobile menu has it; logout button missing |
| aria-current on nav | Present | `aria-current="page"` on active nav |
| aria-invalid on PIN | Present | Error state connected |
| role="alert" on errors | Present | Dashboard and login errors |
| Reduced motion | Present | `globals.css` handles `prefers-reduced-motion` |
| Color not sole indicator | Mostly | Status uses color + text label + icon; MiniChart uses color only (add sr-only text) |
| heading hierarchy | Mixed | Dashboard h1 OK; some pages lack proper h1 |
| Form labels | Good | All inputs have visible labels |
| Touch targets | Good | Min 44px on nav items and buttons |

## Implementation Steps

### 1. Card — update radius and shadow

```tsx
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card py-5 text-sm text-card-foreground shadow-[0_8px_24px_-16px_rgba(12,74,110,0.10)]",
  className
)}
```

### 2. Button — update primary shadow

```tsx
default: "bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_rgba(3,105,161,0.40)] hover:bg-primary/94",
```

### 3. Tabs trigger — replace hardcoded white border

```tsx
"data-active:border-border data-active:bg-background data-active:text-foreground"
```

### 4. Logout button — add aria-label

```tsx
<button aria-label="Logout from application" ...>
```

### 5. MiniChart — add screen reader text

```tsx
<div className="flex items-center justify-center gap-1" aria-hidden="true">
  ...
</div>
<span className="sr-only">
  Status: {entries.map(e => `${formatMonth(e.month)}: ${e.status}`).join(', ')}
</span>
```

### 6. Card Footer — update muted bg

```tsx
"flex items-center rounded-b-2xl border-t bg-primary/3 p-5"
```

## Files to Modify

- `components/ui/card.tsx`
- `components/ui/button.tsx`
- `components/ui/tabs.tsx`
- `components/layout/sidebar.tsx` (aria-label on logout)
- `app/(app)/page.tsx` (MiniChart sr-only)

## Todo

- [x] Update Card border-radius to `rounded-2xl`
- [x] Update Card shadow to blue-tinted lighter shadow
- [x] Update Button primary shadow to match new primary
- [x] Fix Tab trigger active border from hardcoded white to token
- [x] Add aria-label to logout button
- [x] Add sr-only text to MiniChart for screen readers
- [x] Verify all focus rings visible against new blue backgrounds
- [x] Verify keyboard tab order on all pages
- [x] Test with prefers-reduced-motion enabled
- [x] Run contrast check on all text/bg combinations

## Success Criteria

- All components reflect blue medical identity through tokens
- No hardcoded white/slate shadows remaining in components
- WCAG AA compliance on all text contrast
- Screen readers can access all status information
- Keyboard navigation works end-to-end
