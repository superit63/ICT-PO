# React Components & UI Architecture Scout Report

**Project:** sale-stock-po-app  
**Date:** 2026-05-04  
**Scope:** Component inventory, architecture patterns, and UI system analysis

---

## Executive Summary

The sale-stock-po-app uses a modern React architecture built on Next.js 16.2 with a comprehensive shadcn/ui-based design system. The component structure follows a clear separation between reusable UI primitives, layout components, and feature-specific business logic components. All interactive components are client-side rendered with "use client" directives.

**Key Metrics:**
- 11 UI primitive components (shadcn/ui based)
- 2 layout components (navigation)
- 8 feature-specific components across 3 domains
- 100% client components for interactivity
- Base UI React primitives (@base-ui/react v1.3.0)
- Tailwind CSS with custom design tokens

---

## Component Inventory

### 1. UI Primitives (`components/ui/`)

Reusable, framework-agnostic UI components built on @base-ui/react primitives.

#### **Button** (`button.tsx`)
- **Type:** Client component
- **Base:** @base-ui/react Button primitive
- **Variants:** default, outline, secondary, ghost, destructive, link
- **Sizes:** default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg
- **Styling:** CVA (class-variance-authority) for variant management
- **Features:** Focus rings, active states, disabled states, icon support

#### **Card** (`card.tsx`)
- **Type:** Server-compatible component (no "use client")
- **Subcomponents:** Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter
- **Sizes:** default, sm
- **Pattern:** Compound component with data-slot attributes
- **Usage:** Primary container for feature sections

#### **Dialog** (`dialog.tsx`)
- **Type:** Client component
- **Base:** @base-ui/react Dialog primitive
- **Subcomponents:** Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- **Features:** Portal rendering, backdrop blur, close button toggle, animations
- **Accessibility:** ARIA-compliant with proper labeling

#### **Input** (`input.tsx`)
- **Type:** Client component
- **Base:** @base-ui/react Input primitive
- **Features:** Focus states, validation states (aria-invalid), file input styling
- **Styling:** Consistent height (h-10), rounded-xl borders, ring focus states

#### **Label** (`label.tsx`)
- **Type:** Client component
- **Features:** Peer-disabled support, group-disabled states
- **Pattern:** Semantic form labeling with accessibility

#### **Select** (`select.tsx`)
- **Type:** Client component
- **Base:** @base-ui/react Select primitive
- **Subcomponents:** Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton
- **Sizes:** default, sm
- **Features:** Portal positioning, scroll indicators, keyboard navigation, check indicators

#### **Table** (`table.tsx`)
- **Type:** Client component
- **Subcomponents:** Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption
- **Features:** Overflow container, hover states, selection states
- **Pattern:** Semantic HTML table with enhanced styling

#### **Tabs** (`tabs.tsx`)
- **Type:** Client component
- **Base:** @base-ui/react Tabs primitive
- **Subcomponents:** Tabs, TabsList, TabsTrigger, TabsContent
- **Variants:** default, line
- **Orientations:** horizontal, vertical
- **Features:** Active indicators, keyboard navigation, animations

#### **Badge** (`badge.tsx`)
- **Type:** Server-compatible component
- **Base:** @base-ui/react useRender hook
- **Variants:** default, secondary, destructive, outline, ghost, link
- **Features:** Icon support (inline-start, inline-end), focus states
- **Styling:** Compact design with tracking and rounded borders

#### **Skeleton** (`skeleton.tsx`)
- **Type:** Server-compatible component
- **Features:** Pulse animation, muted background
- **Usage:** Loading states throughout the app

#### **Toaster** (`sonner.tsx`)
- **Type:** Client component
- **Base:** sonner library
- **Features:** Theme integration (next-themes), custom icons (lucide-react), CSS variable styling
- **Icons:** CircleCheck, Info, TriangleAlert, OctagonX, Loader2

---

### 2. Layout Components (`components/layout/`)

#### **Sidebar** (`sidebar.tsx`)
- **Type:** Client component
- **State Management:** useState for mobile menu toggle
- **Navigation Items:**
  - Dashboard (/)
  - Stock Control (/stock)
  - Master Data (/master-data)
  - Forecasts (/forecasts)
  - Rollforward (/rollforward)
  - PO Suggest (/po-suggest)
  - PO Management (/po)
  - Settings (/settings)
