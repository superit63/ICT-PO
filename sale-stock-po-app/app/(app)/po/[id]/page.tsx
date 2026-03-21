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

const NEXT_STATUS: Record<string, string> = {
  ordered: "confirmed",
  confirmed: "in_transit",
};
const STATUS_COLORS: Record<string, string> = {
  ordered: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  in_transit: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
};
const STATUS_LABELS: Record<string, string> = {
  ordered: "Ordered",
  confirmed: "Confirmed",
  in_transit: "In Transit",
  received: "Received",
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

// Per-line lot entry for "Mark Received"
type LotEntry = {
  product_id: number;
  product_name: string;
  qty_units: number; // default = qty_pallets * packing
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

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Receive dialog
  const [showReceive, setShowReceive] = useState(false);
  const [lotEntries, setLotEntries] = useState<LotEntry[]>([]);
  const [receiveError, setReceiveError] = useState("");

  function loadPO() {
    fetch(`/api/po/${id}`)
      .then((r) => r.json())
      .then((d) => { setPO(d); setLoading(false); });
  }

  useEffect(() => { loadPO(); }, [id]);

  // Initialise lot entries when receive dialog opens
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
    // Validate all entries have lot + expiry
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
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  if (!po) return <p className="text-red-600">PO not found.</p>;

  const totalUnits = po.items.reduce((s, i) => s + i.qty_pallets * i.packing_per_pallet, 0);
  const totalValue = po.items.reduce(
    (s, i) => s + i.qty_pallets * i.packing_per_pallet * i.exw_price_eur, 0
  );

  const canEdit = po.status === "ordered" || po.status === "confirmed";
  const nextLabel = NEXT_STATUS[po.status]
    ? STATUS_LABELS[NEXT_STATUS[po.status]]
    : null;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.push("/po")} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to PO list
        </button>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-semibold font-mono text-slate-800">{po.po_number}</h1>
        <Badge className={STATUS_COLORS[po.status] ?? "bg-slate-100"}>
          {STATUS_LABELS[po.status] ?? po.status}
        </Badge>
      </div>

      {/* PO header card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">PO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs">Order Date</p>
              <p className="font-medium">{fmtDate(po.order_date)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Arrival Month</p>
              <p className="font-medium">{fmt(po.arrival_month)}</p>
            </div>
          </div>
          {po.notes && (
            <div>
              <p className="text-slate-500 text-xs">Notes</p>
              <p className="font-medium">{po.notes}</p>
            </div>
          )}
          {po.status === "received" && (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <span>✓</span> This PO has been received. Stock has been updated.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Pallets</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-slate-400">{item.sku} · {item.packing_per_pallet} u/pallet</p>
                    </td>
                    <td className="py-2 text-right">{item.qty_pallets}</td>
                    <td className="py-2 text-right">{item.qty_pallets * item.packing_per_pallet}</td>
                    <td className="py-2 text-right">€{item.exw_price_eur.toFixed(3)}</td>
                    <td className="py-2 text-right font-medium">
                      €{(item.qty_pallets * item.packing_per_pallet * item.exw_price_eur).toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{po.items.reduce((s, i) => s + i.qty_pallets, 0)}</td>
                  <td className="pt-3 text-right">{totalUnits.toLocaleString()}</td>
                  <td className="pt-3" />
                  <td className="pt-3 text-right text-blue-700">
                    €{totalValue.toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status transitions */}
      {po.status !== "received" && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 mb-3 font-medium">Status Actions</p>
            <div className="flex flex-wrap gap-3 items-center">
              {nextLabel && (
                <Button onClick={advanceStatus} disabled={updating}>
                  Mark as {nextLabel}
                </Button>
              )}
              {po.status === "in_transit" && (
                <Button onClick={() => setShowReceive(true)} variant="default"
                  className="bg-green-600 hover:bg-green-700" disabled={updating}>
                  📦 Mark Received
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      {po.status !== "received" && (
        <Card className="border-red-200">
          <CardContent className="pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-600 hover:underline"
                disabled={updating}
              >
                Delete this PO
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 font-medium">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={deletePO} disabled={updating}>
                    Yes, delete
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)}>
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
            <DialogTitle>📦 Receive PO {po.po_number}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Record lot numbers and expiry dates for each line item. Units will be added to stock immediately.
          </p>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {lotEntries.map((entry, idx) => (
              <div key={entry.product_id} className="border rounded-lg p-3 space-y-2 bg-slate-50">
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
                      placeholder="e.g. LOT-2026-001"
                      className="h-8 text-sm"
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
                      className="h-8 text-sm"
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
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Default: {po.items[idx]?.qty_pallets} pallets × {po.items[idx]?.packing_per_pallet} units = {po.items[idx]?.qty_pallets * (po.items[idx]?.packing_per_pallet ?? 1)} units
                </p>
              </div>
            ))}
          </div>

          {receiveError && (
            <p className="text-sm text-red-600">{receiveError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceive(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={receivePO} disabled={updating}>
              {updating ? "Confirming..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
