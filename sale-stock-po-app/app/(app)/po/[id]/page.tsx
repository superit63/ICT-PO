"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, CircleCheck as CheckCircle2, Package, Truck, ClipboardCheck, ShoppingCart, TriangleAlert as AlertTriangle, Trash2 } from "lucide-react";

type POLineItem = {
  product_id: number;
  product_name: string;
  sku: string;
  qty_pallets: number;
  packing_per_pallet: number;
  exw_price_eur: number;
};

type PO = {
  id: number;
  po_number: string;
  status: string;
  order_date: string;
  arrival_month: string;
  notes: string;
  items: POLineItem[];
};

const STATUS_STEPS = [
  { key: "ordered",    label: "Ordered",    icon: ShoppingCart },
  { key: "confirmed",  label: "Confirmed",  icon: ClipboardCheck },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "received",   label: "Received",   icon: CheckCircle2 },
];

const NEXT_STATUS: Record<string, string> = {
  ordered: "confirmed",
  confirmed: "in_transit",
};

const STATUS_BADGE: Record<string, string> = {
  ordered:    "bg-blue-100 text-blue-800",
  confirmed:  "bg-cyan-100 text-cyan-800",
  in_transit: "bg-orange-100 text-orange-800",
  received:   "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  ordered:    "Ordered",
  confirmed:  "Confirmed",
  in_transit: "In Transit",
  received:   "Received",
};

function fmt(ym: string) {
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, m, y] = ym.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  return `${names[parseInt(m ?? "1")]} ${y ?? ""}`;
}

