"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportForecasts, type ForecastRow } from "@/lib/export";

// ── Types ────────────────────────────────────────────────────────────────────

type Product = { id: number; name: string; sku: string };
type Customer = { id: number; name: string; region: string };
type ForecastMap = Record<string, number>; // key: `${customerId}:${productId}:${month}`

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = Array.from({ length: 8 }, (_, i) => {
  const d = new Date(2026, 3 + i, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

function fmtMonth(ym: string): string {
  const [, m, y] = ym.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m ?? "1", 10)]} ${y}`;
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function ForecastsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-40" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-md" />
    </div>
  );
}

// ── Debounced input cell ─────────────────────────────────────────────────────

interface CellProps {
  value: number;
  customerId: number;
  productId: number;
  month: string;
  onSave: (customerId: number, productId: number, month: string, qty: number) => void;
}

function DebouncedCell({ value, customerId, productId, month, onSave }: CellProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync when API confirms
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10) || 0;
    setLocalValue(parsed);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(customerId, productId, month, parsed);
    }, 500);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Force save on blur too (in case user leaves without typing more)
    clearTimeout(timerRef.current);
    const parsed = parseInt(e.target.value, 10) || 0;
    onSave(customerId, productId, month, parsed);
  }

  return (
    <input
      type="number"
      min={0}
      className="w-full p-1 text-center text-sm border border-transparent rounded
                 hover:border-border focus:border-blue-500 focus:outline-none
                 focus:ring-1 focus:ring-blue-400 focus:bg-white bg-transparent transition-colors"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ForecastsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [forecasts, setForecasts] = useState<ForecastMap>({});
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterCustomer, setFilterCustomer] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [savingCount, setSavingCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<string>("");

  const load = useCallback(async () => {
    const [pr, cr, fr] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/forecasts").then((r) => r.json()),
    ]);
    setProducts(pr);
    setCustomers(cr);
    const map: ForecastMap = {};
    for (const f of fr) {
      map[`${f.customer_id}:${f.product_id}:${f.month}`] = f.qty_units;
    }
    setForecasts(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveForecast(customerId: number, productId: number, month: string, qty: number) {
    setSavingCount((n) => n + 1);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, month, qty_units: qty }),
      });
      if (!res.ok) throw new Error();
      setForecasts((prev) => ({ ...prev, [`${customerId}:${productId}:${month}`]: qty }));
      setLastSaved(new Date().toLocaleTimeString());
    } catch {
      toast.error("Save failed — please try again");
    } finally {
      setSavingCount((n) => n - 1);
    }
  }

  // ── Filtered data ──
  const filteredProducts = filterProduct
    ? products.filter((p) => String(p.id) === filterProduct)
    : products;
  const filteredCustomers = filterCustomer
    ? customers.filter((c) => String(c.id) === filterCustomer)
    : customers;

  // ── Row total per (customer, product) ──
  function rowTotal(customerId: number, productId: number): number {
    return MONTHS.reduce(
      (sum, m) => sum + (forecasts[`${customerId}:${productId}:${m}`] ?? 0),
      0
    );
  }

  // ── Column total per month ──
  function colTotal(month: string): number {
    return filteredCustomers.reduce(
      (sum, c) =>
        sum + filteredProducts.reduce((s, p) => s + (forecasts[`${c.id}:${p.id}:${month}`] ?? 0), 0),
      0
    );
  }

  // ── Grand total ──
  const grandTotal = MONTHS.reduce((s, m) => s + colTotal(m), 0);

  // ── Row total per customer across all months ──
  function customerTotal(customerId: number): number {
    return filteredProducts.reduce((sum, p) => sum + rowTotal(customerId, p.id), 0);
  }

  // ── Export ──
  function handleExport() {
    const rows: ForecastRow[] = filteredCustomers.flatMap((c) =>
      filteredProducts.map((p) => {
        const row: ForecastRow = {
          customerId: c.id,
          customerName: c.name,
          productId: p.id,
          productName: p.name,
          region: c.region,
        };
        for (const m of MONTHS) {
          row[m] = forecasts[`${c.id}:${p.id}:${m}`] ?? 0;
        }
        return row;
      })
    );
    exportForecasts(rows, MONTHS, `forecasts-${new Date().toISOString().slice(0, 10)}`);
    toast.success("Forecasts exported to Excel");
  }

  if (loading) return <ForecastsSkeleton />;

  const hasData = filteredProducts.length > 0 && filteredCustomers.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">📋 Forecast Entry</h1>
          <p className="text-sm text-slate-500">Apr 2026 – Nov 2026 · Debounced save (500ms)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Saving indicator */}
          {savingCount > 0 && (
            <span className="text-xs text-blue-600 animate-pulse">Saving…</span>
          )}
          {savingCount === 0 && lastSaved && (
            <span className="text-xs text-green-600">Saved at {lastSaved}</span>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            📥 Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          className="border rounded px-3 py-1.5 text-sm bg-white"
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-1.5 text-sm bg-white"
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
        >
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} [{c.region}]
            </option>
          ))}
        </select>
        {(filterProduct || filterCustomer) && (
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => { setFilterProduct(""); setFilterCustomer(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-slate-500">
            <p className="text-lg font-medium">No data available.</p>
            <p className="text-sm mt-1 text-slate-400">
              Run <code className="bg-slate-100 px-1 rounded">npx tsx scripts/seed-products.ts</code> to seed data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left font-medium text-slate-700 border-b w-44 sticky left-0 bg-slate-100 z-10 z-20">
                  Customer
                </th>
                <th className="p-2 text-left font-medium text-slate-700 border-b w-44">
                  Product
                </th>
                {MONTHS.map((m) => (
                  <th
                    key={m}
                    className="p-2 text-center font-medium text-slate-700 border-b w-20"
                  >
                    {fmtMonth(m)}
                  </th>
                ))}
                <th className="p-2 text-center font-medium text-slate-700 border-b w-16 bg-slate-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) =>
                filteredProducts.map((p) => {
                  const total = rowTotal(c.id, p.id);
                  return (
                    <tr
                      key={`${c.id}:${p.id}`}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-2 text-slate-600 text-xs sticky left-0 bg-white z-10">
                        {c.name}
                        <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1 rounded">
                          {c.region}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-slate-800 text-xs">{p.name}</td>
                      {MONTHS.map((m) => (
                        <td key={m} className="p-1 border-l text-center">
                          <DebouncedCell
                            value={forecasts[`${c.id}:${p.id}:${m}`] ?? 0}
                            customerId={c.id}
                            productId={p.id}
                            month={m}
                            onSave={saveForecast}
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center font-semibold bg-slate-50 text-slate-800 border-l">
                        {total > 0 ? total.toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Column totals row */}
              <tr className="bg-slate-200 font-semibold text-slate-800 border-t-2 border-slate-400">
                <td className="p-2 sticky left-0 bg-slate-200 z-10" colSpan={2}>
                  Column Total
                </td>
                {MONTHS.map((m) => (
                  <td key={m} className="p-2 text-center border-l">
                    {colTotal(m) > 0 ? colTotal(m).toLocaleString() : "—"}
                  </td>
                ))}
                <td className="p-2 text-center bg-slate-100 border-l">
                  {grandTotal > 0 ? grandTotal.toLocaleString() : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary chips */}
      {hasData && (
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Products: <strong className="text-slate-700">{filteredProducts.length}</strong></span>
          <span>Customers: <strong className="text-slate-700">{filteredCustomers.length}</strong></span>
          <span>Rows: <strong className="text-slate-700">{filteredProducts.length * filteredCustomers.length}</strong></span>
          <span>Grand Total: <strong className="text-slate-700">{grandTotal.toLocaleString()}</strong></span>
        </div>
      )}
    </div>
  );
}
