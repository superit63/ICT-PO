# Phase 02 — Sidebar & App Shell

- Priority: P0 (visual backbone)
- Status: Implemented
- Depends on: Phase 01

## Current Issues Found

1. **Sidebar brand block** — `Pill` icon in near-black bg lacks medical identity; should be blue-branded
2. **"Supply planning workspace"** description is fine but could show app version badge
3. **Active nav indicator** — tiny 1.5px dot is too subtle; needs stronger visual cue
4. **Mobile sidebar** background scrim `slate-950/42` — should match blue tone
5. **Shell grid overlay** — gray-tinted; should match blue-tinted background
6. **Sidebar width** 276px is good; keep
7. **Logout button** at bottom is well-placed; style matches nav items

## Implementation Steps

### 1. Sidebar brand icon — blue gradient background

Replace the `bg-sidebar-primary/90` icon container with a more vibrant medical blue:

```tsx
<div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 shadow-md">
  <Pill className="size-4 text-white" />
</div>
```

### 2. Active nav item — left border accent instead of dot

Replace the tiny dot indicator with a visible left border:

```tsx
isActive
  ? "border-sidebar-ring/30 bg-sidebar-primary/15 text-sidebar-foreground border-l-2 border-l-sky-400"
  : "border-transparent ..."
```

Remove the dot span: `{isActive && <span className="ml-auto h-1.5 w-1.5 ..." />}`

### 3. Mobile backdrop — blue-tinted

```tsx
<div className="fixed inset-0 z-40 bg-sky-950/40 backdrop-blur-sm lg:hidden" />
```

### 4. Shell grid — blue-tinted

```css
.shell-grid {
  background-image: linear-gradient(to bottom, oklch(0.55 0.06 235 / 0.08) 1px, transparent 1px);
}
```

### 5. Main content panel — tighter radius

The `panel-surface` on `(app)/layout.tsx` currently uses `rounded-[22px]`. Reduce to `rounded-2xl` (16px) for professional feel.

## Files to Modify

- `components/layout/sidebar.tsx`
- `app/(app)/layout.tsx`
- `app/globals.css` (shell-grid utility)

## Todo

- [x] Update sidebar brand icon to blue gradient
- [x] Replace active nav dot with left border accent
- [x] Blue-tint mobile backdrop overlay
- [x] Update shell-grid to blue tint
- [x] Reduce main panel border-radius to rounded-2xl
- [x] Verify mobile sidebar animation still smooth
- [x] Verify keyboard focus states visible on blue sidebar

## Success Criteria

- Sidebar reads as "medical blue branded" at first glance
- Active page is obvious without needing to squint
- Mobile overlay has cohesive blue tint
- Shell feels professional and enterprise-grade
