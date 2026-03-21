"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportRollforward, type RfResult } from "@/lib/export";
import { formatMonth, statusColors, statusIcon, type StockStatus } from "@/lib/calculations";

// ── Types ────────────────────────────────────────────────────────────────────

type RFEntry = {
  month: string;
  currentStock: number;
  incomingPOUnits: number;
  forecastUnits: number;
  balance: number;
  status: StockStatus;
};

type RFData = {
  planningMonth: string;
  months: string[];
  results: RfResult[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtMonth(ym: string): string {
  return formatMonth(ym as `20${number}-${number}${number}`);
}

const STATUS_BG: Record<string, string> = {
  ok: "bg-green-50",
  low: "bg-yellow-50",
  critical: "bg-orange-50",
  stockout: "bg-red-50",
};

/** Build month selector options: current ± 3 months. */
function buildMonthOptions(current: string): string[] {
  const [y, m] = current.split("-").map(Number);
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function RollforwardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function RollforwardPage() {
  const [data, setData] = useState<RFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Planning month selector (default = current month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Product filter from URL ?productId=X
  const [productId, setProductId] = useState<number | null>(null);

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rollforward?planningMonth=${month}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      if (!productId && json.results.length > 0) {
        setProductId(json.results[0].productId);
      }
      setError("");
    } catch {
      setError("Failed to load rollforward data");
    } finally {
      setLoading(false);
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth, fetchData]);

  // Sync productId from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("productId");
    if (p) setProductId(Number(p));
  }, []);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExport() {
    if (!data) return;
    exportRollforward(data.results, `rollforward-${selectedMonth}`);
    toast.success("Rollforward exported to Excel");
  }

  if (loading) return <RollforwardSkeleton />;
  if (error || !data) return <p className="text-red-600 p-4">{error}</p>;
  if (data.results.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">No rollforward data. Add products, stock, and forecasts first.</p>
      </div>
    );
  }

  const monthOptions = buildMonthOptions(selectedMonth);
  const selected = data.results.find((r) => r.productId === productId) ?? data.results[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">📈 Stock Rollforward</h1>
          <p className="text-sm text-slate-500">
            Balance = Current Stock + Incoming POs − Forecast per month
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Planning month selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 font-medium">Planning:</label>
            <select
              className="border rounded px-3 py-1.5 text-sm font-medium bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>
          {/* Export */}
          <Button variant="outline" size="sm" onClick={handleExport}>
            📥 Export Excel
          </Button>
        </div>
      </div>

      {/* Product selector */}
      <div className="flex gap-3 flex-wrap">
        {data.results.map((r) => (
          <button
            key={r.productId}
            onClick={() => { setProductId(r.productId); toggleExpand(r.productId); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              productId === r.productId
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {r.productName}
          </button>
        ))}
      </div>

      {/* Main rollforward grid */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="font-semibold">{selected.productName}</span>
            <span className="text-slate-400 font-normal text-sm">{selected.sku}</span>
            <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">
              {selected.packingPerPallet} units/pallet
            </span>
            <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              EXW €{selected.exwPriceEur}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2 pr-4 w-28 font-medium bg-white sticky left-0 z-10">Metric</th>
                  {data.months.map((m) => (
                    <th
                      key={m}
                      className="pb-2 px-2 text-center font-medium min-w-[90px]"
                    >
                      {fmtMonth(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Current Stock — shown only in first month column */}
                <tr className="border-b border-dashed">
                  <td className="py-2 pr-4 font-medium text-slate-500 bg-white sticky left-0 z-10">
                    Stock
                  </td>
                  {data.months.map((m, i) => (
                    <td key={m} className="py-2 px-2 text-center text-slate-600">
                      {i === 0 ? (
                        <span className="font-semibold text-slate-800">
                          {selected.entries[0].currentStock.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* + Incoming PO */}
                <tr className="border-b border-dashed">
                  <td className="py-2 pr-4 font-medium text-blue-700 bg-white sticky left-0 z-10">
                    + Incoming PO
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className="py-2 px-2 text-center text-blue-700">
                      {e.incomingPOUnits > 0 ? (
                        <span className="font-medium">+{e.incomingPOUnits.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* − Forecast */}
                <tr className="border-b border-dashed">
                  <td className="py-2 pr-4 font-medium text-red-700 bg-white sticky left-0 z-10">
                    − Forecast
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className="py-2 px-2 text-center text-red-600">
                      {e.forecastUnits > 0 ? (
                        <span className="font-medium">−{e.forecastUnits.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* = Balance (colored) */}
                <tr className="border-t-2 border-slate-300">
                  <td className="pt-2 pb-1 pr-4 font-bold text-slate-800 bg-white sticky left-0 z-10">
                    = Balance
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className={`pt-2 pb-1 px-2 text-center font-bold ${STATUS_BG[e.status]}`}>
                      {e.balance.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Status row */}
                <tr>
                  <td className="pt-1 pb-2 pr-4 font-medium text-slate-600 bg-white sticky left-0 z-10">
                    Status
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className={`pt-1 pb-2 px-2 text-center ${STATUS_BG[e.status]}`}>
                      <Badge className={`${statusColors[e.status as StockStatus]} text-xs`}>
                        {statusIcon[e.status as StockStatus]} {(e.status as StockStatus)}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expanded breakdown */}
      {expanded.has(selected.productId) && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">
              📊 Detail Breakdown — {selected.productName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-1.5 pr-4 font-medium">Month</th>
                    <th className="pb-1.5 px-2 text-right">Opening</th>
                    <th className="pb-1.5 px-2 text-right">+ InPO</th>
                    <th className="pb-1.5 px-2 text-right">− Forecast</th>
                    <th className="pb-1.5 px-2 text-right">= Closing</th>
                    <th className="pb-1.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const opening = selected.entries[0].currentStock;
                    return selected.entries.map((e) => {
                      const closing = e.balance;
                      return (
                        <tr key={e.month} className="border-b border-dashed">
                          <td className="py-1.5 pr-4 font-medium">{fmtMonth(e.month)}</td>
                          <td className="py-1.5 px-2 text-right text-slate-600">{opening.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right text-blue-600">
                            {e.incomingPOUnits > 0 ? `+${e.incomingPOUnits.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-right text-red-500">
                            {e.forecastUnits > 0 ? `−${e.forecastUnits.toLocaleString()}` : "—"}
                          </td>
                          <td className={`py-1.5 px-2 text-right font-semibold ${STATUS_BG[e.status]}`}>
                            {closing.toLocaleString()}
                          </td>
                          <td className={`py-1.5 px-2 text-center ${STATUS_BG[e.status]}`}>
                            <Badge className={`${statusColors[e.status as StockStatus]} text-xs`}>{e.status}</Badge>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stockout alert */}
      {selected.entries.some((e) => e.status === "stockout") && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="py-3 space-y-1">
            {selected.entries
              .filter((e) => e.status === "stockout")
              .map((e) => (
                <p key={e.month} className="text-red-700 text-sm">
                  ⚠️ <strong>STOCKOUT in {fmtMonth(e.month)}:</strong> Balance drops to{" "}
                  <strong>{e.balance.toLocaleString()} units</strong>.
                  Order now — 5-month lead time means arrival in {fmtMonth(e.month)}.
                </p>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
