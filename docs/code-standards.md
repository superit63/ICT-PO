# Code Standards & Best Practices

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-04  
**Applies To:** All TypeScript/React code in sale-stock-po-app/

---

## File Naming Conventions

### TypeScript/React Files

**Components:**
- Use **PascalCase** for component files
- Match component name to filename
- Examples: `ProductsManager.tsx`, `StockControlWorkspace.tsx`, `ForecastEntryTable.tsx`

**Utilities & Libraries:**
- Use **kebab-case** for utility files
- Descriptive names that indicate purpose
- Examples: `master-data-sheet.ts`, `stock-adjustments.ts`, `export-po.ts`

**Next.js Conventions:**
- `page.tsx` — Route page component
- `route.ts` — API route handler
- `layout.tsx` — Layout component
- `loading.tsx` — Loading UI (not used in current codebase)
- `error.tsx` — Error boundary (not used in current codebase)

### Directories
- Use **kebab-case** for all directories
- Examples: `master-data/`, `po-suggest/`, `stock-adjustments/`
- Route groups use parentheses: `(app)/`

### CSS & Config Files
- Use **kebab-case** for all config files
- Examples: `next.config.ts`, `components.json`, `globals.css`

---

## Component Patterns

### Client vs Server Components

**Server Components (default):**
```typescript
// No "use client" directive
// Used for static content, layouts, data fetching

export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>
}
```

**Client Components (interactive):**
```typescript
"use client"

import { useState } from "react"

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  // ... interactive logic
}
```

**When to use Client Components:**
- useState, useEffect, useCallback, useRef hooks
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (localStorage, window, document)
- Third-party libraries requiring browser context

**When to use Server Components:**
- Static content (cards, badges, skeletons)
- Layouts with auth checks
- Initial data fetching (not used in current codebase)

---

## State Management

### Local State (useState)

**Use for:**
- Form inputs
- UI toggles (modals, mobile menu, expanded rows)
- Loading/submitting flags
- Search queries

**Pattern:**
```typescript
const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(false)
const [query, setQuery] = useState("")
```

### Optimized State

**useDeferredValue (search optimization):**
```typescript
const [query, setQuery] = useState("")
const deferredQuery = useDeferredValue(query)

// Use deferredQuery for filtering (prevents blocking renders)
const filtered = products.filter(p => 
  p.name.toLowerCase().includes(deferredQuery.toLowerCase())
)
```

**useCallback (stable function references):**
```typescript
const loadData = useCallback(async () => {
  setLoading(true)
  const data = await fetch("/api/products").then(r => r.json())
  setProducts(data)
  setLoading(false)
}, [])

useEffect(() => {
  void loadData()
}, [loadData])
```

**useRef (timers, file inputs):**
```typescript
const debounceTimer = useRef<NodeJS.Timeout>()
const fileInputRef = useRef<HTMLInputElement>(null)
```

### No Global State
- No Redux, Zustand, or Context providers in current codebase
- Data fetched per page/workspace
- Session managed via cookies (server-side)

---

## Data Fetching Patterns

### Client-Side Fetch in useEffect

**Standard Pattern:**
```typescript
const [data, setData] = useState<DataType[]>([])
const [loading, setLoading] = useState(true)

const loadData = useCallback(async () => {
  try {
    setLoading(true)
    const res = await fetch("/api/endpoint")
    if (!res.ok) throw new Error("Failed to fetch")
    const json = await res.json()
    setData(json)
  } catch (error) {
    console.error(error)
    toast.error("Failed to load data")
  } finally {
    setLoading(false)
  }
}, [])

useEffect(() => {
  void loadData()
}, [loadData])
```

### Parallel Fetching

**Use Promise.all for independent requests:**
```typescript
const loadData = useCallback(async () => {
  setLoading(true)
  try {
    const [productsRes, customersRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/customers")
    ])
    const products = await productsRes.json()
    const customers = await customersRes.json()
    setProducts(products)
    setCustomers(customers)
  } catch (error) {
    toast.error("Failed to load data")
  } finally {
    setLoading(false)
  }
}, [])
```

---

## API Route Patterns

### Request Handling

**Standard Structure:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { hasValidRequestSession } from "@/lib/session"
import { queryAll, executeSql } from "@/lib/db"

