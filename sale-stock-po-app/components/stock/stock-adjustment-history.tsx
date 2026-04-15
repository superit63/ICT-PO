"use client";

import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type StockAdjustmentRow = {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  lot_number: string | null;
  expiry_date: string | null;
  change_type: "create" | "update" | "delete" | "receipt";
  reason: string | null;
  qty_delta: number;
  previous_qty: number | null;
  next_qty: number | null;
  created_at: string;
};

const CHANGE_META = {
  create: { label: "Created", className: "bg-primary/10 text-primary" },
  update: { label: "Adjusted", className: "bg-warning/14 text-warning" },
  delete: { label: "Removed", className: "bg-destructive/12 text-destructive" },
  receipt: { label: "Receipt", className: "bg-success/12 text-success" },
};

function formatTimestamp(value: string) {
  return new Date(value.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockAdjustmentHistory({ adjustments }: { adjustments: StockAdjustmentRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Stock History</CardTitle>
        <CardDescription>Every stock create, correction, deletion, and PO receipt is recorded here.</CardDescription>
      </CardHeader>
      <CardContent>
        {adjustments.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/60 p-8 text-center">
            <History className="mx-auto size-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No stock adjustments yet</p>
            <p className="text-sm text-muted-foreground">The ledger will appear once stock is created or changed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/55">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lot</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Change</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delta</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Balance</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adjustments.map((adjustment) => {
                  const meta = CHANGE_META[adjustment.change_type] ?? CHANGE_META.update;
                  return (
                    <tr key={adjustment.id} className="hover:bg-secondary/35">
                      <td className="px-3 py-3 text-muted-foreground">{formatTimestamp(adjustment.created_at)}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-foreground">{adjustment.product_name}</p>
                        <p className="text-xs text-muted-foreground">{adjustment.sku}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs text-foreground">{adjustment.lot_number || "-"}</p>
                        <p className="text-xs text-muted-foreground">{adjustment.expiry_date || "-"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-foreground">
                        {adjustment.qty_delta > 0 ? "+" : ""}
                        {Number(adjustment.qty_delta).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-foreground">
                        {adjustment.previous_qty ?? 0} to {adjustment.next_qty ?? 0}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{adjustment.reason || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
