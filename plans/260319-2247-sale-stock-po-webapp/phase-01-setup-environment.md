# Phase 1: Setup Environment

**Priority:** P1 | **Status:** Pending | **Effort:** 4h

---

## Overview

Set up the Next.js project, configure Tailwind CSS, set up Turso SQLite database, configure Vercel deployment, and establish project structure.

## Key Insights

- Use Next.js 14 App Router (latest stable, long-term support)
- Use Turso free tier (500 databases, 9GB storage, edge replication)
- Keep project structure flat initially — no monorepo needed for single app
- Use `app/` directory structure (App Router standard)

## Architecture

```
sale-stock-po-app/
├── app/
│   ├── layout.tsx           # Root layout with PIN gate
│   ├── page.tsx            # Dashboard (home)
│   ├── forecasts/
│   │   └── page.tsx        # Forecast entry grid
│   ├── rollforward/
│   │   └── page.tsx        # Stock rollforward
│   ├── po-suggest/
│   │   └── page.tsx        # PO suggestion engine
│   ├── po/
│   │   ├── page.tsx        # PO list
│   │   └── [id]/page.tsx   # PO detail/edit
│   └── api/
│       ├── auth/route.ts   # PIN verification
│       ├── products/route.ts
│       ├── customers/route.ts
│       ├── forecasts/route.ts
│       ├── stock/route.ts
│       ├── po/route.ts
│       └── rollforward/route.ts
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── dashboard/
│   ├── forecast-grid/
│   ├── rollforward-table/
│   └── po-card/
├── lib/
│   ├── db.ts               # Turso client singleton
│   ├── schema.sql          # SQLite schema
│   └── calculations.ts     # Pallet math, rollforward logic
├── scripts/
│   └── seed-products.ts    # Seed 20 products from Excel
└── .env.local
```

## Implementation Steps

1. **Create Next.js project**
   ```bash
   npx create-next-app@latest sale-stock-po-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
   cd sale-stock-po-app
   npm install @libsql/client xlsx clsx tailwind-merge
   ```

2. **Install shadcn/ui**
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button table card input label badge select tabs dialog
   ```

3. **Configure Turso**
   - Sign up at turso.tech (free)
   - Create database: `turso db create sale-stock-po`
   - Get libsql URL + auth token
   - Add to `.env.local`:
     ```
     TURSO_DATABASE_URL=libsql://sale-stock-po-{username}.turso.io
     TURSO_AUTH_TOKEN=xxx
     ```

4. **Create SQLite schema** — write `lib/schema.sql`

5. **Seed products** — run `scripts/seed-products.ts` to populate product list from Excel data

6. **Configure Vercel**
   - `npm i -g vercel`
   - `vercel link` to connect project
   - Add env vars in Vercel dashboard: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `vercel env pull .env.local`

7. **Test local DB connection**
   ```bash
   npm run dev
   # visit http://localhost:3000 — should show empty dashboard
   ```

## Todo List

- [ ] Scaffold Next.js project with TypeScript + Tailwind
- [ ] Install and configure shadcn/ui components
- [ ] Setup Turso SQLite database + connection
- [ ] Write SQLite schema (products, customers, forecasts, stock, po_items)
- [ ] Seed initial product list
- [ ] Configure Vercel deployment
- [ ] Verify app runs locally and DB connects

## Success Criteria

- App runs at `localhost:3000` with empty state
- Can create/read products via API
- Database accessible via Turso dashboard

## Security Considerations

- PIN stored as bcrypt hash in DB (never plain text)
- API routes protected by PIN session cookie
- Env vars for DB credentials (never committed)

## Next Steps

Phase 2 blocked on this phase completing. Phase 2 creates full schema and migrations.
