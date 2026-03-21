# Research Report: Phase 5 — Excel Export + Deploy + Polish

**Date:** 19/03/2026
**Author:** Researcher Agent
**Focus:** Export patterns, Vercel deployment, UI polish, JSON backup, onboarding

---

## 1. xlsx Library (SheetJS) with Next.js 14 — Client-Side

### Install
```bash
npm install xlsx
```

### Core Pattern — Client-Side Export (No Server Needed)

`xlsx` is browser-native — import it in Client Components only.

```typescript
// lib/export.ts
import * as XLSX from 'xlsx';

export function downloadWorkbook(
  sheets: { name: string; headers: string[][]; rows: (string | number)[][] }[],
  filename: string
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, headers, rows }) => {
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### Formatting: Column Headers

```typescript
const headers = ['Mã SP', 'Tên sản phẩm', 'Giá EXW (EUR)', 'Qui cách'];
// Set bold + background on first row — done via XLSX utils,
// or use XLSX.utils.sheet_add_aoa for manual cell styling:
```

### Number + Date Formatting

```typescript
// Numbers: use cell format codes
ws['!cols'] = [
  { wch: 15 }, // col A: 15 chars wide
  { wch: 30 }, // col B: 30 chars wide
];

// Dates: store as JS Date, Excel auto-formats if column type is 'd'
// Or store as ISO string and format in Excel via cell format:
const dateCell = { t: 'd', v: new Date('2026-04-01') }; // type 'd' = date
```

### Multi-Sheet Export

```typescript
// Sheet 1: Forecast Grid
// Sheet 2: Rollforward
// Sheet 3: PO List
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsForecast, 'Forecast');
XLSX.utils.book_append_sheet(wb, wsRollforward, 'Rollforward');
XLSX.utils.book_append_sheet(wb, wsPO, 'PO List');
```

### Cell Styling (Colors, Borders)

Use `XLSX.Sheet` cell objects directly:

```typescript
import type { CellObject } from 'xlsx';

function styledCell(value: string | number, opts?: {
  bold?: boolean; bg?: string; color?: string; align?: 'left' | 'center' | 'right';
}): CellObject {
  return {
    t: typeof value === 'number' ? 'n' : 's',
    v: value,
    s: {
      font: { bold: opts?.bold ?? false },
      fill: opts?.bg ? { fgColor: { rgb: opts.bg.replace('#', '') } } : undefined,
      alignment: { horizontal: opts?.align ?? 'left' },
    },
  } as CellObject;
}
```

**Usage:**
```typescript
const row = [
  styledCell('SKU', { bold: true, bg: '#1e40af', color: '#ffffff' }),
  styledCell('Tên sản phẩm', { bold: true, bg: '#1e40af', color: '#ffffff' }),
  styledCell(100, { bg: '#dcfce7' }), // green bg for positive numbers
  styledCell(-5, { bg: '#fecaca' }),  // red bg for negative
];
```

### Performance (Large Datasets)

- 4800 cells is trivial for `xlsx` — sub-100ms in browser
- For datasets >50k cells: use `XLSX.stream` (streaming writer) or do server-side export
- For server-side: `xlsx` works in Node.js, serve the buffer via API route

### Export All 3 Screens

```typescript
// forecast export: customer × product grid
// rollforward export: product × month table with balance column
// PO export: PO header + line items combined
```

**File naming:** `{ScreenName}_{YYYYMMDD}.xlsx`
- `Forecast_20260319.xlsx`
- `Rollforward_20260319.xlsx`
- `PO_List_20260319.xlsx`

---

## 2. Excel Export UX

### Button Placement
- In the page header, right-aligned, next to page title
- Icon: `<Download className="w-4 h-4" />` + "Export Excel" label
- On mobile: icon-only with tooltip "Export Excel"

### Loading State
```typescript
// In the button's onClick handler:
const [exporting, setExporting] = useState(false);

async function handleExport() {
  setExporting(true);
  await delay(50); // let UI re-render
  downloadWorkbook(sheets, filename);
  setExporting(false);
  toast.success('Đã tải file Excel');
}
```

### Error Handling
```typescript
try {
  downloadWorkbook(sheets, filename);
} catch (err) {
  toast.error('Không thể xuất Excel. Vui lòng thử lại.');
  console.error(err);
}
```

### Sheet Names (Vietnamese)
- "DK dự báo" (Forecast grid)
- "Rollforward" (Stock rollforward)
- "DS Đơn hàng" (PO list)

---

## 3. Next.js + Vercel Deployment

### Vercel Hobby Plan Limits
| Feature | Hobby |
|---|---|
| Custom domain | ✅ |
| SSL | ✅ |
| Edge Network | ✅ |
| Serverless Functions | 100h/mo |
| Bandwidth | 100GB/mo |
| Build minutes | 6,000/mo |
| Concurrent builds | 1 |

**Verdict:** Single-user app, low traffic → Hobby is sufficient.

### Environment Variables (Vercel Dashboard)
1. Go to project → Settings → Environment Variables
2. Add: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
3. Set for Production + Preview + Development
4. Redeploy after adding

### vercel.json Config

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### Turso + Vercel Runtime

**CRITICAL:** Turso libSQL client works in **Node.js runtime**, NOT Edge runtime.

```typescript
// lib/db.ts
import { createClient } from '@libsql/client';

