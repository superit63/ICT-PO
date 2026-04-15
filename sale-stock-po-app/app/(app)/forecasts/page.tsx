"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, ClipboardList, FileSpreadsheet, ListFilter as Filter, Save, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ForecastEntryTable } from "@/components/forecasts/forecast-entry-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { exportForecasts, type ForecastRow } from "@/lib/export";

type Product = { id: number; name: string; sku: string };
type Customer = { id: number; name: string; region: string };
type ForecastMap = Record<string, number>;

function createForecastMonths(): string[] {
  const start = new Date();
  start.setDate(1);
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function fmtMonth(yearMonth: string): string {
  const [, month, year] = yearMonth.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(month ?? "1", 10)]} ${year}`;
}

const MONTHS = createForecastMonths();
const FORECAST_WINDOW_LABEL =
  MONTHS.length > 0 ? `${fmtMonth(MONTHS[0])} - ${fmtMonth(MONTHS[MONTHS.length - 1])}` : "";

function ForecastsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-9 w-44" />
        ))}
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}

export default function ForecastsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [forecasts, setForecasts] = useState<ForecastMap>({});
  const [filterProduct, setFilterProduct] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCount, setSavingCount] = useState(0);
  const [lastSaved, setLastSaved] = useState("");

  const load = useCallback(async () => {
    const [productData, customerData, forecastRows] = await Promise.all([
      fetch("/api/products").then((response) => response.json()),
      fetch("/api/customers").then((response) => response.json()),
      fetch("/api/forecasts").then((response) => response.json()),
    ]);
    setProducts(productData);
    setCustomers(customerData);
    setForecasts(
      forecastRows.reduce((map: ForecastMap, row: { customer_id: number; product_id: number; month: string; qty_units: number }) => {
        map[`${row.customer_id}:${row.product_id}:${row.month}`] = row.qty_units;
        return map;
      }, {})
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveForecast(customerId: number, productId: number, month: string, qty: number) {
    setSavingCount((value) => value + 1);
    try {
      const response = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, month, qty_units: qty }),
      });
      if (!response.ok) throw new Error();
      setForecasts((prev) => ({ ...prev, [`${customerId}:${productId}:${month}`]: qty }));
      setLastSaved(new Date().toLocaleTimeString());
    } catch {
      toast.error("Save failed — please try again");
    } finally {
      setSavingCount((value) => value - 1);
    }
  }

  function handleExport(filteredCustomers: Customer[], filteredProducts: Product[]) {
    const rows: ForecastRow[] = filteredCustomers.flatMap((customer) =>
      filteredProducts.map((product) => {
        const row: ForecastRow = {
          customerId: customer.id,
          customerName: customer.name,
          productId: product.id,
          productName: product.name,
          region: customer.region,
        };
        for (const month of MONTHS) row[month] = forecasts[`${customer.id}:${product.id}:${month}`] ?? 0;
        return row;
      })
    );
    exportForecasts(rows, MONTHS, `forecasts-${new Date().toISOString().slice(0, 10)}`);
    toast.success("Forecasts exported to Excel");
  }

  if (loading) return <ForecastsSkeleton />;

  const filteredProducts = filterProduct ? products.filter((product) => String(product.id) === filterProduct) : products;
  const filteredCustomers = customers
    .filter((customer) => !filterCustomer || String(customer.id) === filterCustomer)
    .filter((customer) =>
      !customerSearch.trim() || `${customer.name} ${customer.region}`.toLowerCase().includes(customerSearch.trim().toLowerCase())
    );
  const hasFilters = Boolean(filterProduct || filterCustomer || customerSearch.trim());
  const hasData = filteredCustomers.length > 0 && filteredProducts.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast Entry</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{FORECAST_WINDOW_LABEL} - Auto-saved</p>
        </div>
        <div className="flex items-center gap-2.5">
          {savingCount > 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Save className="size-3.5 animate-pulse" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCheck className="size-3.5" />
              Saved {lastSaved}
            </span>
          ) : null}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport(filteredCustomers, filteredProducts)}>
            <FileSpreadsheet className="size-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="size-3.5" />
          <span>Filter:</span>
        </div>
        <select
          aria-label="Filter forecasts by product"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={filterProduct}
          onChange={(event) => setFilterProduct(event.target.value)}
        >
          <option value="">All Products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </option>
          ))}
        </select>
        <select
          aria-label="Filter forecasts by customer"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={filterCustomer}
          onChange={(event) => setFilterCustomer(event.target.value)}
        >
          <option value="">All Customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} [{customer.region}]
            </option>
          ))}
        </select>
        <label className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder="Search customers"
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            onClick={() => {
              setFilterProduct("");
              setFilterCustomer("");
              setCustomerSearch("");
            }}
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-base font-medium text-foreground">No forecast rows match this view</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust the filters or add products/customers in master data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ForecastEntryTable
          key={`${filterProduct}:${filterCustomer}:${customerSearch.trim().toLowerCase()}:${filteredCustomers.map((customer) => customer.id).join(",")}`}
          customers={filteredCustomers}
          products={filteredProducts}
          months={MONTHS}
          forecasts={forecasts}
          autoExpandedCustomerIds={
            filterCustomer || filteredCustomers.length === 1
              ? filteredCustomers.map((customer) => customer.id)
              : []
          }
          onSave={saveForecast}
          formatMonth={fmtMonth}
        />
      )}
    </div>
  );
}
