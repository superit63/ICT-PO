# Codebase Summary

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-04  
**Total LOC:** ~8,200 lines (excluding node_modules, .next)

---

## Directory Structure Overview

```
ICT-PO/
├── sale-stock-po-app/          # Main Next.js application
│   ├── app/                    # Next.js 16 App Router (29 files, 4,655 LOC)
│   ├── components/             # React components (19 files, 2,735 LOC)
│   ├── lib/                    # Utilities & business logic (9 files, 667 LOC)
│   ├── scripts/                # Database seeding (1 file, 104 LOC)
│   ├── public/                 # Static assets
│   └── [config files]          # TypeScript, Tailwind, Next.js configs
├── docs/                       # Project documentation (4 files, 281 LOC)
└── plans/                      # Implementation plans (12 files, 3,703 LOC)
```

---

## App Directory Structure (Next.js 16 App Router)

**Total:** 29 files, 4,655 LOC

### Route Groups

#### Public Routes
```
app/
├── layout.tsx                  # Root layout (fonts, metadata, theme provider)
├── globals.css                 # Global styles, CSS variables, Tailwind imports
├── login/
│   └── page.tsx               # PIN login page
└── setup/
    └── page.tsx               # First-time PIN setup
```

#### Protected Routes (PIN Required)
```
app/(app)/
├── layout.tsx                  # Auth check, DB init, sidebar layout
├── page.tsx                    # Dashboard (status cards, product table)
├── forecasts/
│   └── page.tsx               # Forecast entry grid
├── rollforward/
│   └── page.tsx               # Stock rollforward timeline
├── po-suggest/
│   └── page.tsx               # PO suggestion engine
├── po/
│   ├── page.tsx               # PO list (status tabs)
│   ├── new/
│   │   └── page.tsx           # Create new PO
│   └── [id]/
│       └── page.tsx           # PO detail & Mark Received
├── stock/
│   └── page.tsx               # Stock control workspace
├── master-data/
│   └── page.tsx               # Product & customer management
└── settings/
    └── page.tsx               # Settings & data backup
```

### API Routes

**Total:** 15 endpoints, 512 LOC

```
app/api/
├── init/
│   └── route.ts               # Database auto-migration
├── auth/
│   ├── setup/route.ts         # PIN setup (POST)
│   ├── verify/route.ts        # PIN verification (POST)
│   └── reset-pin/route.ts     # PIN reset (POST)
├── products/
│   ├── route.ts               # List, create, bulk import (GET, POST)
│   └── [id]/route.ts          # Get, update, delete (GET, PUT, DELETE)
├── customers/
│   ├── route.ts               # List, create, bulk import (GET, POST)
│   └── [id]/route.ts          # Get, update, delete (GET, PUT, DELETE)
├── forecasts/
│   └── route.ts               # Query, upsert (GET, POST)
├── stock/
│   ├── route.ts               # List, create (GET, POST)
│   ├── [id]/route.ts          # Update, delete (PUT, DELETE)
│   └── adjustments/route.ts   # Adjustment history (GET)
├── po/
│   ├── route.ts               # List, create (GET, POST)
│   └── [id]/route.ts          # Get, update, delete, receive (GET, PUT, DELETE, PATCH)
└── rollforward/
    └── route.ts               # Calculate rollforward (GET)
```

**API Patterns:**
- All routes check PIN session cookie
- Parameterized SQL queries (SQL injection prevention)
- JSON request/response bodies
- Error handling with try-catch
- HTTP status codes (200, 201, 400, 401, 404, 500)

---

## Components Directory

**Total:** 19 files, 2,735 LOC

### UI Primitives (shadcn/ui based)
```
components/ui/
├── button.tsx                  # Button with variants (default, outline, ghost, etc.)
├── card.tsx                    # Card compound component (Header, Content, Footer)
├── dialog.tsx                  # Modal dialog with portal rendering
├── input.tsx                   # Text input with validation states
├── label.tsx                   # Form label with accessibility
├── select.tsx                  # Dropdown select with keyboard nav
├── table.tsx                   # Table compound component (Header, Body, Row, Cell)
├── tabs.tsx                    # Tabs with variants (default, line)
├── badge.tsx                   # Badge with status variants
├── skeleton.tsx                # Loading skeleton with pulse animation
└── sonner.tsx                  # Toast notification wrapper
```