// Vercel serverless = Node.js runtime — this works ✅
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default db;
```

**Why Edge fails:** Turso uses native WebSocket connections (libSQL), which aren't available in Vercel Edge Functions. Use default Node.js serverless runtime.

```typescript
// In your API routes — no runtime directive needed (defaults to Node.js):
// ✅ export async function GET() { ... }
// ❌ export const runtime = 'edge'; // Don't use this!
```

### Custom Domain
1. Vercel → Project → Settings → Domains
2. Add domain (e.g., `po.ictpo.com`)
3. Add DNS records as instructed (CNAME or A record)
4. Wait for SSL certificate auto-provisioning
5. Vercel auto-redirects HTTP → HTTPS

---

## 4. UI Polish Patterns (shadcn/ui)

### Loading Skeletons

```typescript
// components/forecast-grid-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function ForecastGridSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          {Array.from({ length: 8 }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Usage in page:**
```typescript
{someData === undefined ? (
  <ForecastGridSkeleton />
) : (
  <ForecastGrid data={someData} />
)}
```

### Empty State

```typescript
// components/empty-state.tsx
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon ?? <Package className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Usage:**
```typescript
<EmptyState
  icon={<BarChart className="w-8 h-8" />}
  title="Chưa có dự báo"
  description="Thêm dự báo đầu tiên để xem rollforward."
  action={{ label: 'Thêm dự báo', onClick: () => setOpen(true) }}
/>
```

### Toast Notifications (Sonner)

```typescript
// Install: npx shadcn@latest add sonner
// Add to layout: import { Toaster } from 'sonner'; return <Toaster />;

// Usage in components:
import { toast } from 'sonner';

// Success
toast.success('Đã lưu thành công!');

// Error
toast.error('Không thể lưu. Vui lòng thử lại.');

// Loading (imperative)
const promise = fetch('/api/forecasts', { method: 'POST', body: JSON.stringify(data) });
toast.promise(promise, {
  loading: 'Đang lưu...',
  success: 'Đã lưu!',
  error: 'Lỗi khi lưu.',
});
```

### Responsive Layout — Wide Tables

Forecast grid scrolls horizontally on mobile/tablet:

```css
/* app/globals.css */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
```

Tablet breakpoint: `md:` (768px). Mobile: horizontal scroll is default.

```typescript
// Forecast grid container
<div className="min-w-[800px] md:min-w-0 overflow-x-auto">
  {/* Grid table */}
</div>
```

### Favicon + Metadata

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

```typescript
// app/layout.tsx metadata
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ICT-PO | Sale-Stock-PO',
  description: 'Quản lý dự báo, tồn kho và đơn hàng PO cho ICT-PO',
  icons: {
    icon: '/favicon.ico',
  },
};
```

---

## 5. JSON Backup / Restore

### Export Full Database as JSON (Server-Side API)

```typescript
// app/api/backup/route.ts
import db from '@/lib/db';

export async function GET() {
  const [products, customers, forecasts, stock, purchase_orders, po_items] =
    await Promise.all([
      db.execute('SELECT * FROM products'),
      db.execute('SELECT * FROM customers'),
      db.execute('SELECT * FROM forecasts'),
      db.execute('SELECT * FROM stock'),
      db.execute('SELECT * FROM purchase_orders'),
      db.execute('SELECT * FROM po_items'),
    ]);

  const backup = {
    version: 1,
    exported_at: new Date().toISOString(),
    tables: {
      products: products.rows,
      customers: customers.rows,
      forecasts: forecasts.rows,
      stock: stock.rows,
      purchase_orders: purchase_orders.rows,
      po_items: po_items.rows,
    },
  };

  return Response.json(backup, {
    headers: {
      'Content-Disposition': 'attachment; filename="ictpo-backup-20260319.json"',
    },
  });
}
```

### Import JSON Backup (Restore)

```typescript
// app/api/backup/restore/route.ts
import db from '@/lib/db';