- **Features:**
  - Responsive: Desktop sidebar (lg:), mobile header + drawer
  - Active state detection with pathname matching
  - Logout functionality (cookie clearing)
  - Gradient branding with Pill icon
  - Backdrop blur overlay for mobile
  - Smooth transitions (300ms)
- **Styling:** Dark sidebar theme with custom CSS variables, rounded-2xl container

#### **Nav** (`nav.tsx`)
- **Type:** Client component (legacy/alternative navigation)
- **Pattern:** Horizontal top navigation bar
- **Features:** Sticky positioning, emoji icons, responsive text hiding
- **Note:** Appears to be an older navigation pattern; Sidebar is the active implementation

---

### 3. Feature Components

#### **Master Data Domain** (`components/master-data/`)

##### **MasterDataWorkspace** (`master-data-workspace.tsx`)
- **Type:** Client component
- **State Management:**
  - useState: products, customers, loading
  - useCallback: loadData memoization
  - useEffect: Initial data fetch
- **Data Flow:** Parallel API fetching (Promise.all)
- **Subcomponents:** CustomersManager, ProductsManager
- **UI Pattern:** Tabs for switching between products/customers
- **Metrics Cards:** Product count, customer count with icons
- **Loading State:** Skeleton components

##### **ProductsManager** (`products-manager.tsx`)
- **Type:** Client component
- **State Management:**
  - Form state (add/edit)
  - Query state with useDeferredValue for search optimization
  - File upload ref for import
- **Features:**
  - CRUD operations (Create, Read, Update, Delete)
  - Search/filter with deferred rendering
  - Excel import/export (XLSX library)
  - Inline editing with Dialog
  - Toast notifications (sonner)
- **Data Fields:** name, sku, exw_price_eur, packing_per_pallet
- **API Endpoints:** /api/products, /api/products/:id
- **Import Logic:** Flexible column mapping with aliases

##### **CustomersManager** (`customers-manager.tsx`)
- **Type:** Client component
- **Pattern:** Nearly identical to ProductsManager
- **Data Fields:** name, region, notes
- **API Endpoints:** /api/customers, /api/customers/:id
- **Features:** Same CRUD + import/export pattern

#### **Stock Domain** (`components/stock/`)

##### **StockControlWorkspace** (`stock-control-workspace.tsx`)
- **Type:** Client component
- **State Management:**
  - Multiple useState hooks for products, rows, adjustments, forms
  - useDeferredValue for search optimization
  - useCallback for data loading
- **Features:**
  - Stock lot management (CRUD)
  - Expiry date tracking with color-coded badges
  - Product filtering
  - Delete with reason tracking
  - Real-time metrics (total units, expiring soon, stocked products)
- **Data Fields:** product_id, lot_number, expiry_date, qty_units, reason
- **API Endpoints:** /api/stock, /api/stock/:id, /api/stock/adjustments
- **Business Logic:**
  - Expiry status calculation (expired, ≤30 days, ≤90 days, healthy)
  - Date formatting (DD/MM/YYYY)
  - Aggregation for metrics

##### **StockAdjustmentHistory** (`stock-adjustment-history.tsx`)
- **Type:** Client component
- **Purpose:** Audit trail display
- **Change Types:** create, update, delete, receipt
- **Data Display:** Timestamp, product, lot, change type, delta, balance, reason
- **Styling:** Color-coded badges per change type
- **Empty State:** Illustrated placeholder with History icon

#### **Forecasts Domain** (`components/forecasts/`)

##### **ForecastEntryTable** (`forecast-entry-table.tsx`)
- **Type:** Client component
- **Complexity:** High - nested table with expandable rows
- **State Management:**
  - useState: expandedCustomers (Set)
  - useRef: debounce timer for cell edits
  - useEffect: Sync external value changes
- **Features:**
  - Collapsible customer rows
  - Inline editable cells with debouncing (500ms)
  - Real-time totals calculation (customer, monthly, grand)
  - Expand/collapse all controls
  - Sticky column headers
- **Data Structure:** ForecastMap (Record<string, number>) with composite keys (customerId:productId:month)
- **Performance:** Deferred cell updates, memoized calculations
- **Accessibility:** ARIA labels for each input cell

##### **DebouncedCell** (internal component)
- **Pattern:** Controlled input with local state + debounced commit
- **Timing:** 500ms debounce, immediate commit on blur
- **Purpose:** Reduce API calls during rapid editing

---

## Architecture Patterns

