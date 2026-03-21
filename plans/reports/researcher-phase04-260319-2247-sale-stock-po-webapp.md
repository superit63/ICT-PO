# Research Report: Phase 4 — PO Suggestion Engine + PO Management

**Agent:** researcher | **Date:** 2026-03-19 | **Project:** Sale-Stock-PO Web App

---

## 1. PO Suggestion Algorithm

### Core Logic

For each product with rollforward balance < 0, calculate pallets needed, container fit, PO value, and urgency.

**Algorithm (TypeScript):**

```typescript
// lib/calculations.ts
import { ceil } from '@/lib/math-utils';

type Month = string; // "2026-04"
type Units = number;
type Pallets = number;

interface POSuggestion {
  productId: number;
  productName: string;
  packingPerPallet: number;
  exwPriceEur: number;
  firstStockoutMonth: Month;
  shortfallUnits: Units;
  palletsNeeded: Pallets;
  containerConfig: 22 | 44 | 'mixed';
  containerBreakdown: ContainerDetail[];
  poValueEur: number;
  urgency: 'critical' | 'warning';
  monthsToStockout: number;
}

interface ContainerDetail {
  size: 22 | 44;
  pallets: number;
  units: number;
}

function suggestPO(
  rollforward: RollforwardResult,
  currentMonth: Month
): POSuggestion | null {
  const firstDeficit = rollforward.entries.find(e => e.balance < 0);
  if (!firstDeficit) return null;

  const shortfallUnits = Math.abs(firstDeficit.balance);
  const packing = rollforward.packingPerPallet;
  const palletsNeeded = Math.ceil(shortfallUnits / packing);

  // Container optimization
  const containerBreakdown = optimizeContainers(palletsNeeded);
  const containerConfig: 22 | 44 | 'mixed' =
    palletsNeeded > 44 ? 'mixed'
    : palletsNeeded > 22 ? 44
    : 22;

  const poValueEur = palletsNeeded * packing * rollforward.exwPriceEur;

  // Urgency: critical if stockout within 2 months
  const currentIdx = rollforward.entries.findIndex(e => e.month === currentMonth);
  const stockoutIdx = rollforward.entries.findIndex(e => e.balance < 0);
  const monthsToStockout = stockoutIdx - currentIdx;
  const urgency = monthsToStockout <= 2 ? 'critical' : 'warning';

  return {
    productId: rollforward.productId,
    productName: rollforward.productName,
    packingPerPallet: packing,
    exwPriceEur: rollforward.exwPriceEur,
    firstStockoutMonth: firstDeficit.month,
    shortfallUnits,
    palletsNeeded,
    containerConfig,
    containerBreakdown,
    poValueEur,
    urgency,
    monthsToStockout,
  };
}
```

### Container Optimization

```typescript
function optimizeContainers(palletsNeeded: Pallets): ContainerDetail[] {
  const containers: ContainerDetail[] = [];
  let remaining = palletsNeeded;

  // Prefer 44-pallet containers first, then top up with 22
  if (remaining >= 44) {
    const count44 = Math.floor(remaining / 44);
    remaining = remaining % 44;
    for (let i = 0; i < count44; i++) {
      containers.push({ size: 44, pallets: 44, units: 44 * packingPerPallet });
    }
  }

  // Top up with one 22-pallet container if needed (and fits)
  if (remaining > 0) {
    if (remaining <= 22) {
      containers.push({ size: 22, pallets: remaining, units: remaining * packingPerPallet });
    } else {
      containers.push({ size: 44, pallets: remaining, units: remaining * packingPerPallet });
    }
  }

  return containers;
}
```

---

## 2. React Hook Form + Zod Pattern for PO Creation

### Zod Schema