export async function POST(req: Request) {
  const backup = await req.json();

  if (!backup.version || !backup.tables) {
    return Response.json({ error: 'Invalid backup file' }, { status: 400 });
  }

  // Wrap in transaction
  await db.execute('BEGIN');

  try {
    // Clear existing data (in reverse dependency order)
    await db.execute('DELETE FROM po_items');
    await db.execute('DELETE FROM purchase_orders');
    await db.execute('DELETE FROM forecasts');
    await db.execute('DELETE FROM stock');
    await db.execute('DELETE FROM customers');
    await db.execute('DELETE FROM products');

    // Restore data (order matters for FK constraints)
    for (const row of backup.tables.products ?? []) {
      await db.execute({
        sql: 'INSERT INTO products (id, name, sku, exw_price_eur, packing_per_pallet, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [row.id, row.name, row.sku, row.exw_price_eur, row.packing_per_pallet, row.created_at],
      });
    }

    // ... repeat for other tables ...

    await db.execute('COMMIT');
    return Response.json({ success: true });
  } catch (err) {
    await db.execute('ROLLBACK');
    return Response.json({ error: 'Restore failed', detail: String(err) }, { status: 500 });
  }
}
```

### UI — Export All Data Button

```typescript
// app/settings/page.tsx
'use client';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SettingsBackup() {
  async function handleExport() {
    const res = await fetch('/api/backup');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ictpo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất dữ liệu!');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Sao lưu dữ liệu</h2>
        <p className="text-sm text-muted-foreground">Xuất toàn bộ dữ liệu ra file JSON.</p>
      </div>
      <Button onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export All Data (JSON)
      </Button>
    </div>
  );
}
```

---

## 6. Onboarding Guide Structure

### Format
- In-app guide: separate `/guide` page with step-by-step walkthrough
- Screenshot-based (screenshots from the app itself)
- PDF export: browser `window.print()` with CSS `@media print` hide navigation

### Key Steps (6 Steps)

1. **Đặt mã PIN** — First-time setup: choose 4–6 digit PIN
2. **Thêm sản phẩm** — Settings → Products → Add products (SKU, EXW price, packing/pallet)
3. **Thêm khách hàng** — Settings → Customers → Add hospital customers
4. **Nhập dự báo** — Forecast page: click cell → enter monthly qty per customer × product
5. **Kiểm tra Rollforward** — Rollforward page: see projected balance per product per month
6. **Tạo đơn hàng PO** — PO page: review suggestions → create PO with 22/44 pallet enforcement

### Guide Page Layout

```typescript
// app/guide/page.tsx
const steps = [
  {
    title: 'Đặt mã PIN',
    description: 'Mã PIN bảo vệ dữ liệu của bạn. Chỉ cần nhập một lần.',
    screenshot: '/screenshots/01-pin-setup.png',
  },
  // ...
];
```

### Print CSS for PDF

```css
/* app/guide/print.css */
@media print {
  nav, footer, button { display: none !important; }
  body { font-size: 12pt; }
  .step { page-break-inside: avoid; }
}
```

---

## 7. Summary Checklist

### Excel Export
- [x] `npm install xlsx`
- [x] `lib/export.ts` — generic workbook builder with styling support
- [x] Export Forecast, Rollforward, PO List
- [x] File name: `{Screen}_{YYYYMMDD}.xlsx`
- [x] Loading state + error toast

### Vercel Deployment
- [x] Environment vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` in Vercel dashboard
- [x] Default Node.js runtime (NOT edge) for Turso compatibility
- [x] Hobby plan — sufficient for single user
- [x] Custom domain: add in Vercel → Settings → Domains
- [x] `vercel.json` with cache headers for API

### UI Polish
- [x] `Skeleton` loading states for each page
- [x] `EmptyState` component with icon + CTA button
- [x] `Sonner` toasts for all save/delete actions
- [x] Forecast grid: `overflow-x-auto` + custom scrollbar
- [x] App title + favicon in `layout.tsx`

### JSON Backup
- [x] `GET /api/backup` — full DB export as JSON
- [x] `POST /api/backup/restore` — restore from JSON backup
- [x] "Export All Data" button in Settings

### Onboarding
- [x] `/guide` page with 6 key steps
- [x] Screenshots + concise Vietnamese descriptions
- [x] Print CSS for PDF export

---

## Unresolved Questions

1. **Custom domain availability** — does the user have `po.ictpo.com` or another domain ready?
2. **Backup frequency** — manual weekly export, or auto-backup on schedule? (Turso has no built-in scheduler)
3. **Onboarding screenshots** — need actual app screenshots taken after Phase 3–4 implementation