### Component Composition

**Compound Components:**
- Card system (Header, Title, Description, Content, Footer)
- Dialog system (Trigger, Portal, Overlay, Content, Header, Footer)
- Table system (Header, Body, Footer, Row, Cell)
- Select system (Trigger, Content, Item, Group, Label)

**Pattern Benefits:**
- Flexible composition
- Clear semantic structure
- Consistent styling via data-slot attributes
- Type-safe props with TypeScript

### State Management

**Local State (useState):**
- Form inputs
- UI toggles (modals, mobile menu)
- Loading/submitting flags
- Search queries

**Optimized State:**
- useDeferredValue for search (prevents blocking renders)
- useCallback for stable function references
- useRef for timers and file inputs

**No Global State:**
- No Redux, Zustand, or Context providers
- Data fetched per page/workspace
- Session managed via cookies (server-side)

### Data Fetching

**Pattern:** Client-side fetch in useEffect
```typescript
useEffect(() => {
  void loadData();
}, [loadData]);
```

**API Communication:**
- REST endpoints (/api/*)
- JSON payloads
- Error handling with toast notifications
- Parallel fetching with Promise.all

**No Server Components for Data:**
- All feature components are "use client"
- Layout components (app layout) use server components for auth

### Form Handling

**Pattern:** Controlled components with local state
- Separate form state for add/edit modes
- Validation via HTML5 (required, min, max, type)
- Submit handlers with async/await
- Reset on success

**Reusable Form Fields:**
- Extracted as separate components (CustomerFields, ProductFields, FormFields)
- Shared between add and edit dialogs

### Client/Server Split

**Server Components:**
- app/(app)/layout.tsx (auth check, DB init)
- app/layout.tsx (root layout, fonts)
- Card, Badge, Skeleton (no interactivity)

**Client Components:**
- All UI primitives with interactivity
- All feature components
- Layout navigation (Sidebar, Nav)

**Rationale:**
- Interactivity requires client-side JavaScript
- Server components used only for auth/data loading at layout level

---

## Styling & Design System

### Tailwind CSS Configuration

**Base:** Tailwind CSS v4 with @tailwindcss/postcss
**Plugins:** tw-animate-css, shadcn/tailwind.css
**Merge Utility:** tailwind-merge + clsx via cn() helper

### Design Tokens (CSS Variables)

**Color System (OKLCH):**
- Primary: oklch(0.45 0.12 240) - Blue
- Secondary: oklch(0.96 0.008 230) - Light gray
- Destructive: oklch(0.58 0.2 25) - Red
- Success: oklch(0.5 0.11 160) - Green
- Warning: oklch(0.62 0.15 75) - Yellow
- Critical: oklch(0.58 0.17 45) - Orange
- Muted: oklch(0.965 0.006 230) - Very light gray
- Accent: oklch(0.55 0.11 235) - Bright blue

**Sidebar Theme:**
- Dark background: oklch(0.22 0.06 235)
- Custom border/accent colors
- Separate from main theme

**Border Radius:**
- Base: 0.625rem (10px)
- Variants: sm (60%), md (80%), lg (100%), xl (125%), 2xl (150%), 3xl (180%), 4xl (210%)

**Typography:**
- Sans: Inter (400, 500, 600, 700)
- Mono: IBM Plex Mono (400, 500, 600, 700)

### Styling Patterns

**Consistent Spacing:**
- Card padding: px-5 py-5 (default), px-4 py-4 (sm)
- Input height: h-10 (default), h-8 (sm), h-7 (xs)
- Gap: gap-2, gap-3, gap-4 for layouts

**Focus States:**
- Ring: focus-visible:ring-3 focus-visible:ring-ring/20
- Border: focus-visible:border-ring
- Consistent across all inputs

**Hover States:**
- Table rows: hover:bg-secondary/35
- Buttons: hover:bg-primary/94
- Links: hover:underline

**Responsive Design:**
- Mobile-first approach
- Breakpoints: sm:, md:, lg:, xl:
- Grid layouts: grid-cols-1 sm:grid-cols-2 xl:grid-cols-4

**Animation:**
- Transitions: transition-colors, transition-all duration-200
- Animations: animate-pulse (skeleton), animate-in/out (dialogs)
- Smooth transforms: translate-y-px on active buttons

---

## Component Dependencies

### External Libraries

**UI Primitives:**
- @base-ui/react v1.3.0 (Button, Dialog, Select, Tabs, Input)
- lucide-react v0.577.0 (Icons)
- sonner v2.0.7 (Toast notifications)
- next-themes v0.4.6 (Theme switching)

**Utilities:**
- class-variance-authority v0.7.1 (Variant management)
- clsx v2.1.1 (Class merging)
- tailwind-merge v3.5.0 (Tailwind class deduplication)

**Data Handling:**
- xlsx v0.18.5 (Excel import/export)

### Internal Dependencies

**Utilities:**
- /lib/utils.ts: cn() helper
- /lib/master-data-sheet.ts: Excel read/write helpers

**No Custom Hooks:**
- All hooks are React built-ins (useState, useEffect, useCallback, useRef, useDeferredValue)
- No shared custom hooks directory

---

## Key Interactions & Data Flows

### Master Data Management

**Flow:**
1. MasterDataWorkspace fetches products + customers (parallel)
2. Tabs switch between ProductsManager / CustomersManager
3. Manager components handle CRUD + import/export
4. Changes trigger onRefresh callback → re-fetch data
5. Toast notifications for user feedback

**Import Flow:**
1. User selects Excel file
2. readSheetRows() parses to JSON
3. Flexible column mapping via aliases
4. Batch POST to API with array payload
5. API returns created/updated counts
6. Refresh data + show success toast

### Stock Control

**Flow:**
1. StockControlWorkspace fetches products, stock, adjustments
2. User adds/edits lots via forms
3. API creates stock_adjustments records automatically
4. StockAdjustmentHistory displays audit trail
5. Expiry status calculated client-side for badges

**Delete Flow:**
1. User clicks delete → dialog opens
2. User enters reason (optional)
3. DELETE request with reason in body
4. API creates "delete" adjustment record
5. Refresh data + show success toast

### Forecast Entry

**Flow:**
1. Parent page fetches customers, products, forecasts
2. ForecastEntryTable receives data as props
3. User expands customer rows
4. User edits cell → local state updates
5. After 500ms debounce → onSave callback fires
6. Parent handles API update
7. Totals recalculate on every render (memoized)

**Performance:**
- Deferred search query prevents blocking
- Debounced cell edits reduce API calls
- Expandable rows reduce initial DOM size

---

## Component Relationships

### Hierarchy

```
App Layout (Server)
├── Sidebar (Client)
│   └── Navigation Links
└── Main Content
    ├── MasterDataWorkspace (Client)
    │   ├── Tabs
    │   ├── ProductsManager (Client)
    │   │   ├── Card (Server)
    │   │   ├── Dialog (Client)
    │   │   ├── Input (Client)
    │   │   ├── Button (Client)
    │   │   └── Table (Client)
    │   └── CustomersManager (Client)
    │       └── [Same UI components]
    ├── StockControlWorkspace (Client)
    │   ├── Card (Server)
    │   ├── Input (Client)
    │   ├── Select (Client)
    │   ├── Dialog (Client)
    │   ├── Badge (Server)
    │   └── StockAdjustmentHistory (Client)
    │       └── Table (Client)
    └── ForecastEntryTable (Client)
        ├── Button (Client)
        └── DebouncedCell (Internal)
```

### Reusability

**Highly Reusable (UI Primitives):**
- Button, Input, Label, Card, Dialog, Table, Badge, Skeleton
- Used across all feature components

**Domain-Specific (Feature Components):**
- ProductsManager, CustomersManager (master data only)
- StockControlWorkspace, StockAdjustmentHistory (stock only)
- ForecastEntryTable (forecasts only)

**Shared Patterns:**
- CRUD forms with add/edit modes
- Search + filter with deferred values
- Excel import/export
- Toast notifications

---

## Design System Usage

### Variant System (CVA)

**Button Variants:**
- default: Primary blue with shadow
- outline: Border with hover states
- secondary: Light gray background
- ghost: Transparent with hover
- destructive: Red tint for dangerous actions
- link: Text-only with underline

**Badge Variants:**
- default: Primary blue tint
- secondary: Gray background
- destructive: Red tint
- outline: Border only
- ghost: Transparent
- link: Text with underline

**Tabs Variants:**
- default: Pill-style with background
- line: Underline indicator

### Icon Usage (Lucide React)

**Navigation:**
- LayoutDashboard, Boxes, UsersRound, ClipboardList, TrendingUp, Lightbulb, Package, Settings, Pill

**Actions:**
- Plus, PencilLine, Trash2, Download, Upload, Search, X, Menu, LogOut

**Status:**
- CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon

**Empty States:**
- PackageOpen, History

**Expand/Collapse:**
- ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, ChevronsDownUp

**Pattern:** Icons sized with size-4 (16px) or size-3.5 (14px), colored with text-* utilities

---

## Accessibility Features

**Semantic HTML:**
- Proper heading hierarchy (h1, h2)
- Form labels with htmlFor
- Table structure (thead, tbody, th, td)
- Button vs link distinction

**ARIA Attributes:**
- aria-label on icon buttons
- aria-expanded on collapsible elements
- aria-current="page" on active nav items
- aria-invalid on form inputs
- sr-only for screen reader text

**Keyboard Navigation:**
- Focus rings on all interactive elements
- Tab order follows visual order
- Dialog focus trapping (via @base-ui/react)
- Select keyboard navigation (via @base-ui/react)

**Skip Link:**
- "Skip to main content" link in root layout
- Visible on focus, positioned absolutely

**Color Contrast:**
- OKLCH color space for perceptual uniformity
- Muted text: oklch(0.52 0.015 245) on light backgrounds
- Foreground: oklch(0.22 0.02 245) on light backgrounds

---

## Performance Optimizations

**Deferred Values:**
- Search queries use useDeferredValue to prevent blocking renders
- Allows UI to stay responsive during typing

**Debouncing:**
- Forecast cell edits debounced 500ms
- Reduces API calls during rapid editing

**Memoization:**
- useCallback for loadData functions
- Prevents unnecessary re-renders in useEffect

**Lazy Loading:**
- XLSX library imported dynamically (await import("xlsx"))
- Reduces initial bundle size

**Parallel Fetching:**
- Promise.all for multiple API calls
- Reduces total loading time

**Conditional Rendering:**
- Expandable rows in ForecastEntryTable
- Reduces initial DOM size

---

## Unresolved Questions

1. **Server Components:** Why are feature components not using React Server Components for initial data fetching? Current pattern fetches client-side in useEffect.

2. **State Management:** As the app grows, will local state suffice? No global state library is currently used.

3. **Form Validation:** Only HTML5 validation is used. Are there plans for more complex validation (e.g., Zod, React Hook Form)?

4. **Testing:** No test files found. What is the testing strategy for components?

5. **Storybook/Documentation:** Are UI components documented in Storybook or similar?

6. **Theme Switching:** next-themes is installed but no theme toggle UI found. Is dark mode implemented?

7. **Error Boundaries:** No error boundaries found. How are component errors handled?

8. **Code Splitting:** Are feature components code-split by route?

---

## Recommendations

1. **Extract Shared Patterns:** CRUD manager pattern (ProductsManager, CustomersManager) could be abstracted into a generic DataManager component.

2. **Custom Hooks:** Extract common patterns (useDebounce, useDeferredSearch, useCRUD) into shared hooks.

3. **Server Components:** Consider using React Server Components for initial data fetching to reduce client bundle and improve performance.

4. **Form Library:** Consider React Hook Form + Zod for complex forms with validation.

5. **Error Boundaries:** Add error boundaries around feature components for graceful error handling.

6. **Component Documentation:** Document UI primitives with Storybook or similar for design system consistency.

7. **Testing:** Add component tests (React Testing Library) for critical user flows.

8. **Theme Toggle:** Implement theme toggle UI since next-themes is already installed.

---

## File Paths Reference

### UI Components
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/button.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/card.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/dialog.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/input.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/label.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/select.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/table.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/tabs.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/badge.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/skeleton.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/ui/sonner.tsx

### Layout Components
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/layout/sidebar.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/layout/nav.tsx

### Feature Components
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/master-data/master-data-workspace.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/master-data/products-manager.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/master-data/customers-manager.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/stock/stock-control-workspace.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/stock/stock-adjustment-history.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/components/forecasts/forecast-entry-table.tsx

### Utilities
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/lib/utils.ts
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/lib/master-data-sheet.ts

### Layouts
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/app/layout.tsx
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/app/(app)/layout.tsx

### Styling
- /home/sieu/ICT/ICT-PO/sale-stock-po-app/app/globals.css

---

**Report Generated:** 2026-05-04  
**Total Components Analyzed:** 21  
**Total Files Read:** 18
