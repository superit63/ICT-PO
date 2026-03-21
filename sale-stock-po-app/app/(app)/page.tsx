"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, TrendingDown, PackageOpen, ClipboardList, TrendingUp, Lightbulb, Package, ArrowRight } from "lucide-react";
import {
  formatMonth,
  statusColors,
  type RollforwardEntry,
  type RollforwardResult,
  type StockStatus,
} from "@/lib/calculations";

type RFEntry = RollforwardEntry;
type RFResult = RollforwardResult;

type PODetail = {
  id: number;
  po_number: string;
  status: string;
  arrival_month: string;
  product_id: number;
  product_name: string;
  qty_pallets: number;
  exw_price_eur: number;
  packing_per_pallet: number;
};

type DashboardData = {
  rf: { planningMonth: string; months: string[]; results: RFResult[] } | null;
  pos: PODetail[];
};

const STATUS_BG: Record<StockStatus, string> = {
  ok: "bg-green-500",
  low: "bg-yellow-400",
  critical: "bg-orange-500",
  stockout: "bg-red-500",
};

function worstStatus(entries: RFEntry[]): StockStatus {
  const order: StockStatus[] = ["stockout", "critical", "low", "ok"];
  for (const s of order) {
    if (entries.some((e) => e.status === s)) return s;
  }
  return "ok";
}

function lowestBalance(entries: RFEntry[]): number {
  return Math.min(...entries.map((e) => e.balance));
}

function MiniChart({ entries }: { entries: RFEntry[] }) {
  return (
    <div className="flex gap-0.5 items-center">
      {entries.map((e, i) => (
        <div
          key={i}
          title={`${formatMonth(e.month)}: ${e.balance} (${e.status})`}
          className={`w-3.5 h-5 rounded-sm ${STATUS_BG[e.status]} opacity-85`}
        />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

const STATUS_CARD_CONFIG: Record<StockStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
  iconBg: string;
}> = {
  ok: {
    label: "Healthy",
    icon: CheckCircle2,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    iconBg: "bg-green-100",
  },
  low: {
    label: "Low Stock",
    icon: TrendingDown,
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    iconBg: "bg-yellow-100",
  },
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
  },
  stockout: {
    label: "Stockout Risk",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    iconBg: "bg-red-100",
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ rf: null, pos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/rollforward").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch rollforward");
        return r.json();
      }),
      fetch("/api/po?status=ordered&status=confirmed&status=in_transit").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch purchase orders");
        return r.json();
      }),
    ])
      .then(([rf, pos]) => {
        setData({ rf, pos });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <p className="text-destructive p-4">{error}</p>;

  const rf = data.rf;
  if (!rf || rf.results.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inventory overview</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <PackageOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base font-medium text-foreground">No products found</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx scripts/seed-products.ts</code> to seed data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = rf.results;
  const critical = results.filter((r) =>
    r.entries.some((e) => e.status === "stockout" || e.status === "critical")
  );
  const low = results.filter(
    (r) =>
      r.entries.some((e) => e.status === "low") &&
      !r.entries.some((e) => e.status === "stockout" || e.status === "critical")
  );
  const ok = results.filter((r) => r.entries.every((e) => e.status === "ok"));
  const stockout = results.filter((r) => r.entries.some((e) => e.status === "stockout"));

  const openPOValue = data.pos.reduce((sum, po) => {
    return sum + (po.qty_pallets * po.packing_per_pallet * (po.exw_price_eur ?? 0));
  }, 0);
  const openPOValueDisplay = openPOValue >= 1_000_000
    ? `€${(openPOValue / 1_000_000).toFixed(1)}M`
    : openPOValue >= 1000
    ? `€${(openPOValue / 1000).toFixed(1)}k`
    : `€${openPOValue.toFixed(0)}`;

  const sortOrder: Record<StockStatus, number> = { stockout: 0, critical: 1, low: 2, ok: 3 };
  const sorted = [...results].sort(
    (a, b) => sortOrder[worstStatus(a.entries)] - sortOrder[worstStatus(b.entries)]
  );

  const statusCounts: { status: StockStatus; count: number }[] = [
    { status: "stockout", count: stockout.length },
    { status: "critical", count: critical.length },
    { status: "low", count: low.length },
    { status: "ok", count: ok.length },
  ];

  const quickActions = [
    { href: "/forecasts", label: "Forecast Entry", icon: ClipboardList, color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200" },
    { href: "/rollforward", label: "Rollforward", icon: TrendingUp, color: "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200" },
    { href: "/po-suggest", label: "PO Suggest", icon: Lightbulb, color: "text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200" },
    { href: "/po", label: "Manage POs", icon: Package, color: "text-green-600 bg-green-50 hover:bg-green-100 border-green-200" },
  ];

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatMonth(rf.planningMonth)} · 8-month planning horizon
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Open PO Value</p>
          <p className="text-2xl font-bold text-primary">{openPOValueDisplay}</p>
          <p className="text-xs text-muted-foreground">{data.pos.length} open orders</p>
        </div>
      </div>

      {(stockout.length > 0 || critical.length > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {stockout.length > 0 && `${stockout.length} product${stockout.length > 1 ? "s" : ""} at stockout risk`}
            {stockout.length > 0 && critical.length > 0 && " · "}
            {critical.length > 0 && `${critical.length} at critical level`}
            {" — "}
          </p>
          <Link href="/po-suggest" className="text-sm text-red-700 font-semibold underline-offset-2 hover:underline ml-auto shrink-0">
            Review PO Suggestions →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCounts.map(({ status, count }) => {
          const config = STATUS_CARD_CONFIG[status];
          const Icon = config.icon;
          return (
            <Card key={status} className={`${config.bg} ${config.border} border shadow-none`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${config.text}`}>{count}</p>
                    <p className={`text-xs font-medium mt-1 ${config.text}`}>{config.label}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${config.text}`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {count === 0 ? "None" : `${count} of ${results.length} SKUs`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${action.color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
            </Link>
          );
        })}
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              All Products
            </CardTitle>
            <span className="text-xs text-muted-foreground">{results.length} SKUs</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">SKU</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Stock</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">8-Month</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Min. Balance</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => {
                  const ws = worstStatus(r.entries);
                  const lowest = lowestBalance(r.entries);
                  const currentStock = r.currentStock ?? r.entries[0]?.currentStock ?? 0;
                  const hasStockout = r.entries.some((e) => e.status === "stockout");
                  return (
                    <tr
                      key={r.productId}
                      className={
                        hasStockout
                          ? "bg-red-50/60 hover:bg-red-50"
                          : ws === "critical"
                          ? "bg-orange-50/60 hover:bg-orange-50"
                          : ws === "low"
                          ? "bg-yellow-50/40 hover:bg-yellow-50"
                          : "hover:bg-muted/30"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{r.productName}</td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">{r.sku}</td>
                      <td className="px-3 py-3 text-right text-foreground hidden md:table-cell">
                        {currentStock.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <MiniChart entries={r.entries} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge className={`${statusColors[ws]} text-xs font-medium border-0`}>
                          {ws}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold hidden lg:table-cell">
                        <span className={lowest < 0 ? "text-red-600" : "text-foreground"}>
                          {lowest.toLocaleString()}
                        </span>
                        {lowest < 0 && (
                          <span className="text-red-500 text-xs ml-1">
                            ({Math.abs(lowest)} short)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/rollforward?productId=${r.productId}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                        >
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