```typescript
// lib/validators/po-schema.ts
import { z } from 'zod';

export const poCreateSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  qtyPallets: z
    .number()
    .int()
    .min(1, 'Minimum 1 pallet')
    .max(100, 'Maximum 100 pallets'),
  orderDate: z.date({ required_error: 'Order date is required' }),
  arrivalMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  notes: z.string().optional(),
});

// Derive type from schema
export type POFormValues = z.infer<typeof poCreateSchema>;
```

### React Hook Form + Zod Integration (Next.js 14 App Router)

```typescript
// app/po/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { poCreateSchema, POFormValues } from '@/lib/validators/po-schema';
import { format, addMonths } from 'date-fns';

export default function NewPOPage() {
  const currentMonth = getCurrentPlanningMonth(); // from context/store

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<POFormValues>({
    resolver: zodResolver(poCreateSchema),
    defaultValues: {
      qtyPallets: 1,
      orderDate: new Date(),
      arrivalMonth: format(addMonths(new Date(), 5), 'yyyy-MM'),
    },
  });

  const qtyPallets = watch('qtyPallets');
  const selectedProduct = watch('productId');

  // Derived: PO value preview
  const selectedProductData = getProductById(selectedProduct);
  const totalUnits = qtyPallets * (selectedProductData?.packingPerPallet ?? 0);
  const overshootUnits = shortfallUnits > 0 ? totalUnits - shortfallUnits : 0;
  const poValueEur = totalUnits * (selectedProductData?.exwPriceEur ?? 0);

  // Auto-fill arrival month when order date changes
  const orderDate = watch('orderDate');
  useEffect(() => {
    if (orderDate) {
      setValue('arrivalMonth', format(addMonths(orderDate, 5), 'yyyy-MM'));
    }
  }, [orderDate, setValue]);

  // Container warning
  const containerWarning =
    qtyPallets > 0 && qtyPallets !== 22 && qtyPallets !== 44
      ? `⚠️ Container warning: ${qtyPallets} pallets will not fill a standard 22- or 44-pallet container.`
      : null;

  async function onSubmit(data: POFormValues) {
    const res = await fetch('/api/po', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) redirect('/po');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* PO number display (auto-generated, read-only) */}
      <PONumberDisplay />

      {/* Product selector */}
      <ProductSelect register={register} errors={errors} />

      {/* Qty pallets */}
      <div>
        <label>Qty Pallets</label>
        <input type="number" {...register('qtyPallets', { valueAsNumber: true })} min={1} />
        {errors.qtyPallets && <span>{errors.qtyPallets.message}</span>}
      </div>

      {/* Container warning */}
      {containerWarning && <Alert type="warning">{containerWarning}</Alert>}

      {/* Overshoot warning */}
      {overshootUnits > 0 && (
        <Alert type="info">
          Ordering {qtyPallets} pallets = {totalUnits} units
          (overshoot by {overshootUnits} units vs suggested {suggestedPallets})
        </Alert>
      )}

      {/* Order date */}
      <input type="date" {...register('orderDate')} />

      {/* Arrival month (auto-filled, read-only with override) */}
      <div>
        <label>Arrival Month</label>
        <input {...register('arrivalMonth')} readOnly />
        <span className="text-xs text-gray-500">Auto: order month + 5</span>
      </div>

      {/* PO value preview */}
      {selectedProduct && (
        <POValuePreview
          pallets={qtyPallets}
          units={totalUnits}
          exwPrice={selectedProductData.exwPriceEur}
          valueEur={poValueEur}
        />
      )}

      <button type="submit" disabled={isSubmitting}>
        Create PO
      </button>
    </form>
  );
}
```

### Shadcn/Zod Form Pattern (alternative using UI components)

```typescript
// components/forms/po-create-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const form = useForm<POFormValues>({
  resolver: zodResolver(poCreateSchema),
  defaultValues: { qtyPallets: 1 },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="productId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product</FormLabel>
          <Select onValueChange={(v) => field.onChange(Number(v))}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    {/* ... qtyPallets, orderDate fields similarly ... */}
    <Button type="submit">Create PO</Button>
  </form>
</Form>
```

