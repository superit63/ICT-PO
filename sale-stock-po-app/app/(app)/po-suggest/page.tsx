"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { StockStatus } from "@/lib/calculations";
import { exportPOSuggestions } from "@/lib/export-po";
import { TriangleAlert as AlertTriangle, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, FileSpreadsheet, Package, ArrowRight, Lightbulb, TrendingUp } from "lucide-react";

type POSuggestion = {
  productId: number; productName: string; sku: string;
  packingPerPallet: number; exwPriceEur: number;
  firstStockoutMonth: string; shortfallUnits: number;
  palletsNeeded: number; containerConfig: 22 | 44 | "mixed"; poValueEur: number;
  urgency: "critical" | "warning";
};

function fmt(ym: string) {
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, m, y] = ym.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  return `${names[parseInt(m ?? "1")]} ${y ?? ""}`;
}

function POSuggestContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [suggestions, setSuggestions] = useState<POSuggestion[]>([]);
  const [planningMonth, setPlanningMonth] = useState("");
  const [loading, setLoading] = useState(true);

  const prefillProductId = params.get("productId");

  useEffect(() => {
    fetch("/api/rollforward")
      .then((r) => r.json())
      .then(async (rf) => {
        setPlanningMonth(rf.planningMonth);
        const { suggestPO } = await import("@/lib/calculations");
        const sugg = (rf.results ?? [])
          .map((r: { productId: number; productName: string; sku: string; packingPerPallet: number; exwPriceEur: number; entries: { month: string; currentStock: number; incomingPOUnits: number; forecastUnits: number; balance: number; status: string }[] }) => {
            const entries = (rf.months as string[]).map((month: string, i: number) => ({
              month,
              currentStock: r.entries[i]?.currentStock ?? 0,
              incomingPOUnits: r.entries[i]?.incomingPOUnits ?? 0,
              forecastUnits: r.entries[i]?.forecastUnits ?? 0,
              balance: r.entries[i]?.balance ?? 0,
              status: (r.entries[i]?.status ?? "ok") as StockStatus,
            }));
            return suggestPO(
              { ...r, currentStock: r.entries[0]?.currentStock ?? 0, entries },
              rf.planningMonth
            );
          })
          .filter(Boolean);
        setSuggestions(sugg as POSuggestion[]);
        setLoading(false);
      })
      .catch(() => { setLoading(false); toast.error("Failed to load rollforward data"); });
  }, []);

  function handleExport() {
    if (suggestions.length === 0) { toast.error("No suggestions to export"); return; }
    exportPOSuggestions(suggestions, `po-suggestions-${planningMonth ?? "export"}.xlsx`);
    toast.success("PO suggestions exported");
  }

  function handleCreatePO(s: POSuggestion) {
    router.push(`/po/new?productId=${s.productId}&pallets=${s.palletsNeeded}`);
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i)=><Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="space-y-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-44 w-full rounded-xl" />)}</div>
    </div>
  );

  const critical = suggestions.filter((s) => s.urgency === "critical");
  const warning = suggestions.filter((s) => s.urgency === "warning");
  const totalValue = suggestions.reduce((s, p) => s + p.poValueEur, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PO Suggestion Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Planning: {planningMonth ? fmt(planningMonth) : "—"} · 5-month lead time
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {prefillProductId && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-medium">
              Pre-filled from suggestion
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={suggestions.length === 0} className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-red-50 border-red-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-700">{critical.length}</p>
                  <p className="text-xs font-medium text-red-600 mt-0.5">Critical</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{warning.length}</p>
                  <p className="text-xs font-medium text-yellow-600 mt-0.5">Warning</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {totalValue >= 1000 ? `€${(totalValue/1000).toFixed(1)}k` : `€${totalValue.toFixed(0)}`}
                  </p>
                  <p className="text-xs font-medium text-primary/70 mt-0.5">Suggested Value</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {suggestions.length === 0 && (
        <Card className="border-green-200 bg-green-50 shadow-none">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-base font-semibold text-green-800">All products adequately stocked</p>
            <p className="text-sm text-green-700">No purchase orders needed for the next 8 months.</p>
            <Link href="/rollforward" className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium hover:underline">
              View rollforward details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      {critical.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-base font-semibold text-red-700">Order Now — Critical</h2>
            <Badge className="bg-red-600 text-white text-xs border-0">{critical.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {critical.map((s) => (
              <SuggestionCard key={s.productId} s={s} onCreatePO={handleCreatePO} />
            ))}
          </div>
        </div>
      )}

      {warning.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <h2 className="text-base font-semibold text-yellow-700">Plan Soon — Warning</h2>
            <Badge className="bg-yellow-500 text-white text-xs border-0">{warning.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {warning.map((s) => (
              <SuggestionCard key={s.productId} s={s} onCreatePO={handleCreatePO} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ s, onCreatePO }: { s: POSuggestion; onCreatePO: (s: POSuggestion) => void }) {
  const overshoot = s.palletsNeeded * s.packingPerPallet - s.shortfallUnits;
  const isCritical = s.urgency === "critical";

  return (
    <Card className={`shadow-none border-l-4 ${isCritical ? "border-l-red-500 border-red-200" : "border-l-yellow-400 border-yellow-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground truncate">{s.productName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sku} · {s.packingPerPallet} u/pallet · €{s.exwPriceEur.toFixed(3)}/unit</p>
          </div>
          <Badge className={`shrink-0 text-xs border-0 font-semibold ${isCritical ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
            {s.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "First Stockout", value: fmt(s.firstStockoutMonth), color: isCritical ? "text-red-700" : "text-yellow-700" },
            { label: "Shortfall", value: `${s.shortfallUnits.toLocaleString()} units`, color: "text-destructive" },
            { label: "Pallets Needed", value: `${s.palletsNeeded} pallets`, color: "text-foreground" },
            { label: "PO Value", value: `€${s.poValueEur.toLocaleString("en-EU", { minimumFractionDigits: 2 })}`, color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="bg-muted/40 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
              <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span>{s.containerConfig === "mixed" ? "Multiple containers needed (>44 pallets)" : `1 × ${s.containerConfig}-pallet container`}</span>
          {overshoot > 0 && (
            <span className="ml-auto text-muted-foreground/70">+{overshoot.toLocaleString()} overshoot</span>
          )}
        </div>

        <Button size="sm" className="w-full gap-1.5" onClick={() => onCreatePO(s)}>
          Create PO
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function POSuggestPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    }>
      <POSuggestContent />
    </Suspense>
  );
}