**UI Component Characteristics:**
- Built on @base-ui/react primitives
- CVA (class-variance-authority) for variant management
- Tailwind CSS styling with design tokens
- TypeScript with strict typing
- Accessible (ARIA labels, keyboard navigation)

### Layout Components
```
components/layout/
├── sidebar.tsx                 # Main navigation sidebar (desktop + mobile)
└── nav.tsx                     # Alternative horizontal nav (legacy)
```

**Navigation Features:**
- 8 main routes (Dashboard, Stock, Master Data, Forecasts, Rollforward, PO Suggest, PO, Settings)
- Active state detection
- Mobile responsive (drawer on small screens)
- Logout functionality

### Feature Components

#### Master Data Domain
```
components/master-data/
├── master-data-workspace.tsx   # Parent workspace with tabs
├── products-manager.tsx        # Product CRUD + import/export
└── customers-manager.tsx       # Customer CRUD + import/export
```

**Patterns:**
- Client components ("use client")
- Local state management (useState)
- Deferred search (useDeferredValue)
- Excel import with flexible column mapping
- Toast notifications for feedback

#### Stock Domain
```
components/stock/
├── stock-control-workspace.tsx # Stock lot management
└── stock-adjustment-history.tsx # Audit trail display
```

**Features:**
- Lot number and expiry date tracking
- Color-coded expiry status
- Manual adjustments with reason
- Real-time metrics calculation

#### Forecasts Domain
```
components/forecasts/
└── forecast-entry-table.tsx    # Editable forecast grid
```

**Complexity:**
- Nested table with expandable rows
- Debounced cell editing (500ms)
- Real-time totals (row, column, grand)
- Performance optimized (deferred values, memoization)

---

## Library Directory

**Total:** 9 files, 667 LOC

### Core Utilities

```
lib/
├── db.ts                       # Turso database client singleton (60 LOC)
│   ├── getDbClient()          # Singleton client with lazy init
│   ├── executeSql()           # Execute SQL without return
│   ├── queryAll<T>()          # Query with typed results
│   ├── queryOne<T>()          # Query single row or null
│   └── runMigrations()        # Execute schema migrations
│
├── init.ts                     # Database auto-migration (113 LOC)
│   └── initDb()               # Singleton init with promise caching
│
├── session.ts                  # Authentication utilities (19 LOC)
│   ├── getPinHashRecord()     # Get PIN hash from DB
│   ├── hasValidSessionValue() # Validate session value
│   └── hasValidRequestSession() # Validate Next.js request
│
├── schema.sql                  # Database schema reference (96 LOC)
│   ├── 7 tables (app_config, products, customers, forecasts, stock, stock_adjustments, purchase_orders, po_items)
│   └── 10 indexes for query optimization
│
└── utils.ts                    # UI utilities (6 LOC)
    └── cn()                   # Tailwind class merger (clsx + tailwind-merge)
```

### Business Logic

```
lib/
├── calculations.ts             # Rollforward & PO algorithms (155 LOC)
│   ├── Types: Month, Units, Pallets, StockStatus, RollforwardEntry, POSuggestion
│   ├── getStatus()            # Calculate status from balance
│   ├── addMonths()            # Date arithmetic for YYYY-MM
│   ├── formatMonth()          # Format "2026-04" → "Apr 2026"
│   ├── getArrivalMonth()      # Calculate arrival (order + 5 months)
│   └── suggestPO()            # PO suggestion algorithm
│
└── stock-adjustments.ts        # Stock audit logging (38 LOC)
    └── logStockAdjustment()   # Insert audit record
```

**Key Algorithms:**

**Status Calculation:**
```typescript
if (balance < 0) return "stockout"
if (balance < packing × 1) return "critical"
if (balance < packing × 3) return "low"
return "ok"
```

**PO Suggestion:**
```typescript
1. Find first month with balance < 0
2. Calculate shortfall = abs(negative balance)
3. Calculate pallets = ceil(shortfall / packing)
4. Determine container (22/44/mixed)
5. Calculate value = pallets × packing × exwPrice
6. Set urgency (critical if ≤2 months, else warning)
```

### Export Utilities

