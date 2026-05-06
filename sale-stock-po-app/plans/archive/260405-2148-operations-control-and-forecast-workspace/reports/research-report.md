# Research Report: Operations Control And Forecast Workspace

Conducted: 2026-04-05

## Executive Summary

The app already has the planning engine, but the operational inputs are buried or missing. Products and customers have create APIs but no visible management screen, and stock only exists as an API plus PO-receiving side effect. That explains the user pain exactly: planning exists, maintenance does not.

For larger customer sets, the forecast page should stop behaving like one flat spreadsheet. Official grid and demand-planning references converge on the same pattern: search first, then drill into grouped rows. The best fit for this app is a customer-first summary row that expands into editable product rows, with search and expand/collapse controls.

## Sources

- Next.js 16 local docs: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Shopify adjustment history docs: [Viewing inventory adjustment history](https://help.shopify.com/en/manual/products/inventory/adjusting-inventory/adjustment-history)
- SAP forecast parameters docs: [Forecast Parameters](https://help.sap.com/doc/saphelp_scm700_ehp02/7.0.2/en-US/fc/94cb530898214be10000000a174cb4/content.htm)
- AG Grid master/detail docs: [JavaScript Data Grid Master / Detail](https://www.ag-grid.com/javascript-data-grid/master-detail/)

## Current App Findings

- Sidebar exposes planning pages only: dashboard, forecasts, rollforward, PO suggest, PO management, settings.
- `POST /api/customers` and `POST /api/products` exist, but no visible CRUD workflow in the app shell.
- Products have `GET/PUT/DELETE /api/products/[id]`; customers do not yet have `[id]` routes.
- Stock has `GET/POST /api/stock`, but no edit/delete route and no stock page in navigation.
- Forecast entry is a flat customer x product x month matrix. With many customers, row scanning becomes the bottleneck.

## Best-Practice Takeaways

### 1. Stock needs a visible operational home

Shopify exposes inventory directly from product operations and gives adjustment context, not hidden settings. The core lesson is discoverability: inventory must be a first-class workspace, not a backup/admin side feature.

Implementation fit:

- Add a dedicated stock-control page in the main sidebar.
- Make stock management lot-based because this app already tracks `lot_number`, `expiry_date`, and `qty_units`.
- Show expiry risk and allow add/edit/delete from the same page.

### 2. Master data should be separate from settings

SAP’s forecast configuration flow uses a selection panel for customer/location/product before editing forecast details. That only works if the base records are manageable and searchable.

Implementation fit:

- Add a master-data page with separate products and customers tabs.
- Support create, edit, and guarded delete.
- Block delete when the record is referenced by forecasts, stock, or PO items.

### 3. Forecast interaction should be grouped and expandable

AG Grid’s master/detail guidance is the clearest generic pattern here: top-level rows expand to reveal related detail rows. For this app, customer rows should be the master level and product forecast rows the detail level.

Implementation fit:

- Replace the flat table body with customer summary rows.
- Expand a customer to reveal product rows with the existing editable month cells.
- Add customer search, product filter, and expand/collapse all.
- Keep month totals and grand total visible.

### 4. Keep mutations authenticated and explicit

Next.js 16 mutation guidance emphasizes server-side authorization and explicit mutation boundaries. This app already uses authenticated route handlers, so the safest path is to keep the existing API-route pattern and extend it consistently.

Implementation fit:

- Reuse route handlers instead of mixing in a second mutation architecture.
- Add validation and protected deletes in the missing `[id]` routes.
- Refresh client state locally after successful mutations.

## Recommended Implementation

1. Add two discoverable routes: `/stock` and `/master-data`.
2. Add `customers/[id]` and `stock/[id]` API routes for update/delete.
3. Add delete guardrails for customers/products so referenced master data cannot be removed accidentally.
4. Rework forecasts into customer-collapsible sections with summary totals and product detail rows.
5. Add dashboard shortcuts so the new operational pages are obvious from day one.

## Non-Goals For This Pass

- Full inventory ledger/audit history
- Multi-location stock states like committed/unavailable
- Forecast virtualization library adoption
- Bulk CSV import/export for master data

## Next Steps

1. Implement discoverable navigation and guarded CRUD routes.
2. Build stock-control and master-data screens.
3. Redesign forecast entry around customer drill-down.
4. Verify with lint/build and browser smoke checks.
