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

const URGENCY_STYLES = {
  critical: {
    card: "bg-destructive/8 border-destructive/20 dark:bg-destructive/12",
    value: "text-destructive",
    label: "text-destructive/80",
    iconWrap: "bg-destructive/12",
    icon: "text-destructive",
    badge: "bg-destructive/12 text-destructive",
    sectionTitle: "text-destructive",
    sectionBadge: "bg-destructive/12 text-destructive",
    border: "border-l-destructive/70 border-destructive/20",
  },
  warning: {
    card: "bg-warning/10 border-warning/20 dark:bg-warning/14",
    value: "text-warning",
    label: "text-warning/80",
    iconWrap: "bg-warning/14",
    icon: "text-warning",
    badge: "bg-warning/14 text-warning",
    sectionTitle: "text-warning",
    sectionBadge: "bg-warning/14 text-warning",
    border: "border-l-warning/70 border-warning/20",
  },
} as const;

const SAFE_STYLES = {
  card: "border-success/20 bg-success/8 dark:bg-success/12",
  iconWrap: "bg-success/12",
  icon: "text-success",
  title: "text-success",
  body: "text-success/80",
  link: "text-success hover:text-success/80",
} as const;

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
            <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning font-medium">
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
          <Card className={`shadow-none ${URGENCY_STYLES.critical.card}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold ${URGENCY_STYLES.critical.value}`}>{critical.length}</p>
                  <p className={`text-xs font-medium mt-0.5 ${URGENCY_STYLES.critical.label}`}>Critical</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${URGENCY_STYLES.critical.iconWrap}`}>
                  <AlertTriangle className={`w-4 h-4 ${URGENCY_STYLES.critical.icon}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`shadow-none ${URGENCY_STYLES.warning.card}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold ${URGENCY_STYLES.warning.value}`}>{warning.length}</p>
                  <p className={`text-xs font-medium mt-0.5 ${URGENCY_STYLES.warning.label}`}>Warning</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${URGENCY_STYLES.warning.iconWrap}`}>
                  <AlertCircle className={`w-4 h-4 ${URGENCY_STYLES.warning.icon}`} />
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
        <Card className={`shadow-none ${SAFE_STYLES.card}`}>
          <CardContent className="py-12 text-center space-y-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${SAFE_STYLES.iconWrap}`}>
              <CheckCircle2 className={`w-6 h-6 ${SAFE_STYLES.icon}`} />
            </div>
            <p className={`text-base font-semibold ${SAFE_STYLES.title}`}>All products adequately stocked</p>
            <p className={`text-sm ${SAFE_STYLES.body}`}>No purchase orders needed for the next 8 months.</p>
            <Link href="/rollforward" className={`inline-flex items-center gap-1.5 text-sm font-medium hover:underline ${SAFE_STYLES.link}`}>
              View rollforward details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      {critical.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-4 h-4 ${URGENCY_STYLES.critical.icon}`} />
            <h2 className={`text-base font-semibold ${URGENCY_STYLES.critical.sectionTitle}`}>Order Now — Critical</h2>
            <Badge className={`text-xs border-0 ${URGENCY_STYLES.critical.sectionBadge}`}>{critical.length}</Badge>
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
            <Lightbulb className={`w-4 h-4 ${URGENCY_STYLES.warning.icon}`} />
            <h2 className={`text-base font-semibold ${URGENCY_STYLES.warning.sectionTitle}`}>Plan Soon — Warning</h2>
            <Badge className={`text-xs border-0 ${URGENCY_STYLES.warning.sectionBadge}`}>{warning.length}</Badge>
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
  const tone = URGENCY_STYLES[s.urgency];

  return (
    <Card className={`shadow-none border-l-4 ${tone.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground truncate">{s.productName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sku} · {s.packingPerPallet} u/pallet · €{s.exwPriceEur.toFixed(3)}/unit</p>
          </div>
          <Badge className={`shrink-0 text-xs border-0 font-semibold ${tone.badge}`}>
            {s.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "First Stockout", value: fmt(s.firstStockoutMonth), color: tone.value },
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

        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
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
