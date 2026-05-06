# Library Utilities & Business Logic Scout Report
**Project:** sale-stock-po-app  
**Date:** 2026-05-04  
**Scope:** /home/sieu/ICT/ICT-PO/sale-stock-po-app/lib/* and scripts/*

---

## Executive Summary

The sale-stock-po-app library contains 11 utility files implementing database access, business calculations, Excel export/import, session management, and initialization logic. The codebase follows a clean separation of concerns with dedicated modules for each functional area.

**Key Technologies:**
- Database: Turso (libSQL) via `@libsql/client`
- Excel: SheetJS (`xlsx`)
- Authentication: bcryptjs for PIN hashing
- Framework: Next.js 16.2.0 with React 19

---

## 1. Database Layer (`db.ts`)

**Purpose:** Singleton database client with query utilities

**Key Functions:**
- `getDbClient()` - Returns singleton Turso/libSQL client
  - Reads `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` from env
  - Falls back to `file:local.db` for local development
- `executeSql(sql, args)` - Execute parameterized SQL (no return)
- `queryAll<T>(sql, args)` - Execute query and return all rows
- `queryOne<T>(sql, args)` - Execute query and return first row or null
- `runMigrations(sql)` - Split SQL by semicolons and execute sequentially

**Pattern:** Singleton pattern with lazy initialization, parameterized queries for SQL injection prevention

**Dependencies:** `@libsql/client`

---

## 2. Business Logic & Calculations (`calculations.ts`)

**Purpose:** Core rollforward and PO suggestion algorithms

### Types Defined:
- `Month` - String format "YYYY-MM"
- `Units` / `Pallets` - Number aliases for clarity
- `StockStatus` - "ok" | "low" | "critical" | "stockout"
- `RollforwardEntry` - Monthly stock projection with balance and status
- `RollforwardResult` - Complete product rollforward with 8-month entries
- `DashboardRow` - Summary view for dashboard display
- `POSuggestion` - Purchase order recommendation with urgency

### Key Functions:

**Status Calculation:**
```typescript
getStatus(balance: Units, packing: number): StockStatus
```
- `balance < 0` → "stockout"
- `balance < packing × 1` → "critical"
- `balance < packing × 3` → "low"
- Otherwise → "ok"

**Date Utilities:**
- `addMonths(yearMonth, count)` - Add months to YYYY-MM string
- `formatMonth(yearMonth)` - Convert "2026-04" to "Apr 2026"
- `getArrivalMonth(orderMonth)` - Calculate arrival based on 5-month lead time

**PO Suggestion Engine:**
```typescript
suggestPO(rollforward: RollforwardResult, currentMonth: Month): POSuggestion | null
```
Algorithm:
1. Find first month with negative balance (stockout)
2. Calculate shortfall units (absolute value of negative balance)
3. Calculate pallets needed: `ceil(shortfall / packingPerPallet)`
4. Determine container config:
   - ≤22 pallets → 22-pallet container
   - ≤44 pallets → 44-pallet container
   - >44 pallets → "mixed" (multiple containers)
5. Calculate PO value: `pallets × packing × exwPrice`
6. Set urgency: "critical" if stockout within 2 months, else "warning"

**Constants:**
- `PO_LEAD_TIME_MONTHS = 5` - Fixed lead time for purchase orders
- `statusColors` - Tailwind CSS classes for status badges
- `statusIcon` - Emoji indicators (🟢🟡🟠🔴)

---

## 3. Excel Export Utilities (`export.ts`)

**Purpose:** Client-side Excel generation for various data exports

### Functions:

**Generic Export:**
```typescript
exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = "Sheet1")
```
- Converts JSON array to Excel worksheet
- Single sheet export

**Rollforward Export:**
```typescript
exportRollforward(results: RfResult[], filename: string)
```
- Creates one sheet per product
- Rows: Product metadata + monthly metrics (Stock, +InPO, -Forecast, =Balance, Status)
- Columns: Metric name + one column per month
- Sheet names truncated to 31 chars (Excel limit)

**Forecast Export:**
```typescript
exportForecasts(rows: ForecastRow[], months: string[], filename: string)
```
- Single sheet with customer/product/region + monthly columns
- Auto-calculates row totals
- Auto-width columns based on content length

**Helper:**
- `fmtMonth(ym)` - Converts "2026-04" to "Apr 2026" using month name array

**Dependencies:** `xlsx` (SheetJS)

---

## 4. PO-Specific Export (`export-po.ts`)

**Purpose:** Excel exports for PO suggestion and PO list pages

### Functions:

**PO Suggestions Export:**
```typescript
exportPOSuggestions(data: POSuggestion[], filename: string)
```
- Columns: Product, SKU, First Stockout, Shortfall, Pallets Needed, Container, PO Value, Urgency
- Dynamic import of xlsx to avoid SSR issues
- Fixed column widths for readability
- Urgency formatted as "CRITICAL — Order Now" or "Warning — Plan Soon"

**PO List Export:**
```typescript
exportPOList(data: POListRow[], filename: string)
```
- Columns: PO#, Status, Order Date, Arrival Month, Items, Total Pallets, PO Value
- Wide "Items" column (50 chars) for summary text

**Helpers:**
- `monthLabel(ym)` - Converts "2026-04" to "Apr 2026"
- `containerLabel(config)` - Formats container config (22/44/"mixed")

**Pattern:** Dynamic imports to prevent SSR hydration issues in Next.js

---

## 5. Master Data Sheet Import (`master-data-sheet.ts`)

**Purpose:** Excel file parsing and data extraction utilities

### Functions:

**Sheet Reading:**
```typescript
readSheetRows(file: File): Promise<SheetRow[]>
```
- Reads first sheet from Excel file
- Returns array of objects (one per row)
- Uses `defval: ""` and `raw: false` for consistent string output

**Sheet Export:**
```typescript
exportSheet({ rows, columns, filename, sheetName })
```
- Converts structured data to Excel with defined columns
- Auto-calculates column widths (min 10 chars)
- Uses array-of-arrays format for precise control

**Data Extraction:**
```typescript
readSheetText(row: SheetRow, aliases: string[]): string
```
- Searches row for any matching column alias (case-insensitive, normalized)
- Returns trimmed string value

```typescript
readSheetNumber(row: SheetRow, aliases: string[], fallback = 0): number
```
- Extracts numeric value using aliases
- Returns fallback if not found or not a valid number

**Helper:**
- `normalizeHeader(value)` - Lowercase + remove non-alphanumeric chars for fuzzy matching

**Pattern:** Alias-based column matching for flexible Excel imports (handles variations in column names)

---

## 6. Stock Adjustments Ledger (`stock-adjustments.ts`)

**Purpose:** Audit trail for all stock changes

### Function:
```typescript
logStockAdjustment(input: StockAdjustmentInput): Promise<void>
```

**Input Fields:**
- `stockId` - Reference to stock record (nullable)
- `productId` - Product being adjusted
- `lotNumber` / `expiryDate` - Lot tracking info (nullable)
- `changeType` - "create" | "update" | "delete" | "receipt"
- `reason` - Human-readable explanation (nullable)
- `qtyDelta` - Change amount (positive or negative)
- `previousQty` / `nextQty` - Before/after quantities (nullable)
- `referenceType` / `referenceId` - Link to related entity (e.g., PO) (nullable)

**Pattern:** Immutable audit log - inserts only, no updates/deletes

**Use Cases:**
- Track stock receipts from POs
- Log manual adjustments
- Record stock deletions
- Maintain compliance audit trail

---

## 7. Database Initialization (`init.ts`)

**Purpose:** Auto-run schema migrations on app startup

### Function:
```typescript
initDb(): Promise<void>
```

**Behavior:**
- Singleton pattern with `hasInitialized` flag
- Promise caching to prevent concurrent migrations
- Inline schema (avoids TypeScript `?raw` import issues)
- Splits SQL by semicolons and executes sequentially
- Logs success/failure (suppressed during build phase)

**Schema Applied:**
- 7 tables: app_config, products, customers, forecasts, stock, stock_adjustments, purchase_orders, po_items
- 10 indexes for query optimization
- Foreign key constraints with CASCADE/SET NULL

**Integration:** Import in Next.js layout or API route that runs on every request

**Error Handling:** Resets `initPromise` on failure to allow retry

---

## 8. Session Management (`session.ts`)

**Purpose:** PIN-based authentication for app access

### Functions:

**Get PIN Hash:**
```typescript
getPinHashRecord(): Promise<{ value: string } | null>
```
- Queries `app_config` table for `pin_hash` key

**Validate Session Value:**
```typescript
hasValidSessionValue(sessionValue?: string | null): Promise<boolean>
```
- Compares provided value against stored hash
- Returns false if no value or no hash in DB

**Validate Request:**
```typescript
hasValidRequestSession(req: NextRequest): Promise<boolean>
```
- Extracts `session_pin` cookie from Next.js request
- Validates against stored hash

**Pattern:** Cookie-based session with bcrypt hash comparison (hash stored in DB, not in code)

**Security:** PIN hash stored in database, not hardcoded

---

## 9. Shared Utilities (`utils.ts`)

**Purpose:** Common UI utility functions

### Function:
```typescript
cn(...inputs: ClassValue[]): string
```

**Purpose:** Merge Tailwind CSS classes with conflict resolution

**Implementation:**
- Uses `clsx` to combine class names
- Uses `twMerge` to resolve Tailwind conflicts (e.g., `px-2 px-4` → `px-4`)

**Dependencies:** `clsx`, `tailwind-merge`

**Usage Pattern:** Common in shadcn/ui components for conditional styling

---

## 10. Database Schema (`schema.sql`)

**Purpose:** Reference schema definition (not executed directly)

**Tables:**
1. **app_config** - Key-value store for PIN hash and settings
2. **products** - Master product catalog (name, SKU, EXW price, packing)
3. **customers** - Hospital/customer list with region
4. **forecasts** - Monthly demand forecasts (customer × product × month)
5. **stock** - Physical inventory with lot numbers and expiry dates
6. **stock_adjustments** - Immutable audit log of all stock changes
7. **purchase_orders** - PO headers (number, status, dates)
8. **po_items** - PO line items (product × pallets)

**Indexes:**
- Composite indexes on forecasts (product+month, customer, month)
- Single indexes on stock (product), stock_adjustments (product+created, stock_id)
- PO indexes (po_id, product_id, arrival_month, status)

**Constraints:**
- Foreign keys with CASCADE (po_items) and SET NULL (stock_adjustments)
- UNIQUE constraints on SKU, PO number, forecast combinations

---

## 11. Seed Script (`scripts/seed-products.ts`)

**Purpose:** Populate database with initial Exeol product catalog

**Execution:** `npx tsx scripts/seed-products.ts`

**Data Seeded:**
- 25 Exeol pharmaceutical products (disinfectants, sanitizers, wipes)
- 10 Vietnamese hospital customers (regions: MB, MN, MN-South)

**Product Data:**
- Name, SKU, EXW price (EUR), packing per pallet
- Examples: Exeol OPA 5L (€15.21, 96/pallet), Hand Sanitizer 500mL (€4.30, 120/pallet)

**Pattern:**
- Inline schema execution (same as init.ts)
- `INSERT OR IGNORE` for idempotency
- Console logging for each insert

**Environment:** Reads `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, falls back to local.db

---

## Code Organization Patterns

### 1. Database Access Pattern
- Singleton client with lazy initialization
- Parameterized queries throughout (SQL injection prevention)
- Generic type support for type-safe results
- Separation of execute (no return) vs query (with return)

### 2. Export Pattern
- Client-side only (dynamic imports to avoid SSR)
- Consistent filename parameter (caller provides)
- Auto-width columns based on content
- Type-safe interfaces for export data

### 3. Business Logic Pattern
- Pure functions for calculations (no side effects)
- Type aliases for domain clarity (Units, Pallets, Month)
- Constants for business rules (lead time, thresholds)
- Null returns for "no action needed" cases

### 4. Audit Pattern
- Immutable logs (insert-only)
- Nullable references (survives parent deletion)
- Timestamp on every record
- Rich metadata (before/after, reason, reference)

### 5. Initialization Pattern
- Singleton with promise caching
- Inline SQL to avoid build issues
- Idempotent (CREATE IF NOT EXISTS)
- Error recovery (reset promise on failure)

---

## Key Dependencies

### Production:
- `@libsql/client` (0.17.0) - Turso database client
- `xlsx` (0.18.5) - Excel file generation/parsing
- `bcryptjs` (3.0.3) - PIN hash generation/comparison
- `clsx` (2.1.1) + `tailwind-merge` (3.5.0) - CSS class utilities
- `next` (16.2.0) + `react` (19.2.4) - Framework

### Development:
- `tsx` (4.21.0) - TypeScript execution for scripts
- `typescript` (5.x) - Type checking

---

## Business Logic Algorithms

### 1. Rollforward Calculation (Implied from types)
For each product, for each of 8 months:
1. Start with current stock
2. Add incoming PO units for that month
3. Subtract forecast units for that month
4. Calculate balance = stock + incoming - forecast
5. Determine status based on balance vs packing thresholds

### 2. PO Suggestion Algorithm
```
Input: Rollforward result with 8-month projections
Output: PO suggestion or null

1. Find first month where balance < 0
2. If no stockout found → return null
3. Calculate shortfall = abs(negative balance)
4. Calculate pallets = ceil(shortfall / packing)
5. Determine container:
   - If pallets ≤ 22 → 22-pallet container
   - If pallets ≤ 44 → 44-pallet container
   - If pallets > 44 → mixed containers
6. Calculate value = pallets × packing × exwPrice
7. Set urgency:
   - If stockout ≤ 2 months away → critical
   - Else → warning
8. Return suggestion object
```

### 3. Status Determination
```
Input: Balance (units), Packing per pallet
Output: Status level

if balance < 0:
  return "stockout"
elif balance < packing × 1:
  return "critical"  # Less than 1 pallet
elif balance < packing × 3:
  return "low"       # Less than 3 pallets
else:
  return "ok"        # 3+ pallets available
```

---

## Database Query Patterns

### Common Patterns Observed:
1. **Parameterized queries** - All queries use `?` placeholders with args array
2. **Type-safe results** - Generic `queryAll<T>` and `queryOne<T>` for typed returns
3. **Null handling** - `queryOne` returns null if no results (not undefined)
4. **Transaction support** - Client supports transactions (not used in lib files)

### Index Strategy:
- Composite indexes for common query patterns (product+month)
- Covering indexes to avoid table lookups
- Foreign key indexes for join performance
- Status/date indexes for filtering

---

## Security Considerations

### Implemented:
- Parameterized queries (SQL injection prevention)
- PIN hash storage (bcryptjs)
- Cookie-based session validation
- Environment variable configuration (no hardcoded credentials)

### Not Implemented (by design):
- User accounts (single PIN for all users)
- Role-based access control
- API rate limiting
- CSRF protection (would need tokens)

---

## Performance Considerations

### Optimizations:
- Singleton database client (connection pooling)
- Indexed queries for common access patterns
- Client-side Excel generation (offloads server)
- Promise caching for initialization
- Auto-width calculation (better UX, minimal cost)

### Potential Bottlenecks:
- Large Excel exports (client-side memory)
- Rollforward calculation for many products (N × 8 months)
- Stock adjustment queries without date range limits

---

## Testing Gaps

No test files found in lib/ or scripts/. Recommended test coverage:
- Unit tests for calculation functions (getStatus, suggestPO, addMonths)
- Integration tests for database utilities
- Mock tests for Excel export functions
- Seed script validation

---

## Unresolved Questions

1. **Rollforward calculation location** - Logic implied by types but implementation not in lib/
2. **Transaction handling** - No explicit transaction wrappers in db.ts
3. **Error handling strategy** - Most functions don't catch/transform errors
4. **Caching strategy** - No caching layer for frequently accessed data
5. **Migration versioning** - No version tracking for schema changes

---

## File Inventory Summary

| File | LOC | Purpose | Key Exports |
|------|-----|---------|-------------|
| db.ts | 60 | Database client | getDbClient, executeSql, queryAll, queryOne, runMigrations |
| calculations.ts | 155 | Business logic | Types, getStatus, addMonths, formatMonth, suggestPO |
| export.ts | 120 | Excel exports | exportToExcel, exportRollforward, exportForecasts |
| export-po.ts | 95 | PO exports | exportPOSuggestions, exportPOList |
| master-data-sheet.ts | 69 | Excel imports | readSheetRows, exportSheet, readSheetText, readSheetNumber |
| stock-adjustments.ts | 38 | Audit logging | logStockAdjustment |
| init.ts | 113 | Schema init | initDb |
| session.ts | 19 | Auth | getPinHashRecord, hasValidSessionValue, hasValidRequestSession |
| utils.ts | 6 | UI utilities | cn |
| schema.sql | 96 | Schema reference | (SQL only) |
| seed-products.ts | 105 | Data seeding | main() |

**Total:** ~876 lines of TypeScript/SQL across 11 files

---

## Recommendations

1. **Add unit tests** for calculation functions (high business value)
2. **Implement transaction wrapper** in db.ts for multi-step operations
3. **Add error handling** middleware for consistent error responses
4. **Version migrations** using a migrations table with timestamps
5. **Add caching layer** for product/customer master data
6. **Document rollforward calculation** implementation (not found in lib/)
7. **Add input validation** for Excel imports (schema validation)
8. **Implement rate limiting** for API endpoints
9. **Add logging** for audit trail queries
10. **Consider batch operations** for large forecast imports

---

**Report Generated:** 2026-05-04  
**Agent:** Explore (aad31106f30e93a69)  
**Files Analyzed:** 11 TypeScript files, 1 SQL schema, 1 seed script