```
lib/
├── export.ts                   # Generic Excel exports (120 LOC)
│   ├── exportToExcel()        # Generic JSON to Excel
│   ├── exportRollforward()    # Rollforward with monthly columns
│   └── exportForecasts()      # Forecast grid with totals
│
├── export-po.ts                # PO-specific exports (95 LOC)
│   ├── exportPOSuggestions()  # PO suggestion list
│   └── exportPOList()         # PO management list
│
└── master-data-sheet.ts        # Excel import utilities (69 LOC)
    ├── readSheetRows()        # Parse Excel to JSON
    ├── exportSheet()          # JSON to Excel with columns
    ├── readSheetText()        # Extract text with aliases
    └── readSheetNumber()      # Extract number with fallback
```

**Export Patterns:**
- Client-side only (dynamic imports)
- Auto-width columns
- Formatted headers
- Type-safe interfaces

---

## Scripts Directory

```
scripts/
└── seed-products.ts            # Database seeding (104 LOC)
    ├── 25 Exeol pharmaceutical products
    └── 10 Vietnamese hospital customers
```

**Execution:** `npx tsx scripts/seed-products.ts`

---

## Configuration Files

### TypeScript Configuration
```
tsconfig.json
├── Target: ES2017
├── Module: esnext with bundler resolution
├── Strict mode: enabled
├── Path aliases: @/* → project root
└── Incremental builds: enabled
```

### Next.js Configuration
```
next.config.ts
├── Turbopack: enabled (Next.js 16 bundler)
└── Allowed dev origins: 100.86.123.127 (Tailscale/VPN)
```

### shadcn/ui Configuration
```
components.json
├── Style: base-nova
├── RSC: enabled (React Server Components)
├── Base color: neutral
├── CSS variables: enabled
└── Icon library: lucide
```

### Vercel Configuration
```
vercel.json
├── Framework: Next.js
├── Region: fra1 (Frankfurt)
├── Runtime: Node.js 22.x
├── Memory: 512 MB
├── Timeout: 10 seconds
└── Headers: Cache-Control, X-Content-Type-Options
```

### Tailwind Configuration
```
globals.css
├── CSS variables (OKLCH color space)
├── Design tokens (primary, secondary, destructive, etc.)
├── Border radius scale
└── Sidebar theme overrides
```

---

## Database Schema

**Tables:** 7  
**Indexes:** 10  
**Foreign Keys:** 3

### Schema Overview

```sql
app_config
├── key (TEXT PRIMARY KEY)
└── value (TEXT)
-- Stores PIN hash

products
├── id (INTEGER PRIMARY KEY)
├── name (TEXT NOT NULL)
├── sku (TEXT UNIQUE NOT NULL)
├── exw_price_eur (REAL NOT NULL)
└── packing_per_pallet (INTEGER NOT NULL)

customers
├── id (INTEGER PRIMARY KEY)
├── name (TEXT NOT NULL)
├── region (TEXT)
└── notes (TEXT)

forecasts
├── id (INTEGER PRIMARY KEY)
├── customer_id (INTEGER → customers.id)
├── product_id (INTEGER → products.id)
├── year_month (TEXT)
├── qty_units (INTEGER)
└── UNIQUE(customer_id, product_id, year_month)

stock
├── id (INTEGER PRIMARY KEY)
├── product_id (INTEGER → products.id)
├── lot_number (TEXT)
├── expiry_date (TEXT)
└── qty_units (INTEGER NOT NULL)

stock_adjustments
├── id (INTEGER PRIMARY KEY)
├── stock_id (INTEGER → stock.id SET NULL)
├── product_id (INTEGER → products.id)
├── lot_number (TEXT)
├── expiry_date (TEXT)
├── change_type (TEXT)
├── reason (TEXT)
├── qty_delta (INTEGER)
├── previous_qty (INTEGER)
├── next_qty (INTEGER)
├── reference_type (TEXT)
├── reference_id (INTEGER)
└── created_at (TEXT DEFAULT CURRENT_TIMESTAMP)

purchase_orders
├── id (INTEGER PRIMARY KEY)
├── po_number (TEXT UNIQUE NOT NULL)
├── status (TEXT NOT NULL)
├── order_date (TEXT NOT NULL)
└── arrival_month (TEXT NOT NULL)

po_items
├── id (INTEGER PRIMARY KEY)
├── po_id (INTEGER → purchase_orders.id CASCADE)
├── product_id (INTEGER → products.id)
└── qty_pallets (INTEGER NOT NULL)
```

