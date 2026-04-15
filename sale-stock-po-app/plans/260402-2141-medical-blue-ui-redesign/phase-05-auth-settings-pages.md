# Phase 05 — Auth & Settings Pages

- Priority: P2
- Status: Implemented
- Depends on: Phase 01
- Pages: Login, Setup, Settings

## Current Issues Found

### Login Page (`app/login/page.tsx`)

1. **Left panel radial gradient** uses `rgba(96,165,250,0.18)` (blue) + `rgba(249,115,22,0.14)` (orange) — orange feels off-brand for medical; replace with blue-only gradient
2. **Trust marker cards** `border-white/8 bg-white/6` — fine glass effect on dark sidebar bg
3. **Feature item icon frames** `bg-white/8` — low contrast; could be slightly stronger
4. **PIN input inner shadow** `shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]` — hardcoded white; works on light, might bleed on dark
5. **"Need help?" box** uses `bg-orange-500/10 text-orange-700` for Lightbulb icon — orange is off-brand; switch to blue `bg-primary/10 text-primary`
6. **Button shadow** `rgba(37,99,235,0.45)` hardcoded blue — close to new primary, acceptable
7. **Mobile logo** `shadow-[0_18px_36px_-24px_rgba(37,99,235,0.7)]` — will need updating to match new primary

### Setup Page (`app/setup/page.tsx`)

1. Same left-panel styling as login — same issues apply
2. **PIN input fields** `h-14 text-center text-2xl tracking-[0.45em]` — good sizing
3. **Setup guidance box** uses `bg-primary/10 text-primary` — will auto-improve

### Settings Page (`app/(app)/settings/page.tsx`)

1. **Card headers** use icon + text pattern with `text-primary` — good, will auto-improve
2. **PIN inputs** `text-center text-xl font-mono tracking-[0.5em]` — good pattern
3. **App info table** clean row pattern — fine
4. **Restore button** `variant="destructive"` — correct for dangerous action
5. **Cards all `shadow-none`** — should have subtle shadow consistent with rest of app

## Implementation Steps

### 1. Login — remove orange gradient, use blue-only

```tsx
<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(3,105,161,0.20),transparent_22rem),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.15),transparent_20rem)]" />
```

### 2. Login — replace orange help icon with blue

```tsx
<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
  <Lightbulb className="size-5" />
</div>
```

### 3. Login — update hardcoded box shadows for logo

Replace `rgba(37,99,235,...)` shadows with `rgba(3,105,161,...)` to match new sky-700 primary.

### 4. Settings — add subtle shadow to cards

Remove `shadow-none` from settings cards, let Card component default shadow apply.

### 5. Setup — same gradient fix as login

Apply the same blue-only radial gradient to setup left panel.

## Files to Modify

- `app/login/page.tsx`
- `app/setup/page.tsx`
- `app/(app)/settings/page.tsx`

## Todo

- [x] Replace orange radial gradient with blue-only on login
- [x] Replace orange help icon with blue primary on login
- [x] Update hardcoded rgba blue shadows to match new primary
- [x] Apply same gradient fix to setup page
- [x] Remove `shadow-none` from settings cards
- [x] Verify PIN input still readable against new blue-tinted bg
- [x] Verify left panel text contrast on blue gradient
- [x] Test mobile login (no left panel, only PIN form)

## Success Criteria

- Login page exudes "medical operations center" identity
- No orange/warm accents remaining — fully blue-cool professional palette
- PIN inputs clear and focused
- Settings page consistent with rest of app
