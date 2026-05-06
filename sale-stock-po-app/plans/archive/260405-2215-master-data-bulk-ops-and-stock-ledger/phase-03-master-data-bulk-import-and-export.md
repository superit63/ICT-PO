# Phase 03 - Master Data Bulk Import And Export

- Priority: P1
- Status: Completed
- Goal: Make products and customers maintainable in bulk, not just one row at a time.

## Todo

- [x] Add batch import support to product and customer APIs
- [x] Add spreadsheet export actions to the master-data UI
- [x] Add spreadsheet import actions to the master-data UI
- [x] Upsert products by SKU and customers by exact name with conflict checks

## Success Criteria

- Users can download current master data, edit offline, and import changes back safely.
- Exported sheets now include IDs so repeat imports can update exact rows instead of relying only on matching names.
