# Sale-Stock-PO — Setup Guide

## Prerequisites

- Node.js 18+ (check: `node --version`)
- npm or pnpm
- Turso account (free) at https://turso.tech

---

## 1. Clone / Create Project

```bash
cd D:/INCOTEC/ICT-PO/sale-stock-po-app
```

If starting fresh:

```bash
npx create-next-app@latest sale-stock-po-app \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --yes
```

---

## 2. Install Dependencies

```bash
cd sale-stock-po-app
npm install @libsql/client xlsx bcryptjs clsx tailwind-merge
npm install -D @types/bcryptjs tsx
npx shadcn@latest init -d
npx shadcn@latest add button table card input label badge select tabs dialog skeleton sonner -y
```

---

## 3. Set Up Turso Database

### 3a. Create account at turso.tech

### 3b. Create database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create sale-stock-po

# Get connection URL
turso db show sale-stock-po --url
# → libsql://sale-stock-po-xxx.turso.io

# Get auth token
turso db tokens create sale-stock-po
```

### 3c. Fill in `.env.local`

```bash
cp .env.local.example .env.local
# Edit .env.local with your TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
```

---

## 4. Run Database Migrations

On first launch, the app auto-creates all tables via `/api/init`.

Or run locally with the seed script:

```bash
# Set up local SQLite fallback
echo "TURSO_DATABASE_URL=file:local.db" > .env.local

npm run dev
# Visit http://localhost:3000 → will redirect to /setup to set PIN
```

---

## 5. Seed Products & Customers

```bash
npm run dev
# Then open another terminal:
npm run -- tsx scripts/seed-products.ts
```

This seeds 25 Exeol products and 10 hospital customers.

---

## 6. Set Up Vercel Deployment

```bash
npm i -g vercel
vercel link
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel deploy
```

---

## 7. First-Time Usage

1. Open `http://localhost:3000`
2. Redirected to `/setup` → enter a 6-digit PIN
3. PIN saved → redirected to Dashboard
4. Run `npm run -- tsx scripts/seed-products.ts` to seed data
5. Navigate: Dashboard → Forecasts → Rollforward → PO Suggest → PO Management

---

## Dev Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npx tsx scripts/seed-products.ts   # Seed data
```

---

## Folder Structure

```
sale-stock-po-app/
├── app/
│   ├── (app)/           # Protected routes (require PIN)
│   │   ├── page.tsx            # Dashboard
│   │   ├── forecasts/          # Forecast entry grid
│   │   ├── rollforward/        # Stock rollforward timeline
│   │   ├── po-suggest/         # PO suggestion engine
│   │   └── po/                # PO list, new, [id]
│   ├── login/          # PIN login
│   ├── setup/          # First-time PIN setup
│   └── api/            # All API routes (auth, CRUD, rollforward)
├── components/
│   ├── layout/nav.tsx  # Shared top navigation
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── db.ts           # Turso client singleton
│   ├── calculations.ts # Rollforward engine + PO suggestion
│   ├── schema.sql      # SQLite schema
│   └── init.ts         # Auto-migration on startup
├── scripts/
│   └── seed-products.ts # Seed script
└── .env.local          # Env vars (not committed)
```
