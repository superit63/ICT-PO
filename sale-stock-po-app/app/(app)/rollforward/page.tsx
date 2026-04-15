"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportRollforward, type RfResult } from "@/lib/export";
import { formatMonth, statusColors, type StockStatus } from "@/lib/calculations";
import { FileSpreadsheet, TriangleAlert as AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

type RFData = {
  planningMonth: string;
  months: string[];
  results: RfResult[];
};

function fmtMonth(ym: string): string {
  return formatMonth(ym as `20${number}-${number}${number}`);
}

const STATUS_BG: Record<StockStatus, string> = {
  ok: "bg-success/8 dark:bg-success/12",
  low: "bg-warning/10 dark:bg-warning/14",
  critical: "bg-critical/10 dark:bg-critical/14",
  stockout: "bg-destructive/10 dark:bg-destructive/14",
};

const STATUS_BAR: Record<StockStatus, string> = {
  ok: "bg-success",
  low: "bg-warning",
  critical: "bg-critical",
  stockout: "bg-destructive",
};

const STATUS_BUTTON: Record<StockStatus, string> = {
  ok: "bg-card text-foreground border-border hover:border-foreground/30",
  low: "bg-warning/10 text-warning border-warning/20 hover:border-warning/40 dark:bg-warning/14",
  critical: "bg-critical/10 text-critical border-critical/20 hover:border-critical/40 dark:bg-critical/14",
  stockout: "bg-destructive/10 text-destructive border-destructive/20 hover:border-destructive/40 dark:bg-destructive/16",
};

const STATUS_DOT: Record<StockStatus, string> = {
  ok: "bg-success",
  low: "bg-warning",
  critical: "bg-critical",
  stockout: "bg-destructive",
};

function getProductStatus(entries: RfResult["entries"]): StockStatus {
  if (entries.some((entry) => entry.status === "stockout")) return "stockout";
  if (entries.some((entry) => entry.status === "critical")) return "critical";
  if (entries.some((entry) => entry.status === "low")) return "low";
  return "ok";
}

function buildMonthOptions(current: string): string[] {
  const [y, m] = current.split("-").map(Number);
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function RollforwardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-11 w-80" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

export default function RollforwardPage() {
  const [data, setData] = useState<RFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [productId, setProductId] = useState<number | null>(null);
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
  }, [productId]);

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth, fetchData]);

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
  if (error || !data) return <p className="text-destructive p-4">{error}</p>;
  if (data.results.length === 0) {
    return (
      <div className="text-center py-16">
        <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-base font-medium text-foreground">No rollforward data</p>
        <p className="text-sm text-muted-foreground mt-1">Add products, stock, and forecasts first.</p>
      </div>
    );
  }

  const monthOptions = buildMonthOptions(selectedMonth);
  const selected = data.results.find((r) => r.productId === productId) ?? data.results[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Rollforward</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Balance = Opening Stock + Incoming POs − Forecast
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="planning-month" className="text-sm text-muted-foreground font-medium whitespace-nowrap">
              Planning month:
            </label>
            <select
              id="planning-month"
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {data.results.map((r) => {
          const isActive = productId === r.productId;
          const productStatus = getProductStatus(r.entries);
          return (
            <button
              key={r.productId}
              onClick={() => { setProductId(r.productId); toggleExpand(r.productId); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : STATUS_BUTTON[productStatus]
              }`}
            >
              {productStatus !== "ok" && !isActive && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[productStatus]}`} />
              )}
              {r.productName}
            </button>
          );
        })}
      </div>

      {selected.entries.some((e) => e.status === "stockout") && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 flex items-start gap-3 dark:bg-destructive/12">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">{selected.productName} — Stockout Alert</p>
            <div className="mt-1 space-y-0.5">
              {selected.entries
                .filter((e) => e.status === "stockout")
                .map((e) => (
                  <p key={e.month} className="text-sm text-destructive">
                    Balance drops to <strong>{e.balance.toLocaleString()} units</strong> in {fmtMonth(e.month)}
                  </p>
                ))}
            </div>
          </div>
          <Link href="/po-suggest">
            <Button size="sm" variant="destructive" className="shrink-0 gap-1.5">
              Create PO
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      <Card className="shadow-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold">{selected.productName}</CardTitle>
            <span className="text-muted-foreground text-sm font-mono">{selected.sku}</span>
            <span className="rounded-md bg-primary/8 px-2 py-0.5 text-xs text-primary">
              {selected.packingPerPallet} units/pallet
            </span>
            <span className="rounded-md bg-primary/8 px-2 py-0.5 text-xs text-primary">
              EXW €{selected.exwPriceEur}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-[700px] w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-32 sticky left-0 bg-muted/40 z-10">Metric</th>
                  {data.months.map((m: string) => (
                    <th
                      key={m}
                      className="p-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[92px]"
                    >
                      {fmtMonth(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="p-3 font-medium text-muted-foreground bg-card sticky left-0 z-10 text-sm">
                    Opening Stock
                  </td>
                  {data.months.map((m: string, i: number) => (
                    <td key={m} className="p-3 text-center text-foreground">
                      {i === 0 ? (
                        <span className="font-semibold text-foreground">
                          {selected.entries[0].currentStock.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/60">
                  <td className="p-3 font-medium text-primary bg-card sticky left-0 z-10 text-sm">
                    + Incoming PO
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className="p-3 text-center text-primary">
                      {e.incomingPOUnits > 0 ? (
                        <span className="font-semibold">+{e.incomingPOUnits.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/60">
                  <td className="p-3 font-medium text-destructive bg-card sticky left-0 z-10 text-sm">
                    − Forecast
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className="p-3 text-center text-destructive">
                      {e.forecastUnits > 0 ? (
                        <span className="font-medium">−{e.forecastUnits.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-t-2 border-border">
                  <td className="pt-3 pb-2 px-3 font-bold text-foreground bg-card sticky left-0 z-10">
                    = Balance
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className={`pt-3 pb-2 px-3 text-center font-bold ${STATUS_BG[e.status as StockStatus]}`}>
                      <span className={e.balance < 0 ? "text-destructive" : "text-foreground"}>
                        {e.balance.toLocaleString()}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="pt-1 pb-3 px-3 font-medium text-muted-foreground bg-card sticky left-0 z-10 text-xs">
                    Status
                  </td>
                  {selected.entries.map((e, i) => (
                    <td key={i} className={`pt-1 pb-3 px-3 text-center ${STATUS_BG[e.status as StockStatus]}`}>
                      <Badge className={`${statusColors[e.status as StockStatus]} text-xs font-medium border-0`}>
                        {e.status}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {expanded.has(selected.productId) && (
        <Card className="border-primary/20 shadow-none">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm text-foreground font-semibold">
              Detail Breakdown — {selected.productName}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-[600px] w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-left">
                    <th className="p-3 font-medium text-muted-foreground uppercase tracking-wide">Month</th>
                    <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wide">Opening</th>
                    <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wide">+ PO In</th>
                    <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wide">− Forecast</th>
                    <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wide">= Closing</th>
                    <th className="p-3 text-center font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="p-3 font-medium text-muted-foreground uppercase tracking-wide">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    return selected.entries.map((e) => {
                      const closing = e.balance;
                      const barWidth = Math.min(100, Math.max(0, (closing / (selected.entries[0].currentStock || 1)) * 100));
                      return (
                        <tr key={e.month} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{fmtMonth(e.month)}</td>
                          <td className="p-3 text-right text-foreground">{e.currentStock.toLocaleString()}</td>
                          <td className="p-3 text-right text-primary">
                            {e.incomingPOUnits > 0 ? `+${e.incomingPOUnits.toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="p-3 text-right text-destructive">
                            {e.forecastUnits > 0 ? `−${e.forecastUnits.toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className={`p-3 text-right font-semibold ${STATUS_BG[e.status as StockStatus]}`}>
                            <span className={closing < 0 ? "text-destructive" : "text-foreground"}>
                              {closing.toLocaleString()}
                            </span>
                          </td>
                          <td className={`p-3 text-center ${STATUS_BG[e.status as StockStatus]}`}>
                            <Badge className={`${statusColors[e.status as StockStatus]} text-xs border-0`}>{e.status}</Badge>
                          </td>
                          <td className="p-3 w-24">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${STATUS_BAR[e.status as StockStatus]} transition-all`}
                                style={{ width: `${Math.max(2, barWidth)}%` }}
                              />
                            </div>
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
    </div>
  );
}
