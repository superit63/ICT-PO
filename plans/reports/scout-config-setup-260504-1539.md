# Configuration & Setup Scout Report
**Project:** Sale-Stock-PO App  
**Date:** 2026-05-04  
**Scope:** Project configuration, dependencies, documentation, and deployment setup

---

## Project Metadata

| Property | Value |
|----------|-------|
| **Name** | sale-stock-po-app |
| **Version** | 0.1.0 |
| **Type** | Private (not published to npm) |
| **Framework** | Next.js 16.2.0 (App Router) |
| **Runtime** | Node.js 22.x |
| **Language** | TypeScript 5.x |
| **UI Framework** | React 19.2.4 |
| **Styling** | Tailwind CSS 4.x + shadcn/ui |
| **Database** | SQLite via Turso (libSQL) |
| **Deployment** | Vercel (Frankfurt region) |

---

## Tech Stack Summary

**Frontend:**
- Next.js 16.2.0 with App Router (breaking changes from training data - see AGENTS.md)
- React 19.2.4 + React DOM 19.2.4
- TypeScript 5.x with strict mode enabled
- Tailwind CSS 4.x with PostCSS
- shadcn/ui components (base-nova style)
- Lucide React icons (v0.577.0)
- next-themes for dark mode support

**Backend:**
- Next.js API Routes (serverless functions)
- Node.js 22.x runtime on Vercel
- @libsql/client v0.17.0 (Turso SQLite)
- bcryptjs v3.0.3 for PIN hashing

**Data & Export:**
- xlsx v0.18.5 for Excel export
- Sonner v2.0.7 for toast notifications

---

## Dependencies Inventory

### Runtime Dependencies (15 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| @base-ui/react | ^1.3.0 | Base UI primitives |
| @libsql/client | ^0.17.0 | Turso SQLite client |
| bcryptjs | ^3.0.3 | Password/PIN hashing |
| class-variance-authority | ^0.7.1 | Component variant utilities |
| clsx | ^2.1.1 | Conditional className utility |
| lucide-react | ^0.577.0 | Icon library |
| next | 16.2.0 | Next.js framework |
| next-themes | ^0.4.6 | Theme management |
| react | 19.2.4 | React library |
| react-dom | 19.2.4 | React DOM renderer |
| shadcn | ^4.0.8 | shadcn/ui CLI |
| sonner | ^2.0.7 | Toast notifications |
| tailwind-merge | ^3.5.0 | Tailwind class merging |
| tw-animate-css | ^1.4.0 | Tailwind animations |
| xlsx | ^0.18.5 | Excel file generation |

### Development Dependencies (10 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| @tailwindcss/postcss | ^4 | Tailwind PostCSS plugin |
| @types/bcryptjs | ^2.4.6 | TypeScript types for bcryptjs |
| @types/node | ^20 | Node.js type definitions |
| @types/react | ^19 | React type definitions |
| @types/react-dom | ^19 | React DOM type definitions |
| eslint | ^9 | JavaScript/TypeScript linter |
| eslint-config-next | 16.2.0 | Next.js ESLint config |
| tailwindcss | ^4 | Tailwind CSS framework |
| tsx | ^4.21.0 | TypeScript execution (for scripts) |
| typescript | ^5 | TypeScript compiler |

---

## TypeScript Configuration

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/tsconfig.json`

**Key Settings:**
- **Target:** ES2017
- **Module:** esnext with bundler resolution
- **Strict Mode:** Enabled
- **JSX:** react-jsx (React 19 transform)
- **Path Aliases:** `@/*` maps to project root
- **Incremental:** Enabled for faster builds
- **Plugins:** Next.js TypeScript plugin

**Includes:**
- All `.ts`, `.tsx`, `.mts` files
- Next.js type definitions (`.next/types/**/*.ts`)

**Excludes:**
- `node_modules`

---

## Next.js Configuration

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
};

module.exports = {
  allowedDevOrigins: ['100.86.123.127'],
};
```

**Key Features:**
- Turbopack enabled (Next.js 16 bundler)
- Custom dev origin allowed: `100.86.123.127` (likely Tailscale/VPN)

**Breaking Changes Warning:**
- AGENTS.md warns: "This is NOT the Next.js you know"
- Next.js 16.2.0 has breaking changes from training data
- Developers must read `node_modules/next/dist/docs/` before coding

