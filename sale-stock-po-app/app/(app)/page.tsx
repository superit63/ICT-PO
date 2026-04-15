"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Package,
  PackageOpen,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UsersRound,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatMonth,
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

type StatusMeta = {
  badge: string;
  border: string;
  icon: ComponentType<{ className?: string }>;
  iconFrame: string;
  label: string;
  summary: string;
};

const STATUS_BAR_CLASSES: Record<StockStatus, string> = {
  ok: "bg-emerald-500",
  low: "bg-amber-500",
  critical: "bg-orange-500",
  stockout: "bg-rose-500",
};

const STATUS_META: Record<StockStatus, StatusMeta> = {
  ok: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    border: "border-t-emerald-500/85",
    icon: CheckCircle2,
    iconFrame: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    label: "Healthy",
    summary: "Coverage remains stable through the horizon.",
  },
  low: {
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    border: "border-t-amber-500/85",
    icon: TrendingDown,
    iconFrame: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    label: "Low stock",
    summary: "Monitor closely and prepare replenishment.",
  },
  critical: {
    badge: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
    border: "border-t-orange-500/85",
    icon: AlertTriangle,
    iconFrame: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    label: "Critical",
    summary: "Action is required in the current cycle.",
  },
  stockout: {
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    border: "border-t-rose-500/85",
    icon: XCircle,
    iconFrame: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    label: "Stockout risk",
    summary: "Projected below zero within the planning window.",
  },
};

function worstStatus(entries: RFEntry[]): StockStatus {
  const order: StockStatus[] = ["stockout", "critical", "low", "ok"];
  for (const status of order) {
    if (entries.some((entry) => entry.status === status)) {
      return status;
    }
  }
  return "ok";
}

function lowestBalance(entries: RFEntry[]): number {
  return Math.min(...entries.map((entry) => entry.balance));
}

