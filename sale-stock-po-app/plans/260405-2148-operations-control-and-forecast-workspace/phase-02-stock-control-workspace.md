# Phase 02 - Stock Control Workspace

- Priority: P1
- Status: Implemented
- Goal: Let users maintain current stock lots directly in the app.

## Files

- `app/(app)/stock/page.tsx`
- `app/api/stock/route.ts`
- `app/api/stock/[id]/route.ts`
- Optional supporting components under `components/stock/`

## Todo

- [x] Add stock page with summary cards and clear empty states
- [x] Add stock lot create form
- [x] Add stock table with product filter, expiry visibility, and search
- [x] Add edit/delete actions for lots
- [x] Keep rollforward compatibility by preserving the current stock schema

## Success Criteria

- Current stock is manageable without touching settings or raw API calls.
- Users can update quantity, lot number, expiry date, and remove obsolete lots.
