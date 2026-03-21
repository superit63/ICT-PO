# System Architecture — Sale-Stock-PO

## Overview
Cloud web app replacing Excel workflow for Exeol pharmaceutical distribution. Single user (sale manager), PIN-only auth, 5 core screens.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes (serverless, Node 22 runtime) |
| Database | SQLite via `@libsql/client` (Turso) |
| Hosting | Vercel (Hobby tier) |
| Auth | 6-digit PIN via httpOnly cookie + bcrypt |

## Data Model

```
products          — master product list (SKUs, prices, packing)
customers         — hospital customers (MB/MN/MN-South)
forecasts         — monthly forecast per (customer × product × month)
stock             — current inventory with LOT/expiry dates
purchase_orders   — PO headers (status lifecycle)
po_items          — PO line items (product × pallets)
app_config        — key/value store (PIN hash only)
```

## Key Constraints
- Lead time: 5 months (order → arrival)
- Container: 22 or 44 pallets per shipment
- Min order: 1 pallet per product
- Planning horizon: 8 months rolling

## API Architecture
All `/api/*` routes guarded by PIN cookie check.
Rollforward computed server-side in `/api/rollforward`.
PO suggestions computed client-side from rollforward data.

## Deployment
Vercel Hobby (free) with Turso libSQL.
`vercel.json` enforces Node 22 runtime + `Cache-Control: no-store` on all API routes.