function fmtDate(d: string) {
  const [y, mo, day] = d.split("-");
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo ?? "1")]} ${parseInt(day ?? "1")}, ${y}`;
}

type LotEntry = {
  product_id: number;
  product_name: string;
  qty_units: number;
  lot_number: string;
  expiry_date: string;
};

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [po, setPO] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [lotEntries, setLotEntries] = useState<LotEntry[]>([]);
  const [receiveError, setReceiveError] = useState("");

  function loadPO() {
    fetch(`/api/po/${id}`)
      .then((r) => r.json())
      .then((d) => { setPO(d); setLoading(false); });
  }

  useEffect(() => { loadPO(); }, [id]);

  useEffect(() => {
    if (!showReceive || !po) return;
    setLotEntries(po.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      qty_units: item.qty_pallets * item.packing_per_pallet,
      lot_number: "",
      expiry_date: "",
    })));
    setReceiveError("");
  }, [showReceive, po]);

  async function advanceStatus() {
    if (!po || !NEXT_STATUS[po.status]) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/po/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: NEXT_STATUS[po.status] }),
      });
      if (res.ok) {
        toast.success(`PO ${po.po_number} → ${STATUS_LABELS[NEXT_STATUS[po.status]]}`);
        loadPO();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Status update failed");
      }
    } catch {
      toast.error("Connection error");
    } finally { setUpdating(false); }
  }

  async function receivePO() {
    const missing = lotEntries.filter((e) => !e.lot_number || !e.expiry_date);
    if (missing.length > 0) {
      setReceiveError("All fields required: lot number and expiry date for every line.");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/po/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receive",
          lots: lotEntries.map((e) => ({
            product_id: e.product_id,
            lot_number: e.lot_number,
            expiry_date: e.expiry_date,
            qty_units: e.qty_units,
          })),
        }),
      });
      if (res.ok) {
        toast.success(`PO ${po?.po_number} received — stock updated`);
        setShowReceive(false);
        loadPO();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Receive failed");
      }
    } catch {
      toast.error("Connection error");
    } finally { setUpdating(false); }
  }

  async function deletePO() {
    if (!po) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/po/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`PO ${po.po_number} deleted`);
        router.push("/po");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Delete failed");
        setUpdating(false);
      }
    } catch {
      toast.error("Connection error");
      setUpdating(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );

  if (!po) return <p className="text-destructive">PO not found.</p>;

  const totalUnits = po.items.reduce((s, i) => s + i.qty_pallets * i.packing_per_pallet, 0);
  const totalValue = po.items.reduce(
    (s, i) => s + i.qty_pallets * i.packing_per_pallet * i.exw_price_eur, 0
  );
  const nextLabel = NEXT_STATUS[po.status] ? STATUS_LABELS[NEXT_STATUS[po.status]] : null;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === po.status);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/po")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          PO List
        </button>
        <span className="text-border">|</span>
        <h1 className="text-xl font-bold font-mono text-foreground">{po.po_number}</h1>
        <Badge className={`${STATUS_BADGE[po.status] ?? "bg-muted text-muted-foreground"} border-0`}>
          {STATUS_LABELS[po.status] ?? po.status}
        </Badge>
      </div>

      {/* Status stepper */}
      <Card className="shadow-none">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-border mx-8" />
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="relative flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isPast ? "bg-primary border-primary" :
                    isCurrent ? "bg-background border-primary" :
                    "bg-background border-border"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${
                      isPast ? "text-primary-foreground" :
                      isCurrent ? "text-primary" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PO Details */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">PO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Order Date</p>
              <p className="font-medium">{fmtDate(po.order_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Arrival Month</p>
              <p className="font-medium">{fmt(po.arrival_month)}</p>
            </div>
          </div>
          {po.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
              <p className="font-medium">{po.notes}</p>
            </div>
          )}
          {po.status === "received" && (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              This PO has been received. Stock has been updated.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line items */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="text-left py-2 px-3 rounded-l-lg">Product</th>
                  <th className="text-right py-2 px-3">Pallets</th>
                  <th className="text-right py-2 px-3">Units</th>
                  <th className="text-right py-2 px-3">Unit Price</th>
                  <th className="text-right py-2 px-3 rounded-r-lg">Est. Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 px-3">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku} · {item.packing_per_pallet} u/pallet</p>
                    </td>
                    <td className="py-3 px-3 text-right">{item.qty_pallets}</td>
                    <td className="py-3 px-3 text-right">{item.qty_pallets * item.packing_per_pallet}</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">€{item.exw_price_eur.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-primary">
                      €{(item.qty_pallets * item.packing_per_pallet * item.exw_price_eur).toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="pt-3 px-3">Total</td>
                  <td className="pt-3 px-3 text-right">{po.items.reduce((s, i) => s + i.qty_pallets, 0)}</td>
                  <td className="pt-3 px-3 text-right">{totalUnits.toLocaleString()}</td>
                  <td className="pt-3 px-3" />
                  <td className="pt-3 px-3 text-right text-primary">
                    €{totalValue.toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status actions */}
      {po.status !== "received" && (
        <Card className="shadow-none">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Status Actions</p>
            <div className="flex flex-wrap gap-3 items-center">
              {nextLabel && (
                <Button onClick={advanceStatus} disabled={updating} size="sm">
                  Mark as {nextLabel}
                </Button>
              )}
              {po.status === "in_transit" && (
                <Button
                  onClick={() => setShowReceive(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 gap-2"
                  disabled={updating}
                >
                  <Package className="w-3.5 h-3.5" />
                  Mark Received
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      {po.status !== "received" && (
        <Card className="shadow-none border-destructive/30">
          <CardContent className="pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm text-destructive hover:underline"
                disabled={updating}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete this PO
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">Are you sure? This cannot be undone.</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={deletePO} disabled={updating}>
                    Yes, delete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receive PO Dialog */}
      <Dialog open={showReceive} onOpenChange={setShowReceive}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Receive PO {po.po_number}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Record lot numbers and expiry dates for each line item. Units will be added to stock immediately.
          </p>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {lotEntries.map((entry, idx) => (
              <div key={entry.product_id} className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
                <p className="font-medium text-sm">{entry.product_name}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Lot Number *</Label>
                    <Input
                      value={entry.lot_number}
                      onChange={(e) => {
                        const updated = [...lotEntries];
                        updated[idx] = { ...updated[idx], lot_number: e.target.value };
                        setLotEntries(updated);
                      }}
                      placeholder="LOT-2026-001"
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Expiry Date *</Label>
                    <Input
                      type="date"
                      value={entry.expiry_date}
                      onChange={(e) => {
                        const updated = [...lotEntries];
                        updated[idx] = { ...updated[idx], expiry_date: e.target.value };
                        setLotEntries(updated);
                      }}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Units Received</Label>
                    <Input
                      type="number"
                      min={1}
                      value={entry.qty_units}
                      onChange={(e) => {
                        const updated = [...lotEntries];
                        updated[idx] = { ...updated[idx], qty_units: parseInt(e.target.value) || 0 };
                        setLotEntries(updated);
                      }}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default: {po.items[idx]?.qty_pallets} pallets × {po.items[idx]?.packing_per_pallet} units = {(po.items[idx]?.qty_pallets ?? 0) * (po.items[idx]?.packing_per_pallet ?? 1)} units
                </p>
              </div>
            ))}
          </div>

          {receiveError && (
            <p className="text-sm text-destructive">{receiveError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceive(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={receivePO} disabled={updating} className="bg-green-600 hover:bg-green-700">
              {updating ? "Confirming..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
