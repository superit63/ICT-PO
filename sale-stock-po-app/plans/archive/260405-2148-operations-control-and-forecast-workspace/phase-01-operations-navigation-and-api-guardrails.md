# Phase 01 - Operations Navigation And API Guardrails

- Priority: P1
- Status: Implemented
- Goal: Make operational maintenance discoverable and safe before building screens.

## Files

- `components/layout/sidebar.tsx`
- `app/(app)/page.tsx`
- `app/api/products/[id]/route.ts`
- `app/api/customers/route.ts`
- `app/api/customers/[id]/route.ts`
- `app/api/stock/route.ts`
- `app/api/stock/[id]/route.ts`

## Todo

- [x] Add sidebar links for stock control and master data
- [x] Add dashboard quick actions for stock and master data
- [x] Add customer `[id]` route with `GET/PUT/DELETE`
- [x] Add stock `[id]` route with `GET/PUT/DELETE`
- [x] Guard product/customer deletes when referenced by forecast, stock, or PO data
- [x] Harden protected routes to validate the stored session value

## Success Criteria

- Users can find stock and master data from the main shell.
- Unsafe deletes return clear errors instead of silently breaking planning data.
