# Phase 04 - Forecast Customer Drilldown

- Priority: P1
- Status: Implemented
- Goal: Make forecast entry usable for large customer lists.

## Files

- `app/(app)/forecasts/page.tsx`
- Optional supporting components under `components/forecasts/`

## Todo

- [x] Convert the table to customer summary rows with expandable product details
- [x] Add customer search alongside existing product/customer filters
- [x] Add expand all / collapse all actions
- [x] Keep debounced cell saves and totals intact
- [x] Preserve accessibility labels and mobile table behavior

## Success Criteria

- A user can scan hundreds of customers without seeing every product row at once.
- Expanding one customer reveals the editable product-level forecast rows immediately.
