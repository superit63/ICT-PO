# Planner Execution Checklist

## Validation Summary

- Plan direction is valid, but shared component cleanup should move earlier: do Phase 01, then shared pieces from Phase 06, then Phase 02, then page work.
- Biggest real delta is in `app/globals.css`, `app/layout.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/tabs.tsx`, and `components/layout/sidebar.tsx`.
- Several page-level items are already done or should be trimmed under YAGNI/KISS/DRY.

## Phase 01 - Design Tokens and Typography

- TODO: Replace light/dark/sidebar tokens in `app/globals.css` with the medical-blue palette.
- TODO: Reduce `--radius` from `0.95rem` to `0.625rem` and retune `.panel-surface`.
- TODO: Swap `Manrope` to `Inter` in `app/layout.tsx` and point `--font-sans` at the new variable.
- TODO: Fold selection and scrollbar tint updates into the same `globals.css` pass.
- TODO: Run light/dark contrast checks after the token swap.
- KEEP: The existing body gradient is already cool-toned; just retint it while touching globals.
- DROP: Fine-tuning `--chart-2..5` as a separate task. Those tokens are unused outside `app/globals.css`.

## Phase 02 - Sidebar and App Shell

- TODO: Update the sidebar brand mark to a blue gradient in `components/layout/sidebar.tsx`.
- TODO: Replace the active-item dot with a stronger row treatment or left-border accent in `components/layout/sidebar.tsx`.
- TODO: Retint the mobile backdrop and `shell-grid` in `components/layout/sidebar.tsx` and `app/globals.css`.
- TODO: Tighten the main panel radius in `app/(app)/layout.tsx`.
- TODO: Verify focus visibility on nav items and logout after the color shift.
- KEEP: Sidebar width and logout placement are already correct.
- DROP: Adding an app-version badge to the sidebar header.

## Phase 03 - Dashboard Page

- TODO: Restyle `SummaryTile` away from `bg-secondary/65` in `app/(app)/page.tsx`.
- TODO: Retint the existing header info chips; they already exist, so this is a polish pass, not a new feature.
- TODO: Blue-tint quick-action icon frames in `app/(app)/page.tsx`.
- TODO: Simplify the inventory table `Open` CTA to a lighter text-link treatment.
- TODO: Add screen-reader text for `MiniChart` status summaries in `app/(app)/page.tsx` if not handled with Phase 06.
- KEEP: Destructive alert, positive empty state, status colors, and table header typography.
- DROP: Mini-chart width/tooltip experiments for now. Current bars plus `title` are good enough.

## Phase 04 - Data Pages

- TODO: Forecasts: change `focus:bg-white` to token-based background in `app/(app)/forecasts/page.tsx`.
- TODO: PO Suggest: retint the container-config bar in `app/(app)/po-suggest/page.tsx`.
- TODO: PO Management: replace both `window.location.href` navigations with `router.push` in `app/(app)/po/page.tsx`.
- TODO: Re-run sticky-column and horizontal-scroll checks after the token pass.
- KEEP: Forecast select styling, customer region badge, rollforward status semantics, rollforward EXW badge, PO Suggest urgency cards, and PO status badges.
- KEEP: Forecast grand-total cell already has `text-primary`; only revisit if it still reads flat after Phase 01.
- DROP: Refactoring red/yellow/green status hardcodes across these pages. They are semantically clear and intentional.
- DROP: Separate rollforward EXW badge work. It is already blue-tinted.

## Phase 05 - Auth and Settings Pages

- TODO: Login: replace the orange radial gradient with a blue-only gradient in `app/login/page.tsx`.
- TODO: Login: replace the orange help icon treatment with primary tint in `app/login/page.tsx`.
- TODO: Login and setup: update hardcoded `rgba(37,99,235,...)` logo/button shadows to match the new primary.
- TODO: Settings: remove `shadow-none` from cards in `app/(app)/settings/page.tsx` so shared card styling can show through.
- TODO: Verify mobile auth screens and PIN-input contrast after Phase 01.
- KEEP: Setup guidance box already uses primary tint.
- DROP: Adding a new left-panel radial gradient to `app/setup/page.tsx`. The setup page does not currently mirror the login gradient, and this is cosmetic only.

## Phase 06 - Shared Component Polish and Accessibility

- TODO: Update `Card` radius and shadows in `components/ui/card.tsx`.
- TODO: Update the primary button shadow in `components/ui/button.tsx`.
- TODO: Replace the hardcoded active-tab border color in `components/ui/tabs.tsx`.
- TODO: Add `aria-label` to the logout button in `components/layout/sidebar.tsx`.
- TODO: Run a keyboard, focus, reduced-motion, and contrast smoke test across login, sidebar, dashboard, and PO tabs.
- KEEP: Skip link, focus-ring system, `aria-current`, and `role="alert"` coverage are already in place.
- DROP: `CardFooter` restyling for now. `CardFooter` is currently unused.

## Suggested Execution Order

1. Phase 01
2. Phase 06 shared-component items
3. Phase 02
4. Phase 03
5. Phase 04
6. Phase 05
