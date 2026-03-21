"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportForecasts, type ForecastRow } from "@/lib/export";
import { FileSpreadsheet, ListFilter as Filter, X, Save, CheckCheck, ClipboardList } from "lucide-react";

type Product = { id: number; name: string; sku: string };
type Customer = { id: number; name: string; region: string };
type ForecastMap = Record<string, number>;

const MONTHS = Array.from({ length: 8 }, (_, i) => {
  const d = new Date(2026, 3 + i, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

function fmtMonth(ym: string): string {
  const [, m, y] = ym.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m ?? "1", 10)]} ${y}`;
}

function ForecastsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-9 w-44" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

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
    clearTimeout(timerRef.current);
    const parsed = parseInt(e.target.value, 10) || 0;
    onSave(customerId, productId, month, parsed);
  }

  return (
    <input
      type="number"
      min={0}
      className="w-full px-1 py-1.5 text-center text-sm border border-transparent rounded-md
                 hover:border-border focus:border-primary focus:outline-none
                 focus:ring-1 focus:ring-primary/30 focus:bg-white bg-transparent transition-colors"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

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

  const filteredProducts = filterProduct
    ? products.filter((p) => String(p.id) === filterProduct)
    : products;
  const filteredCustomers = filterCustomer
    ? customers.filter((c) => String(c.id) === filterCustomer)
    : customers;

  function rowTotal(customerId: number, productId: number): number {
    return MONTHS.reduce(
      (sum, m) => sum + (forecasts[`${customerId}:${productId}:${m}`] ?? 0),
      0
    );
  }

  function colTotal(month: string): number {
    return filteredCustomers.reduce(
      (sum, c) =>
        sum + filteredProducts.reduce((s, p) => s + (forecasts[`${c.id}:${p.id}:${month}`] ?? 0), 0),
      0
    );
  }

  const grandTotal = MONTHS.reduce((s, m) => s + colTotal(m), 0);

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
  const hasFilters = !!(filterProduct || filterCustomer);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast Entry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Apr 2026 – Nov 2026 · Auto-saved</p>
        </div>
        <div className="flex items-center gap-2.5">
          {savingCount > 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Save className="w-3.5 h-3.5 animate-pulse" />
              Saving…
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCheck className="w-3.5 h-3.5" />
              Saved {lastSaved}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        <select
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
        {hasFilters && (
          <button
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            onClick={() => { setFilterProduct(""); setFilterCustomer(""); }}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base font-medium text-foreground">No data available</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx scripts/seed-products.ts</code> to seed data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-none scrollbar-thin">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide w-40 sticky left-0 bg-muted/50 z-20">
                    Customer
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide w-44">
                    Product
                  </th>
                  {MONTHS.map((m) => (
                    <th
                      key={m}
                      className="p-3 text-center font-medium text-muted-foreground text-xs uppercase tracking-wide w-20 min-w-[76px]"
                    >
                      {fmtMonth(m)}
                    </th>
                  ))}
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs uppercase tracking-wide w-16 bg-muted/70">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) =>
                  filteredProducts.map((p, pi) => {
                    const total = rowTotal(c.id, p.id);
                    const isFirstProductOfCustomer = pi === 0;
                    return (
                      <tr
                        key={`${c.id}:${p.id}`}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3 sticky left-0 bg-card z-10 border-r border-border/40">
                          {isFirstProductOfCustomer && (
                            <div>
                              <span className="text-sm font-medium text-foreground">{c.name}</span>
                              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                {c.region}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-foreground text-xs">{p.name}</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="p-1 border-l border-border/40 text-center">
                            <DebouncedCell
                              value={forecasts[`${c.id}:${p.id}:${m}`] ?? 0}
                              customerId={c.id}
                              productId={p.id}
                              month={m}
                              onSave={saveForecast}
                            />
                          </td>
                        ))}
                        <td className="p-3 text-center font-semibold bg-muted/30 text-foreground border-l border-border/40 text-xs">
                          {total > 0 ? total.toLocaleString() : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}

                <tr className="bg-muted/60 font-semibold text-foreground border-t-2 border-border">
                  <td className="p-3 sticky left-0 bg-muted/60 z-10 text-xs uppercase tracking-wide text-muted-foreground" colSpan={2}>
                    Monthly Total
                  </td>
                  {MONTHS.map((m) => (
                    <td key={m} className="p-3 text-center border-l border-border/40 text-sm">
                      {colTotal(m) > 0 ? (
                        <span className="font-semibold text-foreground">{colTotal(m).toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-center bg-muted/80 border-l border-border/40 text-sm font-bold text-primary">
                    {grandTotal > 0 ? grandTotal.toLocaleString() : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex gap-5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5">
            <span>Products: <strong className="text-foreground">{filteredProducts.length}</strong></span>
            <span>Customers: <strong className="text-foreground">{filteredCustomers.length}</strong></span>
            <span>Rows: <strong className="text-foreground">{filteredProducts.length * filteredCustomers.length}</strong></span>
            <span className="ml-auto">Grand Total: <strong className="text-foreground">{grandTotal.toLocaleString()}</strong></span>
          </div>
        </>
      )}
    </div>
  );
}