**Index Strategy:**
- Composite indexes on forecasts (product+month, customer, month)
- Single indexes on stock (product), stock_adjustments (product+created, stock_id)
- PO indexes (po_id, product_id, arrival_month, status)

---

## Code Organization Patterns

### 1. Component Architecture
- **Server Components:** Layouts, static cards (Card, Badge, Skeleton)
- **Client Components:** All interactive UI (forms, tables, dialogs)
- **Compound Components:** Card, Dialog, Table, Select (flexible composition)

### 2. State Management
- **Local State:** useState for forms, UI toggles, loading flags
- **Optimized State:** useDeferredValue for search, useCallback for stable refs
- **No Global State:** No Redux/Zustand/Context (data fetched per page)

### 3. Data Fetching
- **Pattern:** Client-side fetch in useEffect
- **API Communication:** REST endpoints with JSON payloads
- **Error Handling:** Toast notifications for user feedback
- **Parallel Fetching:** Promise.all for multiple endpoints

### 4. Database Access
- **Singleton Client:** Lazy initialization with connection pooling
- **Parameterized Queries:** SQL injection prevention throughout
- **Type Safety:** Generic queryAll<T> and queryOne<T>
- **Transaction Support:** Available but not used in current code

### 5. Business Logic
- **Pure Functions:** Calculations with no side effects
- **Type Aliases:** Units, Pallets, Month for domain clarity
- **Constants:** Business rules (lead time, thresholds)
- **Null Returns:** "No action needed" cases return null

### 6. Export Pattern
- **Client-Side Only:** Dynamic imports to avoid SSR issues
- **Consistent Filenames:** Caller provides filename parameter
- **Auto-Width Columns:** Based on content length
- **Type-Safe Interfaces:** Export data interfaces

### 7. Audit Pattern
- **Immutable Logs:** Insert-only (no updates/deletes)
- **Nullable References:** Survives parent deletion
- **Rich Metadata:** Before/after, reason, reference
- **Timestamp:** Every record

---

## Key Dependencies

### Production (15 packages)
```json
{
  "@base-ui/react": "^1.3.0",        // UI primitives
  "@libsql/client": "^0.17.0",       // Turso database client
  "bcryptjs": "^3.0.3",              // PIN hashing
  "class-variance-authority": "^0.7.1", // Variant management
  "clsx": "^2.1.1",                  // Class merging
  "lucide-react": "^0.577.0",        // Icons
  "next": "16.2.0",                  // Framework
  "next-themes": "^0.4.6",           // Theme management
  "react": "19.2.4",                 // React library
  "react-dom": "19.2.4",             // React DOM
  "shadcn": "^4.0.8",                // shadcn/ui CLI
  "sonner": "^2.0.7",                // Toast notifications
  "tailwind-merge": "^3.5.0",        // Tailwind class deduplication
  "tw-animate-css": "^1.4.0",        // Tailwind animations
  "xlsx": "^0.18.5"                  // Excel generation
}
```

### Development (10 packages)
```json
{
  "@tailwindcss/postcss": "^4",      // Tailwind PostCSS plugin
  "@types/bcryptjs": "^2.4.6",       // TypeScript types
  "@types/node": "^20",              // Node.js types
  "@types/react": "^19",             // React types
  "@types/react-dom": "^19",         // React DOM types
  "eslint": "^9",                    // Linter
  "eslint-config-next": "16.2.0",    // Next.js ESLint config
  "tailwindcss": "^4",               // Tailwind CSS
  "tsx": "^4.21.0",                  // TypeScript execution
  "typescript": "^5"                 // TypeScript compiler
}
```

---

## File Naming Conventions

### TypeScript Files
- **Components:** PascalCase (e.g., `ProductsManager.tsx`)
- **Utilities:** kebab-case (e.g., `master-data-sheet.ts`)
- **Routes:** Next.js conventions (`page.tsx`, `route.ts`, `layout.tsx`)

### Directories
- **kebab-case:** All directories use kebab-case (e.g., `master-data/`, `po-suggest/`)
- **Route Groups:** Parentheses for layout grouping (e.g., `(app)/`)

### CSS/Config Files
- **kebab-case:** All config files (e.g., `next.config.ts`, `components.json`)

---

## Entry Points

### Application Entry
```
app/layout.tsx → Root layout (fonts, theme provider)
  ↓
app/(app)/layout.tsx → Auth check, DB init, sidebar
  ↓
app/(app)/page.tsx → Dashboard (default route)
```