---

## shadcn/ui Configuration

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/components.json`

**Settings:**
- **Style:** base-nova
- **RSC:** Enabled (React Server Components)
- **TSX:** Enabled
- **Base Color:** neutral
- **CSS Variables:** Enabled
- **Icon Library:** lucide
- **RTL:** Disabled

**Path Aliases:**
- `@/components` → components directory
- `@/lib` → lib directory
- `@/hooks` → hooks directory
- `@/ui` → components/ui directory

**Installed Components:**
- button, table, card, input, label, badge, select, tabs, dialog, skeleton, sonner

---

## Vercel Deployment Configuration

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/vercel.json`

**Settings:**
- **Framework:** Next.js
- **Region:** fra1 (Frankfurt, Germany)
- **Build Command:** `npm run build`
- **Dev Command:** `npm run dev`
- **Install Command:** `npm install`

**API Functions:**
- **Runtime:** Node.js 22.x
- **Memory:** 512 MB
- **Max Duration:** 10 seconds
- **Pattern:** All files in `app/api/**/*.ts`

**HTTP Headers:**
- All `/api/*` routes:
  - `Cache-Control: no-store, must-revalidate`
  - `X-Content-Type-Options: nosniff`

---

## Build & Development Scripts

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/package.json`

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server (http://localhost:3000) |
| `build` | `next build` | Build for production |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint linter |

**Additional Scripts:**
- Seed database: `npx tsx scripts/seed-products.ts`

---

## Environment Variables

**Required Variables:**

| Variable | Purpose | Source |
|----------|---------|--------|
| `TURSO_DATABASE_URL` | Turso database connection URL | Turso CLI: `turso db show <db-name> --url` |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Turso CLI: `turso db tokens create <db-name>` |

**Fallback Behavior:**
- If both variables missing: uses `file:local.db` (local SQLite)
- If only URL provided: connects without auth token
- Configured in: `/home/sieu/ICT/ICT-PO/sale-stock-po-app/lib/db.ts`

**Environment File:**
- `.env.local` (not committed, in .gitignore)
- No `.env.local.example` file found in repository

---

## Database Schema

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/lib/schema.sql`

**Tables (7):**
1. `app_config` - Key/value store (PIN hash)
2. `products` - Product catalog (25 Exeol pharmaceuticals)
3. `customers` - Hospital customers (10 hospitals)
4. `forecasts` - Monthly demand forecasts (customer × product × month)
5. `stock` - Current inventory with LOT/expiry tracking
6. `stock_adjustments` - Stock change audit log
7. `purchase_orders` - PO headers with status lifecycle
8. `po_items` - PO line items (product × pallets)

**Indexes (9):**
- Optimized for forecast queries (product, customer, month)
- Stock lookups by product
- PO item lookups by PO and product
- Stock adjustment history by product and date

**Migration Strategy:**
- Auto-migration on app startup via `/api/init`
- Schema applied by `lib/init.ts`
- Seed script includes inline schema for standalone execution

---

## Seed Data

**File:** `/home/sieu/ICT/ICT-PO/sale-stock-po-app/scripts/seed-products.ts`

**Products (25):**
- Exeol pharmaceutical disinfectants and sanitizers
- Categories: OPA, GTA, Surface cleaners, Hand sanitizers, Lab disinfectants
- Sizes: 500mL, 1L, 5L bottles; 100/200-piece wipes
- Pricing: €3.20 - €24.60 EXW
- Packing: 60-288 units per pallet

**Customers (10):**
- Vietnamese hospitals across 3 regions:
  - MB (Northern): 5 hospitals (An Bình, Chợ Rẫy, Bạch Mai, Việt Đức, 108)
  - MN (Central): 4 hospitals (Đa khoa TW, Hữu nghị, Quân y 103, Nhi TW)
  - MN-South: 1 hospital (Chợ Rẫy Miền Trung)

**Execution:**
```bash
npx tsx scripts/seed-products.ts
```

---

## Project Structure

