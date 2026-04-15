# Phase 01 - Refresh Shell And Key Screens

## Context Links

- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\globals.css`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\layout.tsx`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\(app)\layout.tsx`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\components\layout\sidebar.tsx`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\(app)\page.tsx`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\login\page.tsx`
- `D:\INCOTEC\ICT-PO\sale-stock-po-app\app\setup\page.tsx`

## Overview

- Priority: High
- Status: Complete
- Brief: Refresh the shell and highest-traffic screens with a cohesive, enterprise-focused visual system.

## Key Insights

- Current UI is functional but still close to default shadcn styling.
- The app benefits from a softer enterprise aesthetic with stronger status emphasis.
- Login and dashboard are the highest-visibility screens and should set the tone for the rest of the app.

## Requirements

- Improve visual hierarchy, spacing, and contrast.
- Keep navigation and data tables mobile-safe.
- Preserve current behavior and route structure.
- Add accessibility affordances where practical.

## Architecture

- Global tokens define color, type, focus, and surface behavior.
- Shared primitives propagate the visual system across existing pages.
- Shell updates frame all authenticated routes consistently.

## Related Code Files

- Modify: `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, `components/layout/sidebar.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/tabs.tsx`, `components/ui/badge.tsx`, `app/(app)/page.tsx`, `app/login/page.tsx`, `app/setup/page.tsx`
- Create: none unless a small helper becomes necessary
- Delete: none

## Implementation Steps

1. Refresh typography and theme tokens in the root layout and global CSS.
2. Rework the app shell for desktop and mobile navigation clarity.
3. Upgrade dashboard hierarchy, status communication, and quick actions.
4. Redesign auth screens for consistency and stronger trust cues.
5. Validate with lint/build and fix any regressions.

## Todo List

- [x] Update plan status after implementation
- [x] Refresh design tokens and shell
- [x] Improve dashboard UI
- [x] Improve login and setup UI
- [x] Run lint/build verification

## Success Criteria

- Main screens feel cohesive and more polished.
- Navigation remains clear on mobile and desktop.
- Status-heavy dashboard content is easier to scan.
- Auth errors and focus states are easier to notice.
- Validation completed with `npm run lint` and `npm run build`.

## Risk Assessment

- Shared primitive changes can affect multiple pages unexpectedly.
- Large page files may need careful edits to avoid regressions.

## Security Considerations

- Preserve auth flow and existing API calls.
- Do not expose sensitive data in the UI.

## Next Steps

- Review visual consistency on secondary screens after this pass.
- Extend the refined shell patterns into forecasts, PO, and settings if needed.