### API Entry
```
app/api/init/route.ts → Auto-migration on first request
  ↓
lib/init.ts → Schema execution
  ↓
lib/db.ts → Database client
```

### Database Entry
```
lib/db.ts → getDbClient()
  ↓
@libsql/client → Turso connection
  ↓
TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (env vars)
```

---

## Main Data Flows

### 1. Forecast Entry Flow
```
User edits cell → DebouncedCell (500ms) → onSave callback
  ↓
Parent page → POST /api/forecasts (upsert)
  ↓
Database → forecasts table
  ↓
Refresh data → Re-render with new totals
```

### 2. Rollforward Calculation Flow
```
User visits /rollforward → GET /api/rollforward
  ↓
Server calculates: Stock + Incoming PO - Forecast
  ↓
Returns RollforwardResult[] (8 months per product)
  ↓
Client renders color-coded grid
```

### 3. PO Suggestion Flow
```
User visits /po-suggest → GET /api/rollforward
  ↓
Client runs suggestPO() for each product
  ↓
Filters products with stockouts
  ↓
Sorts by urgency (critical first)
  ↓
Renders suggestion cards with "Create PO" button
```

### 4. PO Receipt Flow
```
User clicks "Mark Received" → Dialog opens
  ↓
User enters lot/expiry per line item
  ↓
PATCH /api/po/[id] (status: "received", lot data)
  ↓
Server creates stock records for each line item
  ↓
Server logs stock_adjustments (type: "receipt")
  ↓
Refresh PO list and stock data
```

---

## Testing Strategy

**Current State:** No automated tests in v1.0

**Manual Testing:**
- Feature testing via browser
- API testing via Postman/curl
- Database testing via Turso CLI

**Recommended Future Tests:**
- Unit tests for calculation functions (getStatus, suggestPO, addMonths)
- Integration tests for API endpoints
- Component tests for critical user flows (React Testing Library)
- E2E tests for complete workflows (Playwright)

---

## Performance Considerations

### Optimizations
- Singleton database client (connection pooling)
- Indexed queries for common access patterns
- Client-side Excel generation (offloads server)
- Promise caching for initialization
- Deferred search queries (prevents blocking)
- Debounced cell edits (reduces API calls)
- Expandable rows (reduces initial DOM size)

### Potential Bottlenecks
- Large Excel exports (client-side memory)
- Rollforward calculation for many products (N × 8 months)
- Stock adjustment queries without date range limits
- Vercel cold starts (free tier limitation)

---

## Security Measures

### Implemented
- Parameterized queries (SQL injection prevention)
- bcrypt PIN hashing (salt rounds)
- httpOnly session cookies
- Environment variable configuration (no hardcoded credentials)
- Cache-Control headers (no caching of sensitive data)
- X-Content-Type-Options header (MIME sniffing prevention)

### Not Implemented (by design)
- Multi-user accounts
- Role-based access control
- API rate limiting
- CSRF protection (single-user, same-origin only)
- Encryption at rest (relies on Turso security)

---

## Documentation Coverage

### Excellent
- Setup guide (SETUP.md)
- User onboarding (onboarding-guide.md)
- System architecture (system-architecture.md)
- Project roadmap (project-roadmap.md)
- Changelog (project-changelog.md)

### Adequate
- README.md (standard Next.js boilerplate)
- AGENTS.md (Next.js 16 warning)
- CLAUDE.md (references AGENTS.md)

### Missing
- API endpoint documentation
- Component usage guide
- Testing documentation
- Deployment troubleshooting
- Environment variables example (.env.local.example)
- Contributing guidelines
- Security best practices

---

## Unresolved Questions

1. **Rollforward Implementation:** Logic implied by types but implementation not found in lib/ (likely in API route)
2. **Transaction Handling:** No explicit transaction wrappers in db.ts
3. **Error Handling Strategy:** Most functions don't catch/transform errors
4. **Caching Strategy:** No caching layer for frequently accessed data
5. **Migration Versioning:** No version tracking for schema changes
6. **Theme Toggle:** next-themes installed but no UI toggle found
7. **Error Boundaries:** No error boundaries for component error handling
8. **Code Splitting:** Are feature components code-split by route?

---

**Report Generated:** 2026-05-04  
**Files Analyzed:** 60+ TypeScript/TSX files, 7 configuration files, 1 SQL schema