function formatCompactEuro(value: number): string {
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(1)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function MiniChart({ entries }: { entries: RFEntry[] }) {
  return (
    <>
      <div className="flex items-center justify-center gap-1" aria-hidden="true">
        {entries.map((entry) => (
          <div
            key={entry.month}
            title={`${formatMonth(entry.month)}: ${entry.balance} (${entry.status})`}
            className={`h-5 w-2.5 rounded-full ${STATUS_BAR_CLASSES[entry.status]}`}
          />
        ))}
      </div>
      <span className="sr-only">
        Status:{" "}
        {entries
          .map((entry) => `${formatMonth(entry.month)} ${STATUS_META[entry.status].label}`)
          .join(", ")}
      </span>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-5 w-[34rem] max-w-full rounded-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)]">
        <Skeleton className="h-[23rem] rounded-2xl" />
        <Skeleton className="h-[23rem] rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ rf: null, pos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/rollforward").then((response) => {
        if (!response.ok) throw new Error("Failed to fetch rollforward");
        return response.json();
      }),
      fetch("/api/po?status=ordered&status=confirmed&status=in_transit").then((response) => {
        if (!response.ok) throw new Error("Failed to fetch purchase orders");
        return response.json();
      }),
    ])
      .then(([rf, pos]) => {
        setData({ rf, pos });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data. Please refresh and try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card className="border-destructive/25">
        <CardContent className="py-12">
          <div role="alert" className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard unavailable</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rf = data.rf;
  if (!rf || rf.results.length === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Badge variant="outline">Supply planning</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Inventory overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Seed your products to unlock inventory visibility, replenishment alerts, and purchase planning.
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary">
              <PackageOpen className="size-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">No products found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-muted px-2 py-1 text-xs">npx tsx scripts/seed-products.ts</code> to seed data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = rf.results;
  const stockout = results.filter((result) => result.entries.some((entry) => entry.status === "stockout"));
  const critical = results.filter(
    (result) =>
      result.entries.some((entry) => entry.status === "critical") &&
      !result.entries.some((entry) => entry.status === "stockout")
  );
  const low = results.filter(
    (result) =>
      result.entries.some((entry) => entry.status === "low") &&
      !result.entries.some((entry) => entry.status === "stockout" || entry.status === "critical")
  );
  const ok = results.filter((result) => result.entries.every((entry) => entry.status === "ok"));
  const atRiskCount = stockout.length + critical.length + low.length;
  const openPOCount = new Set(data.pos.map((po) => po.id)).size;
  const openPOValue = data.pos.reduce(
    (sum, po) => sum + po.qty_pallets * po.packing_per_pallet * (po.exw_price_eur ?? 0),
    0
  );

  const sortOrder: Record<StockStatus, number> = {
    stockout: 0,
    critical: 1,
    low: 2,
    ok: 3,
  };

  const sorted = [...results].sort(
    (left, right) => sortOrder[worstStatus(left.entries)] - sortOrder[worstStatus(right.entries)]
  );
  const urgentProducts = sorted.filter((result) => worstStatus(result.entries) !== "ok").slice(0, 5);

  const quickActions = [
    { href: "/stock", label: "Manage stock", icon: Boxes },
    { href: "/master-data", label: "Manage master data", icon: UsersRound },
    { href: "/forecasts", label: "Update forecasts", icon: ClipboardList },
    { href: "/rollforward", label: "Review rollforward", icon: TrendingUp },
    { href: "/po-suggest", label: "Open PO suggestions", icon: Lightbulb },
    { href: "/po", label: "Manage purchase orders", icon: Package },
  ];

  const statusCounts: { status: StockStatus; count: number }[] = [
    { status: "stockout", count: stockout.length },
    { status: "critical", count: critical.length },
    { status: "low", count: low.length },
    { status: "ok", count: ok.length },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="outline">Supply planning</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Inventory overview
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              Planning window for {formatMonth(rf.planningMonth)}. Review products that need action, validate
              open order coverage, and move quickly on replenishment decisions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 font-medium text-primary">
            {results.length} SKUs tracked
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 font-medium text-primary">
            {openPOCount} open orders
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 font-medium text-primary">
            8 month horizon
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Operational summary</CardTitle>
            <CardDescription>
              A focused view of planning status, order exposure, and immediate replenishment pressure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile
                label="Planning month"
                value={formatMonth(rf.planningMonth)}
                detail="Current forecast cycle under review."
                icon={ClipboardList}
              />
              <SummaryTile
                label="At-risk SKUs"
                value={String(atRiskCount)}
                detail="Items below healthy coverage in the horizon."
                icon={ShieldAlert}
              />
              <SummaryTile
                label="Open PO value"
                value={formatCompactEuro(openPOValue)}
                detail={`${openPOCount} open orders in the pipeline.`}
                icon={Package}
              />
              <SummaryTile
                label="Healthy SKUs"
                value={String(ok.length)}
                detail="Products currently covered without intervention."
                icon={CheckCircle2}
              />
            </div>

            {(stockout.length > 0 || critical.length > 0) ? (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Immediate risk detected</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {stockout.length > 0
                        ? `${stockout.length} SKU${stockout.length > 1 ? "s are" : " is"} at stockout risk. `
                        : ""}
                      {critical.length > 0
                        ? `${critical.length} SKU${critical.length > 1 ? "s are" : " is"} in critical range.`
                        : ""}
                    </p>
                  </div>
                </div>

                <Link
                  href="/po-suggest"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-destructive/20 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-secondary"
                >
                  Review PO suggestions
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 text-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">No urgent replenishment signal</p>
                <p className="mt-1 leading-6 text-muted-foreground">
                  Current coverage remains above warning thresholds across the planning horizon.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-h-20 items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:border-primary/20 hover:bg-secondary/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products needing action</CardTitle>
            <CardDescription>Highest-priority items based on projected coverage and minimum balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentProducts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-secondary/65 px-4 py-4 text-sm text-muted-foreground">
                No urgent items are flagged in the current horizon.
              </div>
            ) : (
              urgentProducts.map((result) => {
                const status = worstStatus(result.entries);
                const minimum = lowestBalance(result.entries);

                return (
                  <Link
                    key={result.productId}
                    href={`/rollforward?productId=${result.productId}`}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:bg-secondary/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{result.productName}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{result.sku}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Minimum balance{" "}
                        <span className={minimum < 0 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
                          {minimum.toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge className={STATUS_META[status].badge}>{STATUS_META[status].label}</Badge>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCounts.map(({ status, count }) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;

          return (
            <Card key={status} className={`border-t-4 ${meta.border}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {meta.label}
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-foreground">{count}</p>
                  </div>
                  <div className={`flex size-11 items-center justify-center rounded-xl ${meta.iconFrame}`}>
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{meta.summary}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Inventory detail</CardTitle>
              <CardDescription>
                Use the monthly horizon view to compare current stock, projected trend, and minimum balance.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {(["stockout", "critical", "low", "ok"] as StockStatus[]).map((status) => (
                <span key={status} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS_BAR_CLASSES[status]}`} />
                  {STATUS_META[status].label}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/55">
                  <th className="px-5 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Product
                  </th>
                  <th className="px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-3 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Current stock
                  </th>
                  <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Horizon
                  </th>
                  <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Minimum balance
                  </th>
                  <th className="px-5 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((result) => {
                  const status = worstStatus(result.entries);
                  const minimum = lowestBalance(result.entries);
                  const currentStock = result.currentStock ?? result.entries[0]?.currentStock ?? 0;

                  return (
                    <tr key={result.productId} className="transition-colors hover:bg-secondary/45">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR_CLASSES[status]}`} />
                          <span className="font-semibold text-foreground">{result.productName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-mono text-xs text-muted-foreground">{result.sku}</td>
                      <td className="px-3 py-4 text-right font-mono text-sm text-foreground">
                        {currentStock.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MiniChart entries={result.entries} />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <Badge className={STATUS_META[status].badge}>{STATUS_META[status].label}</Badge>
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-sm">
                        <span className={minimum < 0 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
                          {minimum.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/rollforward?productId=${result.productId}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          View
                          <ArrowRight className="size-3.5" />
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