---

## 3. PO Status State Machine

### Status Flow

```
ordered → confirmed → in_transit → received
```

### DB Schema

```sql
CREATE TABLE po_status_log (
  id INTEGER PRIMARY KEY,
  po_id INTEGER REFERENCES po(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  changed_by TEXT,
  notes TEXT
);
```

### State Machine Logic

```typescript
// lib/po-state-machine.ts

type POStatus = 'ordered' | 'confirmed' | 'in_transit' | 'received';

const STATUS_TRANSITIONS: Record<POStatus, POStatus | null> = {
  ordered: 'confirmed',
  confirmed: 'in_transit',
  in_transit: 'received',
  received: null, // terminal state
};

const STATUS_LABELS: Record<POStatus, string> = {
  ordered: 'Ordered',
  confirmed: 'Confirmed',
  in_transit: 'In Transit',
  received: 'Received',
};

const STATUS_COLORS: Record<POStatus, string> = {
  ordered: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  received: 'bg-green-100 text-green-800',
};

function canTransition(current: POStatus, next: POStatus): boolean {
  return STATUS_TRANSITIONS[current] === next;
}

function getNextStatus(current: POStatus): POStatus | null {
  return STATUS_TRANSITIONS[current];
}

// API: advance status
async function advancePOStatus(poId: number, newStatus: POStatus) {
  const po = await db.po.findUnique({ where: { id: poId } });
  if (!canTransition(po.status, newStatus)) {
    throw new Error(`Invalid transition: ${po.status} → ${newStatus}`);
  }

  await db.$transaction([
    db.po.update({ where: { id: poId }, data: { status: newStatus } }),
    db.poStatusLog.create({
      data: {
        poId,
        fromStatus: po.status,
        toStatus: newStatus,
        changedBy: getCurrentUser(),
      },
    }),
  ]);
}
```

### Receive PO Flow (auto-update stock)

```typescript
// lib/receive-po.ts

interface ReceivePOInput {
  poId: number;
  lotNumber: string;
  expiryDate: Date;
}

async function receivePO(input: ReceivePOInput) {
  const po = await db.po.findUnique({
    where: { id: input.poId },
    include: { items: { include: { product: true } } },
  });

  if (!po || po.status !== 'in_transit') {
    throw new Error('PO must be in_transit to receive');
  }

  await db.$transaction(async (tx) => {
    // 1. Update PO status
    await tx.po.update({
      where: { id: input.poId },
      data: {
        status: 'received',
        receivedAt: new Date(),
        lotNumber: input.lotNumber,
        expiryDate: input.expiryDate,
      },
    });

    // 2. Add units to stock table per item
    for (const item of po.items) {
      await tx.stockEntry.create({
        data: {
          productId: item.productId,
          poId: item.poId,
          qtyUnits: item.qtyUnits,
          lotNumber: input.lotNumber,
          expiryDate: input.expiryDate,
          receivedAt: new Date(),
          sourceType: 'po',
        },
      });
    }

    // 3. Log status change
    await tx.poStatusLog.create({
      data: {
        poId: input.poId,
        fromStatus: 'in_transit',
        toStatus: 'received',
        changedBy: getCurrentUser(),
        notes: `Lot: ${input.lotNumber}, Exp: ${input.expiryDate}`,
      },
    });
  });
}
```

### Receive PO Dialog

```typescript
// components/po/receive-po-dialog.tsx
'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function ReceivePODialog({ po, open, onClose, onReceive }: Props) {
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReceive() {
    setLoading(true);
    try {
      await onReceive({ poId: po.id, lotNumber, expiryDate: new Date(expiryDate) });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive PO {po.poNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Lot Number</label>
            <Input
              value={lotNumber}
              onChange={e => setLotNumber(e.target.value)}
              placeholder="e.g. LOT-2026-001"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Expiry Date</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600">
            This will add {po.totalUnits} units of {po.productName} to stock.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReceive} disabled={!lotNumber || !expiryDate || loading}>
            Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. PO Number Auto-Generation

### Format: `PO-YYYY-NNN`

Where `NNN` = sequential number for that year, zero-padded to 3 digits.

```typescript
// lib/po-number.ts

