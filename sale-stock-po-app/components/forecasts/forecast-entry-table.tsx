"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Product = { id: number; name: string; sku: string };
type Customer = { id: number; name: string; region: string };
type ForecastMap = Record<string, number>;

type ForecastEntryTableProps = {
  customers: Customer[];
  products: Product[];
  months: string[];
  forecasts: ForecastMap;
  autoExpandedCustomerIds?: number[];
  onSave: (customerId: number, productId: number, month: string, qty: number) => void;
  formatMonth: (month: string) => string;
};

type CellProps = {
  value: number;
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  month: string;
  onSave: (customerId: number, productId: number, month: string, qty: number) => void;
  formatMonth: (month: string) => string;
};

function DebouncedCell({
  value,
  customerId,
  customerName,
  productId,
  productName,
  month,
  onSave,
  formatMonth,
}: CellProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function commit(rawValue: string) {
    const parsed = parseInt(rawValue, 10) || 0;
    onSave(customerId, productId, month, parsed);
  }

  return (
    <input
      type="number"
      min={0}
      value={localValue}
      aria-label={`${customerName} ${productName} forecast for ${formatMonth(month)}`}
      className="w-full rounded-md border border-transparent bg-transparent px-1 py-1.5 text-center text-sm transition-colors hover:border-border focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
      onChange={(event) => {
        setLocalValue(parseInt(event.target.value, 10) || 0);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => commit(event.target.value), 500);
      }}
      onBlur={(event) => {
        clearTimeout(timerRef.current);
        commit(event.target.value);
      }}
    />
  );
}

export function ForecastEntryTable({
  customers,
  products,
  months,
  forecasts,
  autoExpandedCustomerIds = [],
  onSave,
  formatMonth,
}: ForecastEntryTableProps) {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(
    () => new Set(autoExpandedCustomerIds)
  );

  const customerMonthTotals: Record<number, Record<string, number>> = {};
  const customerGrandTotals: Record<number, number> = {};
  const monthlyTotals: Record<string, number> = Object.fromEntries(months.map((month) => [month, 0]));

  for (const customer of customers) {
    customerMonthTotals[customer.id] = Object.fromEntries(months.map((month) => [month, 0]));
    customerGrandTotals[customer.id] = 0;
    for (const product of products) {
      for (const month of months) {
        const value = forecasts[`${customer.id}:${product.id}:${month}`] ?? 0;
        customerMonthTotals[customer.id][month] += value;
        customerGrandTotals[customer.id] += value;
        monthlyTotals[month] += value;
      }
    }
  }

  const grandTotal = months.reduce((sum, month) => sum + monthlyTotals[month], 0);

  function rowTotal(customerId: number, productId: number) {
    return months.reduce((sum, month) => sum + (forecasts[`${customerId}:${productId}:${month}`] ?? 0), 0);
  }

  function toggleCustomer(customerId: number) {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setExpandedCustomers(new Set(customers.map((customer) => customer.id)))}
        >
          <ChevronsUpDown className="size-3.5" />
          Expand all
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExpandedCustomers(new Set())}>
          <ChevronsDownUp className="size-3.5" />
          Collapse all
        </Button>
        <span className="text-xs text-muted-foreground">
          {customers.length} customer{customers.length === 1 ? "" : "s"} · {products.length * customers.length} editable rows
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card scrollbar-thin">
        <table className="min-w-[960px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-20 w-60 bg-muted/50 p-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Customer
              </th>
              <th className="w-52 p-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Product detail
              </th>
              {months.map((month) => (
                <th key={month} className="min-w-[92px] p-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {formatMonth(month)}
                </th>
              ))}
              <th className="w-24 bg-muted/70 p-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const isExpanded = expandedCustomers.has(customer.id);
              return (
                <FragmentRows key={customer.id}>
                  <tr className="border-b border-border/70 bg-primary/4">
                    <td className="sticky left-0 z-10 border-r border-border/40 bg-primary/4 p-3">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 text-left"
                        onClick={() => toggleCustomer(customer.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-primary" />}
                        <span className="font-semibold text-foreground">{customer.name}</span>
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {customer.region}
                        </span>
                      </button>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {products.length} product{products.length === 1 ? "" : "s"} · click to {isExpanded ? "collapse" : "expand"}
                    </td>
                    {months.map((month) => (
                      <td key={month} className="border-l border-border/40 p-3 text-center font-semibold text-foreground">
                        {customerMonthTotals[customer.id][month] > 0 ? customerMonthTotals[customer.id][month].toLocaleString() : "—"}
                      </td>
                    ))}
                    <td className="border-l border-border/40 bg-primary/5 p-3 text-center font-bold text-primary">
                      {customerGrandTotals[customer.id] > 0 ? customerGrandTotals[customer.id].toLocaleString() : "—"}
                    </td>
                  </tr>

                  {isExpanded &&
                    products.map((product) => {
                      const total = rowTotal(customer.id, product.id);
                      return (
                        <tr key={`${customer.id}:${product.id}`} className="border-b border-border/60 hover:bg-muted/20">
                          <td className="sticky left-0 z-10 border-r border-border/40 bg-card p-3">
                            <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-primary/60" />
                              {customer.name}
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </td>
                          {months.map((month) => (
                            <td key={month} className="border-l border-border/40 p-1 text-center">
                              <DebouncedCell
                                value={forecasts[`${customer.id}:${product.id}:${month}`] ?? 0}
                                customerId={customer.id}
                                customerName={customer.name}
                                productId={product.id}
                                productName={product.name}
                                month={month}
                                onSave={onSave}
                                formatMonth={formatMonth}
                              />
                            </td>
                          ))}
                          <td className="border-l border-border/40 bg-muted/30 p-3 text-center text-xs font-semibold text-foreground">
                            {total > 0 ? total.toLocaleString() : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </FragmentRows>
              );
            })}

            <tr className="border-t-2 border-border bg-muted/60 font-semibold text-foreground">
              <td className="sticky left-0 z-10 bg-muted/60 p-3 text-xs uppercase tracking-[0.18em] text-muted-foreground" colSpan={2}>
                Monthly total
              </td>
              {months.map((month) => (
                <td key={month} className="border-l border-border/40 p-3 text-center">
                  {monthlyTotals[month] > 0 ? monthlyTotals[month].toLocaleString() : "—"}
                </td>
              ))}
              <td className="border-l border-border/40 bg-primary/5 p-3 text-center text-sm font-bold text-primary">
                {grandTotal > 0 ? grandTotal.toLocaleString() : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