```
sale-stock-po-app/
├── app/
│   ├── (app)/              # Protected routes (PIN required)
│   │   ├── page.tsx        # Dashboard
│   │   ├── forecasts/      # Forecast entry grid
│   │   ├── rollforward/    # Stock rollforward timeline
│   │   ├── po-suggest/     # PO suggestion engine
│   │   ├── po/             # PO management (list, new, [id])
│   │   ├── settings/       # Settings page
│   │   └── master-data/    # Product/customer management
│   ├── api/                # API routes (15 endpoints)
│   ├── login/              # PIN login page
│   ├── setup/              # First-time PIN setup
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── layout/             # Navigation components
│   ├── forecasts/          # Forecast grid components
│   ├── master-data/        # Master data components
│   ├── stock/              # Stock management components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── db.ts               # Turso client singleton
│   ├── schema.sql          # Database schema
│   ├── init.ts             # Auto-migration logic
│   ├── calculations.ts     # Rollforward engine + PO suggestions
│   ├── session.ts          # PIN authentication
│   ├── export.ts           # Excel export utilities
│   ├── export-po.ts        # PO-specific exports
│   ├── master-data-sheet.ts # Master data exports
│   ├── stock-adjustments.ts # Stock adjustment logic
│   └── utils.ts            # Utility functions
├── scripts/
│   └── seed-products.ts    # Database seed script
├── docs/                   # Root-level documentation
├── .gitignore              # Git ignore patterns
├── components.json         # shadcn/ui config
├── next.config.ts          # Next.js config
├── package.json            # Dependencies & scripts
├── postcss.config.js       # PostCSS config
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel deployment config
├── AGENTS.md               # AI agent instructions
├── CLAUDE.md               # Claude-specific instructions
├── README.md               # Basic Next.js readme
└── SETUP.md                # Detailed setup guide
```

---

## Documentation Coverage Assessment

### Excellent Coverage

**SETUP.md** (156 lines)
- Complete step-by-step setup instructions
- Prerequisites, dependencies, Turso setup
- Database migration and seeding
- Vercel deployment guide
- First-time usage walkthrough
- Dev commands reference
- Folder structure overview

**onboarding-guide.md** (174 lines)
- User-facing onboarding for sale managers
- PIN setup instructions
- Feature walkthroughs (forecasts, rollforward, PO management)
- Color-coded status explanations
- Troubleshooting guide
- Backup instructions

**system-architecture.md** (42 lines)
- Tech stack overview
- Data model summary
- Key business constraints
- API architecture
- Deployment configuration

**project-roadmap.md** (48 lines)
- Phase-by-phase development history
- Completion status (v1.0.0 complete)
- Future enhancement ideas (out of scope)

**project-changelog.md** (21 lines)
- v1.0.0 release notes
- Complete feature list
- Added functionality summary

### Adequate Coverage

**README.md** (37 lines)
- Standard Next.js boilerplate
- Basic dev server instructions
- Generic Next.js learning resources
- Could be enhanced with project-specific content

**AGENTS.md** (5 lines)
- Critical warning about Next.js 16 breaking changes
- Directs developers to read official docs
- Minimal but important

**CLAUDE.md** (1 line)
- References AGENTS.md
- Could be expanded with project-specific AI instructions

### Missing Documentation

- **API Documentation:** No API endpoint reference
- **Component Documentation:** No component usage guide
- **Testing Documentation:** No test strategy or examples
- **Deployment Troubleshooting:** No production issue guide
- **Environment Variables:** No `.env.local.example` file
- **Contributing Guide:** No contribution guidelines
- **Security Documentation:** No security best practices guide

---

## Development Workflow

### Initial Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up Turso database (create account, database, get credentials)
4. Create `.env.local` with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
5. Run dev server: `npm run dev`
6. Visit `http://localhost:3000` → redirected to `/setup`
7. Set 6-digit PIN
8. Seed database: `npx tsx scripts/seed-products.ts`

### Daily Development
1. Start dev server: `npm run dev`
2. Login with PIN at `http://localhost:3000/login`
3. Make code changes (auto-reload enabled)
4. Run linter: `npm run lint`
5. Build for production: `npm run build`

### Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Add environment variables:
   - `vercel env add TURSO_DATABASE_URL`
   - `vercel env add TURSO_AUTH_TOKEN`
4. Deploy: `vercel deploy`

---

## Security & Authentication

**Authentication Method:**
- 6-digit PIN (numbers only)
- bcrypt hashing with salt rounds
- httpOnly cookie (30-day session)
- No multi-user support (single sale manager)