async function generatePONumber(year?: number): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const prefix = `PO-${y}-`;

  // Get the highest PO number for this year
  const lastPO = await db.po.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: 'desc' },
    select: { poNumber: true },
  });

  let nextNum = 1;
  if (lastPO) {
    const lastNum = parseInt(lastPO.poNumber.replace(prefix, ''), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
  // e.g. "PO-2026-001", "PO-2026-002", ...
}
```

### Usage in PO creation API

```typescript
// app/api/po/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const poNumber = await generatePONumber();

  const po = await db.po.create({
    data: {
      poNumber,
      productId: body.productId,
      qtyPallets: body.qtyPallets,
      orderDate: new Date(body.orderDate),
      arrivalMonth: body.arrivalMonth,
      status: 'ordered',
    },
    include: { product: true },
  });

  return Response.json(po, { status: 201 });
}
```

---

## 5. PO Management List + Detail UI

### PO List Table (TanStack Table)

```typescript
// app/po/page.tsx
'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const columnHelper = createColumnHelper<PO>();

const columns = [
  columnHelper.accessor('poNumber', {
    header: 'PO Number',
    cell: info => (
      <Link href={`/po/${info.row.original.id}`} className="font-mono underline">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('product.name', { header: 'Product' }),
  columnHelper.accessor('qtyPallets', {
    header: 'Pallets',
    cell: info => `${info.getValue()} plt`,
  }),
  columnHelper.accessor('orderDate', {
    header: 'Order Date',
    cell: info => format(new Date(info.getValue()), 'MMM yyyy'),
  }),
  columnHelper.accessor('arrivalMonth', { header: 'Arrives' }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => (
      <Badge className={STATUS_COLORS[info.getValue()]}>{STATUS_LABELS[info.getValue()]}</Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    cell: info => (
      <div className="flex gap-2">
        <StatusAdvanceButton po={info.row.original} />
        <Link href={`/po/${info.row.original.id}`}>
          <Button size="sm" variant="ghost">View</Button>
        </Link>
      </div>
    ),
  }),
];

// Filters
const statusFilter = [
  { value: 'all', label: 'All Status' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'received', label: 'Received' },
];

// PO Detail Page
// app/po/[id]/page.tsx
function PODetailPage({ params }: { params: { id: string } }) {
  const { po, isLoading } = usePO(Number(params.id));

  if (isLoading) return <Spinner />;
  if (!po) return <NotFound />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{po.poNumber}</h1>
          <p className="text-gray-500">{po.product.name} — {po.qtyPallets} pallets</p>
        </div>
        <Badge className={STATUS_COLORS[po.status]}>{STATUS_LABELS[po.status]}</Badge>
      </div>

      {/* Status advance buttons */}
      <StatusTransitionBar po={po} />

      {/* Inline editing of qty pallets */}
      <InlineQtyEdit poId={po.id} currentPallets={po.qtyPallets} />

      {/* Delete */}
      {po.status !== 'received' && (
        <DeletePOButton poId={po.id} onDeleted={() => redirect('/po')} />
      )}

      {/* Status log */}
      <StatusLogTable logs={po.statusLogs} />
    </div>
  );
}
```

### Delete PO Validation

```typescript
// Can't delete received POs
async function deletePO(poId: number) {
  const po = await db.po.findUnique({ where: { id: poId } });
  if (po.status === 'received') {
    throw new Error('Cannot delete a received PO. Received POs are permanent records.');
  }
  await db.po.delete({ where: { id: poId } });
}
```

---

## 6. Container Optimization Display

### Display Logic

```typescript
// components/po/container-display.tsx

interface Props {
  palletsNeeded: number;
  packing: number;
  shortfallUnits: number;
}

function ContainerDisplay({ palletsNeeded, packing, shortfallUnits }: Props) {
  const containers = optimizeContainers(palletsNeeded);
  const totalUnits = palletsNeeded * packing;
  const overshoot = totalUnits - shortfallUnits;

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="font-medium">Container Plan</div>

      <div className="text-sm space-y-1">
        {containers.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>
              Container {i + 1}:{' '}
              <strong>{c.size}-pallet</strong> → {c.pallets} pallets ={' '}
              {c.units.toLocaleString()} units
            </span>
          </div>
        ))}
      </div>

      {overshoot > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ Overshoot: {palletsNeeded} pallets = {totalUnits} units
          (overshoot by {overshoot} units)
        </div>
      )}

      {/* Visual fill indicator */}
      <div className="space-y-1">
        {containers.map((c, i) => (
          <div key={i}>
            <div className="text-xs text-gray-500 mb-1">
              Container {i + 1} ({c.size}-pallet)
            </div>
            <div className="h-3 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded transition-all"
                style={{ width: `${(c.pallets / c.size) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 text-right">
              {c.pallets}/{c.size} pallets ({(c.pallets / c.size * 100).toFixed(0)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Mixed Container Handling (>44 pallets)

```typescript
// If palletsNeeded > 44, show breakdown:
// e.g., need 60 pallets → 1×44 + 1×22 (top up) = 2 containers
// OR if remaining after 44 is >22: 2×44 containers

function optimizeContainersMixed(palletsNeeded: number): ContainerDetail[] {
  const result: ContainerDetail[] = [];
  let remaining = palletsNeeded;

  while (remaining > 0) {
    if (remaining >= 44) {
      result.push({ size: 44, pallets: 44, units: 44 * packingPerPallet });
      remaining -= 44;
    } else if (remaining <= 22) {
      result.push({ size: 22, pallets: remaining, units: remaining * packingPerPallet });
      remaining = 0;
    } else {
      // Remaining is >22 but <44: use a 44 container, will be partially filled
      result.push({ size: 44, pallets: remaining, units: remaining * packingPerPallet });
      remaining = 0;
    }
  }

  return result;
}
```

---

## 7. Key Implementation Notes

### API Routes Summary

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/po-suggest` | Returns `POSuggestion[]` based on rollforward |
| GET | `/api/po` | List all POs (with filters) |
| POST | `/api/po` | Create PO (auto-generates PO number) |
| GET | `/api/po/[id]` | Get single PO with items + status logs |
| PATCH | `/api/po/[id]` | Update qtyPallets or status |
| POST | `/api/po/[id]/receive` | Receive PO (lot + expiry → stock update) |
| DELETE | `/api/po/[id]` | Delete PO (fails if received) |

### Rollforward Integration

PO suggestion reads rollforward data from `/api/rollforward`:
- `balance < 0` → trigger PO suggestion
- Incoming POs (status ≠ received) already excluded from rollforward balance
- When PO is "received", rollforward recomputes → balance improves

### Client Components

All form components must be `'use client'`. Use `use server` for API route handlers only.

### Performance Notes

- PO suggestion computation is O(products × 8 months) — fast, no caching needed at this scale
- Container optimization is O(pallets / 44) — trivial
- Status transition uses `db.$transaction` for atomicity

---

## Unresolved Questions

1. **Year rollover**: What happens to `PO-2026-999` when year changes? Reset counter or continue sequence?
2. **PO edit after confirmed**: Should qtyPallets be editable after status = confirmed or in_transit?
3. **Partial receipt**: Can a PO be partially received (split across multiple lot numbers/expiry dates)?
4. **Arrival month vs actual date**: Is "arrival month" a planning estimate, or should it become an actual received date?
5. **Forecast update after PO creation**: Does adding a PO auto-update the rollforward "incoming" column immediately (status ordered), or only when confirmed?
