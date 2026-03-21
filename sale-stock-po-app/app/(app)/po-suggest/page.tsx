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

function containerLabel(config: 22 | 44 | "mixed"): string {
  if (config === "mixed") return "Mixed (multiple containers)";
  return `${config} pallets`;
}

function POSuggestContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [suggestions, setSuggestions] = useState<POSuggestion[]>([]);
  const [planningMonth, setPlanningMonth] = useState("");
  const [loading, setLoading] = useState(true);

  // Pre-fill from suggestion card "Create PO"
  const prefillProductId = params.get("productId");
  const prefillPallets = params.get("pallets");

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
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-40 w-full" />)}</div>
    </div>
  );

  const critical = suggestions.filter((s) => s.urgency === "critical");
  const warning = suggestions.filter((s) => s.urgency === "warning");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">🔧 PO Suggestion Engine</h1>
          <p className="text-sm text-slate-500">
            Planning anchor: {planningMonth ? fmt(planningMonth) : "—"} &nbsp;·&nbsp; Order now → arrives in 5 months
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {prefillProductId && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Pre-filling from suggestion
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={suggestions.length === 0}>
            📥 Export Excel
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="py-10 text-center text-green-800 space-y-2">
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-medium">All products adequately stocked for the next 8 months.</p>
            <Link href="/rollforward" className="text-sm text-green-700 underline hover:no-underline">
              View rollforward →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Critical */}
      {critical.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-red-700">🔴 Order Now (Critical)</h2>
            <Badge variant="destructive">{critical.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {critical.map((s) => (
              <SuggestionCard key={s.productId} s={s} onCreatePO={handleCreatePO} />
            ))}
          </div>
        </>
      )}

      {/* Warning */}
      {warning.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-yellow-700">🟡 Plan Soon (Warning)</h2>
            <Badge className="bg-yellow-500 text-white">{warning.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {warning.map((s) => (
              <SuggestionCard key={s.productId} s={s} onCreatePO={handleCreatePO} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionCard({ s, onCreatePO }: { s: POSuggestion; onCreatePO: (s: POSuggestion) => void }) {
  const overshoot = s.palletsNeeded * s.packingPerPallet - s.shortfallUnits;
  const isCritical = s.urgency === "critical";

  return (
    <Card className={`border-2 ${isCritical ? "border-red-300" : "border-yellow-300"}`}>
      <CardHeader className={`${isCritical ? "bg-red-50" : "bg-yellow-50"} rounded-t-lg pb-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className={`text-base truncate ${isCritical ? "text-red-800" : "text-yellow-800"}`}>
              {s.productName}
            </CardTitle>
            <p className="text-xs text-slate-500">{s.sku} · {s.packingPerPallet} u/pallet · €{s.exwPriceEur.toFixed(3)}/unit</p>
          </div>
          <Badge className={`shrink-0 ${isCritical ? "bg-red-600" : "bg-yellow-500"} text-white`}>
            {s.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">First Stockout</p>
            <p className="font-semibold">{fmt(s.firstStockoutMonth)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Shortfall</p>
            <p className="font-semibold text-red-700">{s.shortfallUnits.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Pallets Needed</p>
            <p className="font-semibold">{s.palletsNeeded} pallets</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">PO Value</p>
            <p className="font-semibold text-blue-700">€{s.poValueEur.toLocaleString("en-EU", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 space-y-0.5">
          <p>📦 {s.containerConfig === "mixed" ? "Multiple containers needed (>44 pallets)" : `1 × ${s.containerConfig}-pallet container`}</p>
          <p className="text-xs text-slate-400">Ordering {s.palletsNeeded} pallets = {s.palletsNeeded * s.packingPerPallet} units
            {overshoot > 0 && <> (overshoot: +{overshoot.toLocaleString()} units)</>}
          </p>
        </div>

        <Button size="sm" className="w-full mt-1" onClick={() => onCreatePO(s)}>
          Create PO →
        </Button>
      </CardContent>
    </Card>
  );
}

export default function POSuggestPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>}>
      <POSuggestContent />
    </Suspense>
  );
}
