"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  formatMonth,
  statusColors,
  statusIcon,
  type RollforwardEntry,
  type RollforwardResult,
  type StockStatus,
} from "@/lib/calculations";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BG: Record<StockStatus, string> = {
  ok: "bg-green-100",
  low: "bg-yellow-100",
  critical: "bg-orange-100",
  stockout: "bg-red-100",
};

/** Return the worst status across 8 months. */
function worstStatus(entries: RFEntry[]): StockStatus {
  const order: StockStatus[] = ["stockout", "critical", "low", "ok"];
  for (const s of order) {
    if (entries.some((e) => e.status === s)) return s;
  }
  return "ok";
}

/** Return lowest balance across 8 months. */
function lowestBalance(entries: RFEntry[]): number {
  return Math.min(...entries.map((e) => e.balance));
}

/** Map 8 status values → 8 colored squares. */
function MiniChart({ entries }: { entries: RFEntry[] }) {
  return (
    <div className="flex gap-0.5 items-center">
      {entries.map((e, i) => (
        <div
          key={i}
          title={`${formatMonth(e.month)}: ${e.balance} (${e.status})`}
          className={`w-4 h-4 rounded-sm ${STATUS_BG[e.status]}`}
        />
      ))}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded" />)}
      </div>
      <Skeleton className="h-64 rounded" />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

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
  if (error) return <p className="text-red-600 p-4">{error}</p>;

  const rf = data.rf;
  if (!rf || rf.results.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">📊 Dashboard</h1>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No products found.</p>
            <p className="text-sm mt-2 text-slate-400">
              Run <code className="bg-slate-100 px-1 rounded">npx tsx scripts/seed-products.ts</code> to seed data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Status counts ──
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

  // ── Open PO value ──
  const openPOValue = data.pos.reduce((sum, po) => {
    return sum + (po.qty_pallets * po.packing_per_pallet * (po.exw_price_eur ?? 0));
  }, 0);
  const openPOValueDisplay = openPOValue >= 1000
    ? `€${(openPOValue / 1000).toFixed(1)}k`
    : `€${openPOValue.toFixed(0)}`;

  // ── Row sort: stockout first, then critical, low, ok ──
  const sortOrder: Record<StockStatus, number> = { stockout: 0, critical: 1, low: 2, ok: 3 };
  const sorted = [...results].sort(
    (a, b) => sortOrder[worstStatus(a.entries)] - sortOrder[worstStatus(b.entries)]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">📊 Dashboard</h1>
          <p className="text-sm text-slate-500">
            Planning: {formatMonth(rf.planningMonth)} · 8-month horizon
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Open PO Value</p>
          <p className="text-xl font-bold text-blue-700">{openPOValueDisplay}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-700">{ok.length}</p>
            <p className="text-xs text-green-700 mt-1">🟢 OK</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{low.length}</p>
            <p className="text-xs text-yellow-700 mt-1">🟡 Low</p>
          </CardContent>
        </Card>
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-orange-700">{critical.length}</p>
            <p className="text-xs text-orange-700 mt-1">🟠 Critical</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-700">{stockout.length}</p>
            <p className="text-xs text-red-700 mt-1">🔴 Stockout</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/forecasts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📋 Forecast Entry
        </Link>
        <Link
          href="/rollforward"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          📈 Rollforward
        </Link>
        <Link
          href="/po-suggest"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          🔧 PO Suggest
        </Link>
        <Link
          href="/po"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          📦 Manage POs
        </Link>
      </div>

      {/* Product table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-700">
            All Products · {results.length} SKUs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3 text-right">Curr. Stock</th>
                  <th className="px-3 py-3 text-center">8-Month Balance</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Lowest Balance</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
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
                          ? "bg-red-50 hover:bg-red-100"
                          : ws === "critical"
                          ? "bg-orange-50 hover:bg-orange-100"
                          : ws === "low"
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{r.productName}</td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-xs">{r.sku}</td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {currentStock.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <MiniChart entries={r.entries} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge className={`${statusColors[ws]} text-xs`}>
                          {statusIcon[ws]} {ws}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        {lowest.toLocaleString()}
                        {lowest < 0 && (
                          <span className="text-red-600 text-xs ml-1">
                            ({Math.abs(lowest)} short)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/rollforward?productId=${r.productId}`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          View →
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