**Session Management:**
- Cookie name: (not specified in docs)
- Session duration: 30 days
- Logout: Clear cookie
- PIN reset: Requires developer intervention

**API Security:**
- All `/api/*` routes check PIN cookie
- No CORS configuration (same-origin only)
- Cache-Control headers prevent caching sensitive data
- X-Content-Type-Options prevents MIME sniffing

**Data Security:**
- PIN stored as bcrypt hash in `app_config` table
- No encryption at rest (relies on Turso security)
- No audit logging for data changes (except stock adjustments)
- Backup via JSON export (manual process)

---

## Key Business Constraints

| Constraint | Value | Impact |
|------------|-------|--------|
| **Lead Time** | 5 months | Order must be placed 5 months before arrival |
| **Container Sizes** | 22 or 44 pallets | All shipments must match these sizes |
| **Minimum Order** | 1 pallet per product | Cannot order partial pallets |
| **Planning Horizon** | 8 months rolling | Forecast and rollforward cover 8 months |
| **Regions** | MB, MN, MN-South | Vietnamese hospital distribution regions |

---

## API Architecture

**Total Endpoints:** 15 API routes in `/app/api/`

**Authentication:**
- All routes guarded by PIN cookie check
- Unauthorized requests redirected to `/login`

**Key Endpoints:**
- `/api/init` - Auto-migration on startup
- `/api/rollforward` - Server-side rollforward calculation
- `/api/forecasts` - CRUD for monthly forecasts
- `/api/purchase-orders` - PO lifecycle management
- `/api/products` - Product catalog CRUD
- `/api/customers` - Customer CRUD
- `/api/stock` - Inventory management

**Computation Strategy:**
- Rollforward: Server-side (complex SQL aggregations)
- PO Suggestions: Client-side (from rollforward data)
- Excel Export: Client-side (xlsx library)

---

## Deployment Configuration

**Platform:** Vercel Hobby (free tier)

**Region:** Frankfurt (fra1)
- Closest to France (manufacturer location)
- Low latency for European users

**Runtime:**
- Node.js 22.x (latest LTS)
- 512 MB memory per function
- 10-second timeout (adequate for API routes)

**Database:**
- Turso (libSQL) - serverless SQLite
- Free tier: 500 MB storage, 1 billion row reads/month
- Edge replication available (not configured)

**Performance:**
- Cold start: Expected on free tier
- Cache-Control: Disabled for all API routes (data freshness)
- Static assets: Cached by Vercel CDN

---

## Unresolved Questions

1. **Environment Variables:**
   - Should we create `.env.local.example` for easier setup?
   - Are there any other environment variables needed?

2. **API Documentation:**
   - Should we document all 15 API endpoints?
   - What's the request/response schema for each?

3. **Testing:**
   - Are there any tests written?
   - What's the testing strategy (unit, integration, e2e)?

4. **Error Handling:**
   - How are API errors handled and logged?
   - Is there error monitoring (Sentry, etc.)?

5. **Backup & Recovery:**
   - Is JSON export the only backup method?
   - How to restore from backup?
   - Is there a disaster recovery plan?

6. **Multi-tenancy:**
   - Is multi-user support planned?
   - How would role-based access work?

7. **Mobile Support:**
   - Is the UI responsive for mobile devices?
   - Is a mobile app planned (mentioned in roadmap)?

8. **Internationalization:**
   - UI is in English, but customers are Vietnamese
   - Should we add i18n support?

---

## Summary

**Strengths:**
- Well-structured Next.js 16 project with modern stack
- Comprehensive setup and onboarding documentation
- Clear business domain modeling (pharmaceutical distribution)
- Production-ready deployment configuration
- Solid TypeScript and ESLint setup
- Auto-migration and seeding scripts

**Areas for Improvement:**
- Missing `.env.local.example` file
- No API endpoint documentation
- No testing infrastructure
- Generic README.md (could be project-specific)
- No error monitoring or logging strategy
- Limited security documentation

**Overall Assessment:**
The project has excellent configuration coverage and strong documentation for setup and user onboarding. The tech stack is modern and well-configured. Main gaps are in API documentation, testing, and operational concerns (monitoring, logging, disaster recovery).

---

**Report Generated:** 2026-05-04  
**Scout Agent:** Claude Code Explore  
**Files Analyzed:** 15 configuration files, 4 documentation files, 1 seed script
