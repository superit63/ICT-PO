# ICT-PO — Sale Stock & Purchase Order Management

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-05-04

Modern web application for pharmaceutical distribution management, replacing Excel-based workflows with automated stock forecasting, rollforward calculations, and purchase order suggestions.

---

## Overview

ICT-PO is a cloud-based inventory and purchase order management system designed for Exeol pharmaceutical distribution to Vietnamese hospitals. The system automates the complex 5-month lead time planning process, providing real-time stock projections and intelligent PO recommendations.

**Key Features:**
- 8-month rolling stock forecast with color-coded status indicators
- Automated purchase order suggestions based on projected stockouts
- Real-time rollforward calculations (stock + incoming PO - forecast)
- Excel import/export for master data and reports
- Lot number and expiry date tracking
- Complete audit trail for stock adjustments
- PIN-based authentication with secure session management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.0, React 19.2.4, TypeScript 5.x |
| **UI Framework** | Tailwind CSS 4.x, shadcn/ui (base-nova), Lucide icons |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | Turso (libSQL/SQLite) via @libsql/client |
| **Authentication** | bcryptjs (6-digit PIN, httpOnly cookies) |
| **Deployment** | Vercel (Frankfurt region, Node.js 22.x) |
| **Data Export** | SheetJS (xlsx) for Excel generation |

---

## Quick Start

### Prerequisites
- Node.js 22.x or later
- npm or yarn package manager
- Turso account (free tier available)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ICT-PO/sale-stock-po-app

# Install dependencies
npm install

# Set up environment variables
cp ../.env.local.example .env.local
# Edit .env.local with your Turso credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` and follow the setup wizard to create your PIN.

### Database Setup

```bash
# Create Turso database
turso db create ict-po-db

# Get connection URL
turso db show ict-po-db --url

# Create auth token
turso db tokens create ict-po-db

# Add credentials to .env.local
TURSO_DATABASE_URL=<your-url>
TURSO_AUTH_TOKEN=<your-token>

# Seed initial data (25 products + 10 customers)
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
│   │   ├── po/             # PO management
│   │   ├── stock/          # Stock control
│   │   ├── master-data/    # Product/customer management
│   │   └── settings/       # Settings & backup
│   ├── api/                # 15 API endpoints
│   ├── login/              # PIN login page
│   └── setup/              # First-time PIN setup
├── components/
│   ├── ui/                 # 11 shadcn/ui primitives
│   ├── layout/             # Navigation components
│   ├── forecasts/          # Forecast grid components
│   ├── master-data/        # Master data managers
│   └── stock/              # Stock management components
├── lib/
│   ├── db.ts               # Database client singleton
│   ├── calculations.ts     # Rollforward & PO algorithms
│   ├── session.ts          # Authentication utilities
│   ├── export.ts           # Excel export utilities
│   └── init.ts             # Auto-migration logic
├── scripts/
│   └── seed-products.ts    # Database seeding
└── docs/                   # Comprehensive documentation
```

---

## Core Features

### 1. Dashboard
- Real-time status overview (OK/Low/Critical/Stockout counts)
- 8-month product status sparkline
- Open PO value tracking
- Quick access to critical products

### 2. Forecast Management
- Editable grid (customer × product × month)
- Debounced auto-save (500ms)
- Row/column/grand totals
- Product and customer filtering
- Excel export

### 3. Stock Rollforward
- 8-month balance projection per product
- Color-coded status cells (🟢🟡🟠🔴)
- Breakdown: Current Stock + Incoming PO - Forecast = Balance
- Month-by-month navigation

### 4. PO Suggestions
- Automated pallet calculation based on stockouts
- Container optimization (22 or 44 pallets)
- Urgency classification (Critical/Warning)
- One-click PO creation with pre-filled data

### 5. PO Management
- Full lifecycle tracking (Ordered → Confirmed → In Transit → Received)
- Line item management
- Mark Received workflow with lot/expiry entry
- Auto-stock creation on receipt

### 6. Stock Control
- Lot number and expiry date tracking
- Stock adjustment history (audit trail)
- Expiry status indicators
- Manual adjustment with reason tracking

### 7. Master Data
- Product catalog management (CRUD + bulk import)
- Customer management (CRUD + bulk import)
- Excel import with flexible column mapping
- Excel export for reporting

---

## Business Constraints

| Constraint | Value | Impact |
|------------|-------|--------|
| **Lead Time** | 5 months | Orders must be placed 5 months before arrival |
| **Container Sizes** | 22 or 44 pallets | All shipments must match these configurations |
| **Minimum Order** | 1 pallet per product | Cannot order partial pallets |
| **Planning Horizon** | 8 months rolling | Forecast and rollforward cover 8 months |
| **Regions** | MB, MN, MN-South | Vietnamese hospital distribution regions |

---

## Development

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

Required variables in `.env.local`:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

Fallback: If both variables are missing, uses `file:local.db` for local SQLite.

---

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add environment variables
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# Deploy
vercel deploy --prod
```

**Configuration:** See `vercel.json` for deployment settings (Node 22 runtime, Frankfurt region, 512MB memory, 10s timeout).

---

## Documentation

Comprehensive documentation available in `/docs`:

- **[Project Overview & PDR](./docs/project-overview-pdr.md)** — Product vision, requirements, success metrics
- **[System Architecture](./docs/system-architecture.md)** — Tech stack, data model, API architecture
- **[Codebase Summary](./docs/codebase-summary.md)** — Directory structure, file organization, LOC counts
- **[Code Standards](./docs/code-standards.md)** — Naming conventions, patterns, best practices
- **[API Reference](./docs/api-reference.md)** — REST API endpoints, auth, request/response examples
- **[Testing Strategy](./docs/testing-strategy.md)** — Unit/E2E test approach, commands, CI behavior
- **[Contributing Guide](./docs/contributing.md)** — Setup, workflow, validation, PR checklist
- **[Project Roadmap](./docs/project-roadmap.md)** — Development phases, completion status
- **[Onboarding Guide](./docs/onboarding-guide.md)** — User-facing setup and feature walkthrough
- **[Project Changelog](./docs/project-changelog.md)** — Version history and feature additions

---

## Testing

```bash
cd sale-stock-po-app
npm run test              # Unit tests
npm run test:coverage     # Unit tests with coverage report
npm run test:e2e          # Playwright E2E tests
```

See [Testing Strategy](./docs/testing-strategy.md) for full guidance.

---

## Security

- **Authentication:** 6-digit PIN with bcrypt hashing (salt rounds)
- **Session Management:** httpOnly cookies, 30-day expiration
- **API Security:** All `/api/*` routes require valid session cookie
- **SQL Injection Prevention:** Parameterized queries throughout
- **Headers:** `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`

**Note:** Single-user system (sale manager only). No multi-user or role-based access control.

---

## Support

For technical issues or questions:
- Review documentation in `/docs`
- Check troubleshooting section in [Onboarding Guide](./docs/onboarding-guide.md)
- Contact development team

---

## License

Private project — not for public distribution.

---

**Built with ❤️ for Exeol pharmaceutical distribution**
