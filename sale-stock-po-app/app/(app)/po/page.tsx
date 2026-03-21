"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportPOList } from "@/lib/export-po";

type PO = {
  id: number; po_number: string; status: string;
  order_date: string; arrival_month: string; notes: string;
  product_name?: string; qty_pallets?: number; sku?: string;
  exw_price_eur?: number; packing_per_pallet?: number;
};

const STATUS_COLORS: Record<string, string> = {
  ordered: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  in_transit: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
};
const STATUS_LABELS: Record<string, string> = {
  ordered: "Ordered", confirmed: "Confirmed",
  in_transit: "In Transit", received: "Received",
};
const ALL_STATUSES = ["ordered", "confirmed", "in_transit", "received"];

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

function computeValue(po: PO): number {
  if (po.exw_price_eur && po.packing_per_pallet && po.qty_pallets) {
    return po.qty_pallets * po.packing_per_pallet * po.exw_price_eur;
  }
  return 0;
}

export default function POPage() {
  const router = useRouter();
  const [allPOs, setAllPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/po")
      .then((r) => r.json())
      .then((d) => { setAllPOs(d); setLoading(false); })
      .catch(() => { setLoading(false); toast.error("Failed to load POs"); });
  }, []);

  // Group rows by PO id
  const grouped = allPOs.reduce<Record<number, { po: PO; items: PO[] }>>((acc, row) => {
    if (!acc[row.id]) acc[row.id] = { po: row, items: [] };
    if (row.product_name) acc[row.id].items.push(row);
    return acc;
  }, {});

  // Group by status tab
  const byStatus = (status: string) =>
    Object.values(grouped).filter(({ po }) => po.status === status);

  const totalValue = (pos: { po: PO; items: PO[] }[]) =>
    pos.reduce((sum, { po }) => sum + computeValue(po), 0);

  async function handleDelete(id: number, poNumber: string) {
    try {
      const res = await fetch(`/api/po/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`PO ${poNumber} deleted`);
        setAllPOs((prev) => prev.filter((r) => r.id !== id));
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Delete failed");
      }
    } catch {
      toast.error("Connection error");
    }
  }

  function handleExport() {
    setExporting(true);
    exportPOList(Object.values(grouped).map(({ po, items }) => ({
      po_number: po.po_number,
      status: STATUS_LABELS[po.status] ?? po.status,
      order_date: fmtDate(po.order_date),
      arrival_month: fmt(po.arrival_month),
      items_summary: items.map((i) => `${i.product_name} (${i.qty_pallets} pallets)`).join("; "),
      total_pallets: items.reduce((s, i) => s + (i.qty_pallets ?? 0), 0),
      po_value_eur: computeValue(po),
    })), "purchase-orders.xlsx");
    toast.success("PO list exported");
    setExporting(false);
  }

  const tabList = (
    <TabsList className="mb-4">
      <TabsTrigger value="all">All ({Object.keys(grouped).length})</TabsTrigger>
      {ALL_STATUSES.map((s) => (
        <TabsTrigger key={s} value={s}>
          {STATUS_LABELS[s]} ({byStatus(s).length})
        </TabsTrigger>
      ))}
    </TabsList>
  );

  if (loading) return (
    <div className="space-y-4">
      <div className="flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32" /></div>
      <Skeleton className="h-10 w-96" />
      {[1,2,3].map((i)=><Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">📦 Purchase Orders</h1>
          <p className="text-sm text-slate-500">{Object.keys(grouped).length} PO(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || Object.keys(grouped).length === 0}>
            📥 Export
          </Button>
          <Link href="/po/new">
            <Button size="sm">+ New PO</Button>
          </Link>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 space-y-2">
            <p className="text-lg">No purchase orders yet.</p>
            <Link href="/po/new" className="text-blue-600 underline hover:no-underline">Create the first one →</Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          {tabList}

          {(["all"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              <POListView pos={Object.values(grouped)} onDelete={handleDelete} />
            </TabsContent>
          ))}

          {ALL_STATUSES.map((s) => (
            <TabsContent key={s} value={s} className="space-y-3">
              <POListView pos={byStatus(s)} onDelete={handleDelete} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function POListView({ pos, onDelete }: { pos: { po: PO; items: PO[] }[]; onDelete: (id: number, poNumber: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (pos.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No POs in this category.</p>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2 pl-4 font-medium">PO#</th>
                  <th className="pb-2 font-medium">Order Date</th>
                  <th className="pb-2 font-medium">Arrival Month</th>
                  <th className="pb-2 font-medium">Items</th>
                  <th className="pb-2 text-right font-medium">Pallets</th>
                  <th className="pb-2 text-right font-medium">Value</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map(({ po, items }) => (
                  <tr key={po.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/po/${po.id}`}>
                    <td className="pl-4 py-3 font-mono font-semibold text-slate-800">{po.po_number}</td>
                    <td className="py-3">{fmtDate(po.order_date)}</td>
                    <td className="py-3">{fmt(po.arrival_month)}</td>
                    <td className="py-3 max-w-xs">
                      <span className="text-slate-600 truncate block">
                        {items.map((i) => i.product_name).filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="py-3 text-right">{items.reduce((s, i) => s + (i.qty_pallets ?? 0), 0)}</td>
                    <td className="py-3 text-right">
                      {po.exw_price_eur && po.packing_per_pallet && po.qty_pallets ? (
                        <span className="text-blue-700 font-medium">
                          €{(items.reduce((s, i) => s + (i.qty_pallets ?? 0) * (i.packing_per_pallet ?? 1) * (i.exw_price_eur ?? 0), 0)).toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3">
                      <Badge className={STATUS_COLORS[po.status] ?? "bg-slate-100"}>
                        {STATUS_LABELS[po.status] ?? po.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Link href={`/po/${po.id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                        {po.status !== "in_transit" && po.status !== "received" && (
                          <Link href={`/po/${po.id}/edit`}>
                            <Button size="sm" variant="ghost">Edit</Button>
                          </Link>
                        )}
                        {po.status === "ordered" && (
                          confirmDelete === po.id ? (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="destructive" className="text-xs px-2 py-1"
                                onClick={() => onDelete(po.id, po.po_number)}>Delete</Button>
                              <Button size="sm" variant="outline" className="text-xs px-2 py-1"
                                onClick={() => setConfirmDelete(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-red-600"
                              onClick={() => setConfirmDelete(po.id)}>Delete</Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {pos.map(({ po, items }) => (
          <Card key={po.id} className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/po/${po.id}`}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold font-mono text-slate-800">{po.po_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {items.map((i) => `${i.product_name} (${i.qty_pallets}p)`).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-slate-400">{fmtDate(po.order_date)} → {fmt(po.arrival_month)}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge className={STATUS_COLORS[po.status] ?? "bg-slate-100"}>
                    {STATUS_LABELS[po.status] ?? po.status}
                  </Badge>
                  <p className="text-xs text-slate-500">{items.reduce((s, i) => s + (i.qty_pallets ?? 0), 0)} pallets</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                <Link href={`/po/${po.id}`}><Button size="sm" variant="outline">View</Button></Link>
                {po.status === "ordered" && (
                  confirmDelete === po.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" className="text-xs"
                        onClick={() => onDelete(po.id, po.po_number)}>Delete?</Button>
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-red-600"
                      onClick={() => setConfirmDelete(po.id)}>Delete</Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
