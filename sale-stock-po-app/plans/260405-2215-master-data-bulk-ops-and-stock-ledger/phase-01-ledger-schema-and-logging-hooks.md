# Phase 01 - Ledger Schema And Logging Hooks

- Priority: P1
- Status: Completed
- Goal: Persist every meaningful stock movement in a dedicated history table.

## Todo

- [x] Add `stock_adjustments` table to the schema and init path
- [x] Add shared logging helper for stock create/update/delete events
- [x] Log PO receipt events into the ledger
- [x] Expose a read API for recent stock adjustment history

## Success Criteria

- Stock changes are queryable after the fact with timestamp, type, delta, and context.
- Delete logging was verified after fixing the stock-delete ordering so foreign keys stay valid.