export async function GET(req: NextRequest) {
  // 1. Auth check
  if (!(await hasValidRequestSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Query parameters
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")

  // 3. Database query
  try {
    const rows = await queryAll<RowType>(
      "SELECT * FROM table WHERE product_id = ?",
      [productId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### CRUD Operations

**Create (POST):**
```typescript
export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  
  // Validation
  if (!body.name || !body.sku) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  try {
    await executeSql(
      "INSERT INTO products (name, sku, exw_price_eur, packing_per_pallet) VALUES (?, ?, ?, ?)",
      [body.name, body.sku, body.exw_price_eur, body.packing_per_pallet]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
```

**Update (PUT):**
```typescript
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await hasValidRequestSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  
  try {
    await executeSql(
      "UPDATE products SET name = ?, sku = ?, exw_price_eur = ?, packing_per_pallet = ? WHERE id = ?",
      [body.name, body.sku, body.exw_price_eur, body.packing_per_pallet, params.id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}
```

**Delete (DELETE):**
```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await hasValidRequestSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await executeSql("DELETE FROM products WHERE id = ?", [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
```

---

## Database Query Patterns

### Parameterized Queries (ALWAYS)

**✅ Correct (parameterized):**
```typescript
const products = await queryAll<Product>(
  "SELECT * FROM products WHERE sku = ?",
  [sku]
)
```

**❌ Incorrect (SQL injection risk):**
```typescript
const products = await queryAll<Product>(
  `SELECT * FROM products WHERE sku = '${sku}'`
)
```

### Query Utilities

**queryAll<T> — Multiple rows:**
```typescript
const products = await queryAll<Product>(
  "SELECT * FROM products ORDER BY name"
)
// Returns: Product[]
```

**queryOne<T> — Single row or null:**
```typescript
const product = await queryOne<Product>(
  "SELECT * FROM products WHERE id = ?",
  [id]
)
// Returns: Product | null
```

**executeSql — No return value:**
```typescript
await executeSql(
  "INSERT INTO products (name, sku) VALUES (?, ?)",
  [name, sku]
)
// Returns: void
```

### Type Safety

**Define interfaces for query results:**
```typescript
interface Product {
  id: number
  name: string
  sku: string
  exw_price_eur: number
  packing_per_pallet: number
}

const products = await queryAll<Product>("SELECT * FROM products")
// TypeScript knows products is Product[]
```

---

## Form Handling Patterns

### Controlled Components

**Standard Form Pattern:**
```typescript
const [formData, setFormData] = useState({
  name: "",
  sku: "",
  exw_price_eur: 0,
  packing_per_pallet: 0
})

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    
    if (!res.ok) throw new Error("Failed to create")
    
    toast.success("Product created")
    setFormData({ name: "", sku: "", exw_price_eur: 0, packing_per_pallet: 0 })
    onRefresh()
  } catch (error) {
    toast.error("Failed to create product")
  }
}

return (
  <form onSubmit={handleSubmit}>
    <Input
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      required
    />
    {/* ... other fields */}
    <Button type="submit">Create</Button>
  </form>
)
```

### Validation

**HTML5 Validation (current approach):**
```typescript
<Input
  type="text"
  required
  minLength={3}
  maxLength={50}
/>

<Input
  type="number"
  required
  min={0}
  step={0.01}
/>
```

**Future: Consider Zod + React Hook Form for complex validation**

---

## Error Handling

### API Error Handling

**Standard Pattern:**
```typescript
try {
  const res = await fetch("/api/endpoint")
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Request failed")
  }
  const data = await res.json()
  return data
} catch (error) {
  console.error(error)
  toast.error(error instanceof Error ? error.message : "An error occurred")
}
```

### Toast Notifications

**Use sonner for user feedback:**
```typescript
import { toast } from "sonner"

// Success
toast.success("Product created successfully")

// Error
toast.error("Failed to create product")

// Info
toast.info("Data is loading...")

// Warning
toast.warning("This action cannot be undone")
```

---

## Styling Patterns

### Tailwind CSS Utilities

**Use cn() helper for conditional classes:**
```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)} />
```

### Design Tokens (CSS Variables)

**Use semantic color names:**
```typescript
// ✅ Correct
<div className="bg-primary text-primary-foreground" />
<Badge variant="destructive">Critical</Badge>

// ❌ Avoid hardcoded colors
<div className="bg-blue-500 text-white" />
```

**Available Colors:**
- `primary` — Main brand color (blue)
- `secondary` — Light gray
- `destructive` — Red (errors, dangerous actions)
- `success` — Green (not in CSS vars, use badge variant)
- `warning` — Yellow (not in CSS vars, use badge variant)
- `muted` — Very light gray (backgrounds)
- `accent` — Bright blue (highlights)

### Responsive Design

**Mobile-first approach:**
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" />
```

**Breakpoints:**
- `sm:` — 640px and up
- `md:` — 768px and up
- `lg:` — 1024px and up
- `xl:` — 1280px and up
- `2xl:` — 1536px and up

---

## TypeScript Standards

### Strict Mode

**tsconfig.json enforces strict mode:**
- No implicit any
- Strict null checks
- Strict function types
- No unused locals/parameters (warning only)

### Type Definitions

**Define interfaces for data structures:**
```typescript
interface Product {
  id: number
  name: string
  sku: string
  exw_price_eur: number
  packing_per_pallet: number
}

interface Customer {
  id: number
  name: string
  region: string
  notes?: string
}
```

**Use type aliases for domain concepts:**
```typescript
type Month = string // "YYYY-MM"
type Units = number
type Pallets = number
type StockStatus = "ok" | "low" | "critical" | "stockout"
```

### Null Handling

**Use null for "not found" cases:**
```typescript
const product = await queryOne<Product>("SELECT * FROM products WHERE id = ?", [id])
if (!product) {
  return NextResponse.json({ error: "Product not found" }, { status: 404 })
}
```

**Use optional chaining:**
```typescript
const expiryDate = stock?.expiry_date
const customerName = customer?.name ?? "Unknown"
```

---

## Performance Best Practices

### Debouncing

**Use for rapid user input:**
```typescript
const debounceTimer = useRef<NodeJS.Timeout>()

const handleChange = (value: string) => {
  setLocalValue(value)
  
  if (debounceTimer.current) {
    clearTimeout(debounceTimer.current)
  }
  
  debounceTimer.current = setTimeout(() => {
    onSave(value)
  }, 500)
}
```

### Deferred Values

**Use for search/filter:**
```typescript
const [query, setQuery] = useState("")
const deferredQuery = useDeferredValue(query)

// Filter using deferred value (prevents blocking)
const filtered = items.filter(item =>
  item.name.toLowerCase().includes(deferredQuery.toLowerCase())
)
```

### Memoization

**Use useCallback for stable function references:**
```typescript
const loadData = useCallback(async () => {
  // ... fetch logic
}, [/* dependencies */])
```

**Use useMemo for expensive calculations (not used in current codebase):**
```typescript
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.value, 0)
}, [items])
```

---

## Security Standards

### Authentication

**Always check session on API routes:**
```typescript
import { hasValidRequestSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... rest of handler
}
```

### SQL Injection Prevention

**ALWAYS use parameterized queries:**
```typescript
// ✅ Correct
await queryAll("SELECT * FROM products WHERE sku = ?", [sku])

// ❌ Never do this
await queryAll(`SELECT * FROM products WHERE sku = '${sku}'`)
```

### Password/PIN Hashing

**Use bcrypt for hashing:**
```typescript
import bcrypt from "bcryptjs"

// Hash
const hash = await bcrypt.hash(pin, 10)

// Compare
const isValid = await bcrypt.compare(pin, hash)
```

---

## Testing Standards

**Current State:** No automated tests in v1.0

**Recommended Future Approach:**

### Unit Tests (Vitest)
```typescript
import { describe, it, expect } from "vitest"
import { getStatus, suggestPO } from "@/lib/calculations"

describe("getStatus", () => {
  it("returns stockout when balance is negative", () => {
    expect(getStatus(-10, 100)).toBe("stockout")
  })
  
  it("returns critical when balance is less than 1 pallet", () => {
    expect(getStatus(50, 100)).toBe("critical")
  })
})
```

### Component Tests (React Testing Library)
```typescript
import { render, screen, fireEvent } from "@testing-library/react"
import { ProductsManager } from "@/components/master-data/products-manager"

describe("ProductsManager", () => {
  it("renders product list", () => {
    render(<ProductsManager />)
    expect(screen.getByText("Products")).toBeInTheDocument()
  })
})
```

---

## Code Comments

### When to Comment

**✅ Comment complex business logic:**
```typescript
// Calculate pallets needed, rounding up to whole pallets
// Container constraint: must be 22 or 44 pallets
const pallets = Math.ceil(shortfall / packingPerPallet)
```

**✅ Comment non-obvious algorithms:**
```typescript
// PO lead time is 5 months from order to arrival
// Example: Order in Jan 2026 → Arrives in Jun 2026
const arrivalMonth = addMonths(orderMonth, PO_LEAD_TIME_MONTHS)
```

**❌ Don't comment obvious code:**
```typescript
// Bad: Set loading to true
setLoading(true)

// Bad: Loop through products
products.forEach(product => { ... })
```

### JSDoc for Public APIs

**Use JSDoc for exported functions:**
```typescript
/**
 * Calculate stock status based on balance and packing per pallet
 * @param balance - Current stock balance in units
 * @param packing - Units per pallet
 * @returns Status level: "ok" | "low" | "critical" | "stockout"
 */
export function getStatus(balance: Units, packing: number): StockStatus {
  if (balance < 0) return "stockout"
  if (balance < packing * 1) return "critical"
  if (balance < packing * 3) return "low"
  return "ok"
}
```

---

## Git Commit Standards

### Conventional Commits

**Format:** `<type>: <description>`

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring (no behavior change)
- `test:` — Adding or updating tests
- `chore:` — Build process, dependencies, tooling

**Examples:**
```
feat: add PO suggestion engine
fix: correct rollforward calculation for negative balances
docs: update API endpoint documentation
refactor: extract CRUD pattern into reusable hook
test: add unit tests for calculation functions
chore: upgrade Next.js to 16.2.0
```

### Commit Message Guidelines

**✅ Good commit messages:**
- `feat: implement stock adjustment history with audit trail`
- `fix: prevent duplicate SKU entries in product import`
- `refactor: extract Excel export logic into shared utility`

**❌ Bad commit messages:**
- `update code`
- `fix bug`
- `changes`
- `WIP`

---

## Accessibility Standards

### Semantic HTML

**Use proper HTML elements:**
```typescript
// ✅ Correct
<button onClick={handleClick}>Submit</button>
<nav><a href="/dashboard">Dashboard</a></nav>

// ❌ Incorrect
<div onClick={handleClick}>Submit</div>
<div><span onClick={navigate}>Dashboard</span></div>
```

### ARIA Labels

**Add labels for icon-only buttons:**
```typescript
<Button aria-label="Delete product" onClick={handleDelete}>
  <Trash2 className="size-4" />
</Button>
```

### Keyboard Navigation

**Ensure all interactive elements are keyboard accessible:**
- Use native buttons, links, inputs
- Add `tabIndex={0}` for custom interactive elements
- Implement keyboard handlers (Enter, Space, Escape)

---

## Import Organization

### Import Order

```typescript
// 1. React and Next.js
import { useState, useEffect } from "react"
import { NextRequest, NextResponse } from "next/server"

// 2. Third-party libraries
import { toast } from "sonner"
import { Trash2, PencilLine } from "lucide-react"

// 3. Internal components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// 4. Internal utilities
import { cn } from "@/lib/utils"
import { queryAll } from "@/lib/db"

// 5. Types
import type { Product, Customer } from "@/types"
```

### Path Aliases

**Use @/ for absolute imports:**
```typescript
// ✅ Correct
import { Button } from "@/components/ui/button"
import { queryAll } from "@/lib/db"

// ❌ Avoid relative imports for shared code
import { Button } from "../../../components/ui/button"
```

---

## Unresolved Standards

The following areas need standardization in future versions:

1. **Error Boundaries:** No error boundary pattern established
2. **Loading States:** No consistent loading UI pattern
3. **Empty States:** Inconsistent empty state designs
4. **Form Validation:** No validation library (only HTML5)
5. **API Error Codes:** No standardized error code system
6. **Logging:** No structured logging (only console.error)
7. **Monitoring:** No error monitoring service (Sentry, etc.)
8. **Analytics:** No user analytics tracking

---

**Document Owner:** Development Team  
**Review Cycle:** Update when new patterns emerge or standards change
