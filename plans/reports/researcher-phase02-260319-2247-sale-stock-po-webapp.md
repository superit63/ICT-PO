# Researcher Report — Phase 2: Database Schema & API Layer Patterns

**Date:** 2026-03-19 | **Author:** researcher | **Phase:** 2

---

## 1. Auth Middleware Pattern (Next.js 14)

### Recommended: Route-level middleware via `middleware.ts`

Next.js 14 App Router supports Edge-compatible middleware at `src/middleware.ts` (or project root). This is the **most efficient** pattern — runs before any route handler, single centralized check.

**File:** `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PUBLIC_PATHS = ['/setup', '/api/auth/verify', '/api/auth/setup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect /api/* routes
  if (pathname.startsWith('/api/')) {
    // In Edge runtime, read cookie directly from request
    const sessionCookie = request.cookies.get('session_pin');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protect pages (redirect to /setup if no session)
  const cookieStore = cookies();
  const session = cookieStore.get('session_pin');
  if (!session?.value && pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

> **Note:** `cookies()` from `next/headers` works in Server Components and Route Handlers. In Edge middleware, use `request.cookies.get()` instead (different API).

### Auth Middleware in Route Handlers (Alternative/Supplement)

For API routes needing direct access to auth state:

```typescript
// lib/auth.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export function requireAuth() {
  const cookieStore = cookies();
  const session = cookieStore.get('session_pin');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null; // auth OK
}
```

Then in each route handler:
```typescript
// app/api/products/route.ts
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authError = requireAuth();
  if (authError) return authError;
  // ... handler logic
}
```

### Middleware vs Handler-level Auth — Which to Use?

| Approach | Pros | Cons |
|---|---|---|
| **middleware.ts** | Single check for all routes, fastest rejection | Edge runtime limitations, can't read DB |
| **Handler-level** | Full Node runtime access, can check DB | Repetitive, slower for unauth'd calls |

**Recommendation:** Use **both**:
- `middleware.ts` — fast 401 rejection for `/api/*` (cookie check only, no DB hit)
- Route handlers — verify session is valid against DB if needed (e.g., session expiry)

---

## 2. PIN Auth Cookie Settings

```typescript
import { cookies } from 'next/headers';

async function setSessionCookie(pinHash: string) {
  const cookieStore = await cookies();
  cookieStore.set('session_pin', pinHash, {
    httpOnly: true,           // JS cannot read it
    sameSite: 'strict',       // CSRF protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session_pin');
}
```

**For middleware (Edge runtime):** Set cookie via `NextResponse`:
```typescript
const response = NextResponse.next();
response.cookies.set('session_pin', hash, {
  httpOnly: true,
  sameSite: 'strict',
  secure: true,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
});
return response;
```

---

## 3. PIN Verification with bcrypt

```typescript
import bcrypt from 'bcryptjs';

async function verifyPin(plainPin: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(plainPin, storedHash);
}

async function hashPin(plainPin: string): Promise<string> {
  return bcrypt.hash(plainPin, 10); // 10 rounds — good balance speed/security
}
```

Install: `npm install bcryptjs && npm install -D @types/bcryptjs`

> **Note:** `bcryptjs` is pure JS — works in both Node and Edge runtimes. `bcrypt` (native) requires Node native bindings and **does NOT work** in Edge middleware.

---

## 4. DB Singleton Pattern

### With `@libsql/client`

```typescript
// lib/db.ts
import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN, // optional for local dev
    });
  }
  return db;
}

// Typed query helpers
export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getDb().execute({ sql, args: params });
  return result.rows as T[];
}

export async function queryOne<T>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<{ rowsAffected: number }> {
  const result = await getDb().execute({ sql, args: params });
  return { rowsAffected: result.rowsAffected ?? 0 };
}
```

**⚠️ Critical:** In Next.js dev mode (with hot reload), module-level singletons can be reset. For production reliability, consider:

```typescript
// lib/db.ts — safer singleton with process-level cache
import { createClient, type Client } from '@libsql/client';

let db: Client | undefined;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
    db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return db;
}
```

---

## 5. Migration Strategy

### SQL Files in `scripts/migrations/`

```
scripts/migrations/
├── 001_initial_schema.sql
├── 002_add_xyz.sql
└── ...
```

### Migration Runner

```typescript
// lib/migrations.ts
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getDb } from './db';

const MIGRATIONS_DIR = join(process.cwd(), 'scripts', 'migrations');

export async function runMigrations() {
  const db = getDb();

  // Track migrations in a dedicated table
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )`,
    args: [],
  });

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await db.execute({
      sql: `SELECT 1 FROM _migrations WHERE name = ?`,
      args: [file],
    });

    if (applied.rows.length > 0) continue; // already applied

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

    // Execute each statement separately (SQLite doesn't support multi-statement)
    for (const stmt of sql.split(';').filter(s => s.trim())) {
      await db.execute({ sql: stmt, args: [] });
    }

    await db.execute({
      sql: `INSERT INTO _migrations (name) VALUES (?)`,
      args: [file],
    });

    console.log(`[migration] applied: ${file}`);
  }
}
```

### Auto-run on App Startup

```typescript
// app/layout.tsx (or app/api/seed/route.ts trigger)
import { runMigrations } from '@/lib/migrations';

// One way: call in a Next.js API route that runs once
// app/api/init/route.ts
import { runMigrations } from '@/lib/migrations';

export async function GET() {
  await runMigrations();
  return Response.json({ status: 'migrations complete' });
}
```

Or in `next.config.js` / `package.json` startup script:
```json
// package.json
{
  "scripts": {
    "dev": "node scripts/init-db.js && next dev"
  }
}
```

---

## 6. Turso/libsql: Edge Runtime vs Node Runtime

| Feature | Edge Runtime | Node Runtime |
|---|---|---|
| `middleware.ts` | ✅ | ❌ |
| API Route Handlers | ✅ | ✅ |
| DB access via `@libsql/client` | ✅ (HTTP only) | ✅ (HTTP + WebSocket) |
| Local `file:` URLs | ❌ | ✅ |
| `bcryptjs` | ✅ | ✅ |
| Streaming responses | ✅ | ✅ |

**Important:**
- Turso remote DB via HTTP: works in **both** Edge and Node
- Local SQLite `file:local.db`: **Node runtime only** (Edge doesn't support filesystem)
- **Recommendation for dev:** Use Node runtime for API routes that access local SQLite. Use Edge-compatible auth in middleware.

Set runtime per-route:
```typescript
// app/api/products/route.ts
export const runtime = 'node'; // default for API routes is 'edge', explicit is safer
```

---

## 7. PIN Auth State Machine

```
┌─────────────────────────────────────────────┐
│  App Start                                  │
│    ├─ GET pin_hash from app_config          │
│    ├─ If null → redirect to /setup          │
│    └─ If set  → redirect to /login          │
└─────────────────────────────────────────────┘

/setup (GET):
  - Check if PIN already set in app_config
  - If set → redirect to /login
  - Else → show PIN setup form

/setup (POST):
  - Validate 6-digit PIN
  - bcrypt.hash(pin, 10) → store in app_config (key='pin_hash')
  - Set session_pin cookie
  - Redirect to /dashboard

/login (GET):
  - If session_pin cookie valid → redirect /dashboard
  - Else → show login form

/login (POST):
  - GET pin_hash from app_config
  - bcrypt.compare(input, stored)
  - If match → set session_pin cookie → redirect /dashboard
  - If fail → show error, re-render form
```

---

## 8. CRUD API Patterns

### Standard Route Handler Pattern

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, queryOne, execute } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { Product } from '@/types';

const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  exw_price_eur: z.number().positive(),
  packing_per_pallet: z.number().int().positive(),
});

export async function GET() {
  const auth = requireAuth();
  if (auth) return auth;

  const products = await query<Product>('SELECT * FROM products ORDER BY name');
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const auth = requireAuth();
  if (auth) return auth;

  const body = await request.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, sku, exw_price_eur, packing_per_pallet } = parsed.data;
  const result = await execute(
    `INSERT INTO products (name, sku, exw_price_eur, packing_per_pallet)
     VALUES (?, ?, ?, ?)`,
    [name, sku, exw_price_eur, packing_per_pallet]
  );

  const product = await queryOne<Product>(
    'SELECT * FROM products WHERE id = ?',
    [result.rowsAffected]
  );

  return NextResponse.json(product, { status: 201 });
}
```

### Bulk Upsert (Forecasts)

```typescript
// app/api/forecasts/route.ts

const ForecastUpsertSchema = z.object({
  forecasts: z.array(z.object({
    customer_id: z.number().int(),
    product_id: z.number().int(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    qty_units: z.number().int().min(0),
  })).min(1),
});

export async function PUT(request: Request) {
  const auth = requireAuth();
  if (auth) return auth;

  const body = await request.json();
  const parsed = ForecastUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  // Use transaction for bulk upsert
  const db = getDb();
  await db.execute('BEGIN');

  try {
    for (const f of parsed.data.forecasts) {
      await db.execute({
        sql: `INSERT INTO forecasts (customer_id, product_id, month, qty_units)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(customer_id, product_id, month)
              DO UPDATE SET qty_units = excluded.qty_units`,
        args: [f.customer_id, f.product_id, f.month, f.qty_units],
      });
    }
    await db.execute('COMMIT');
    return NextResponse.json({ ok: true, count: parsed.data.forecasts.length });
  } catch (err) {
    await db.execute('ROLLBACK');
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
```

### HTTP Status Codes Reference

| Scenario | Status |
|---|---|
| Success (no body) | 204 |
| Success (with body) | 200 |
| Created | 201 |
| Bad request / validation | 400 |
| Unauthorized | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict (duplicate) | 409 |
| Server error | 500 |

---

## 9. PIN Input UI Pattern

### Client Component: `components/pin-input.tsx`

```tsx
'use client';
import { useState, useRef, useEffect } from 'react';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PinInput({ length = 6, onComplete, error, disabled }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    if (value && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newValues.every(v => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    setValues(pasted.split('').concat(Array(length - pasted.length).fill('')));
    if (pasted.length === length) onComplete(pasted);
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex gap-2" onPaste={handlePaste}>
        {values.map((v, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={v}
            disabled={disabled}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-12 h-14 text-center text-2xl font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        ))}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
```

### Usage in Setup/Login Page

```tsx
// app/(auth)/setup/page.tsx
'use client';
import { useState } from 'react';
import { PinInput } from '@/components/pin-input';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin1, setPin1] = useState('');
  const [error, setError] = useState('');

  const handleFirstPin = (pin: string) => {
    setPin1(pin);
    setStep('confirm');
  };

  const handleConfirmPin = async (pin2: string) => {
    if (pin2 !== pin1) {
      setError('PINs do not match. Try again.');
      setStep('enter');
      setPin1('');
      return;
    }
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ pin: pin2 }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Setup failed. Try again.');
      setStep('enter');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>{step === 'enter' ? 'Set your 6-digit PIN' : 'Confirm your PIN'}</h1>
      <PinInput
        onComplete={step === 'enter' ? handleFirstPin : handleConfirmPin}
        error={error}
      />
    </div>
  );
}
```

---

## 10. Pitfalls to Avoid

| Pitfall | Fix |
|---|---|
| Middleware trying to use `fs` or Node-only modules | Keep middleware Edge-compatible — no `@libsql/client` in middleware |
| `bcrypt` (native) used in Edge runtime | Always use `bcryptjs` |
| Global DB singleton reset on Next.js hot reload | Module-level singleton is fine in production; dev hot-reload creates new instances |
| SQL injection via template literals | Always use parameterized queries: `db.execute({ sql, args: [var] })` |
| Using `cookies()` in middleware | Use `request.cookies.get()` instead — different API in Edge |
| `file:` local DB URLs in Edge runtime | Use Node runtime for routes accessing local SQLite |
| Missing `ON DELETE CASCADE` on `po_items.po_id` | Already in schema ✓ |
| Not wrapping bulk upserts in transactions | Use `BEGIN` / `COMMIT` / `ROLLBACK` |
| Forgetting `secure: true` in prod cookie | Use `NODE_ENV` check |
| Storing PIN as plain text | Always bcrypt.hash() |
| Missing `authToken` for Turso in production | Use `TURSO_AUTH_TOKEN` env var |

---

## 11. File Structure Recommendation

```
src/
├── middleware.ts                    # Auth middleware (Edge-compatible)
├── lib/
│   ├── db.ts                        # Turso client singleton + query helpers
│   ├── migrations.ts                # Migration runner
│   ├── auth.ts                      # requireAuth(), verifyPin, hashPin, cookie helpers
│   └── types.ts                     # Shared TypeScript types (Product, Customer, etc.)
├── app/
│   ├── (auth)/
│   │   ├── setup/page.tsx           # First-time PIN setup
│   │   └── login/page.tsx           # Login form
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── forecasts/page.tsx
│   │   └── ...
│   └── api/
│       ├── auth/
│       │   ├── verify/route.ts
│       │   └── setup/route.ts
│       ├── products/
│       │   ├── route.ts             # GET list, POST create
│       │   └── [id]/route.ts        # GET, PUT, DELETE
│       ├── customers/route.ts
│       ├── forecasts/route.ts
│       ├── stock/route.ts
│       ├── po/route.ts
│       ├── po/[id]/route.ts
│       └── rollforward/route.ts
└── components/
    ├── pin-input.tsx
    └── ...
scripts/migrations/
├── 001_initial_schema.sql
└── 002_seed_products.sql
```

---

## Unresolved Questions

1. **Turso edge vs local dev:** Should API routes default to `node` runtime (for local `file:` SQLite) or always `edge` (for Turso HTTP)? Affects `next.config.js` settings.
2. **Session validation:** Should the session cookie store just a marker, or a hash that's validated against DB on each API call?
3. **PIN reset flow:** If PIN is forgotten, is there a DB-level recovery mechanism needed, or just a fresh redeploy?
4. **Rollforward computation:** Should `/api/rollforward` run as a stored procedure in SQL or computed in JavaScript?
5. **Vercel cold starts + migrations:** How to safely run migrations on Vercel serverless cold start without race conditions?
