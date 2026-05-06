# Phase 03 - Master Data Workspace

- Priority: P1
- Status: Implemented
- Goal: Let users manage products and customers directly inside the app shell.

## Files

- `app/(app)/master-data/page.tsx`
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/customers/route.ts`
- `app/api/customers/[id]/route.ts`
- Optional supporting components under `components/master-data/`

## Todo

- [x] Add products tab with add, edit, delete, and search
- [x] Add customers tab with add, edit, delete, and search
- [x] Surface guarded-delete errors in the UI
- [x] Reuse current API/auth patterns

## Success Criteria

- Users can add/remove/edit products and customers from a visible page.
- The app prevents destructive deletes when the records are already in operational use.
