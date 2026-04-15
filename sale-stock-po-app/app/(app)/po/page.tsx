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
import { FileSpreadsheet, Plus, Package, Eye, Trash2, PackageOpen } from "lucide-react";

type PO = {
  id: number; po_number: string; status: string;
  order_date: string; arrival_month: string; notes: string;
  product_name?: string; qty_pallets?: number; sku?: string;
  exw_price_eur?: number; packing_per_pallet?: number;
};

const STATUS_COLORS: Record<string, string> = {
  ordered: "bg-blue-100 text-blue-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  in_transit: "bg-orange-100 text-orange-700",
  received: "bg-green-100 text-green-700",
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
      po_value_eur: items.reduce(
        (sum, item) => sum + (item.qty_pallets ?? 0) * (item.packing_per_pallet ?? 1) * (item.exw_price_eur ?? 0),
        0
      ),
    })), "purchase-orders.xlsx");
    toast.success("PO list exported");
    setExporting(false);
  }

  function handleOpen(id: number) {
    router.push(`/po/${id}`);
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
    <div className="space-y-5">
      <div className="flex justify-between">
        <div className="space-y-1"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      {[1,2,3].map((i)=><Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{Object.keys(grouped).length} total PO{Object.keys(grouped).length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || Object.keys(grouped).length === 0} className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export
          </Button>
          <Link href="/po/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New PO
            </Button>
          </Link>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="py-16 text-center space-y-3">
            <PackageOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-medium text-foreground">No purchase orders yet</p>
            <Link href="/po/new">
              <Button size="sm" className="gap-1.5 mt-1">
                <Plus className="w-3.5 h-3.5" />
                Create first PO
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          {tabList}

          {(["all"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              <POListView pos={Object.values(grouped)} onDelete={handleDelete} onOpen={handleOpen} />
            </TabsContent>
          ))}

          {ALL_STATUSES.map((s) => (
            <TabsContent key={s} value={s} className="space-y-3">
              <POListView pos={byStatus(s)} onDelete={handleDelete} onOpen={handleOpen} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function POListView({
  pos,
  onDelete,
  onOpen,
}: {
  pos: { po: PO; items: PO[] }[];
  onDelete: (id: number, poNumber: string) => void;
  onOpen: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (pos.length === 0) {
    return (
      <div className="py-10 text-center">
        <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No POs in this category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Card className="shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">PO Number</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Date</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Arrival</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Pallets</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map(({ po, items }) => (
                  <tr key={po.id} className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => onOpen(po.id)}>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground text-sm">{po.po_number}</td>
                    <td className="px-3 py-3 text-foreground">{fmtDate(po.order_date)}</td>
                    <td className="px-3 py-3 text-foreground">{fmt(po.arrival_month)}</td>
                    <td className="px-3 py-3 max-w-xs">
                      <span className="text-muted-foreground truncate block text-xs">
                        {items.map((i) => i.product_name).filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-foreground">{items.reduce((s, i) => s + (i.qty_pallets ?? 0), 0)}</td>
                    <td className="px-3 py-3 text-right">
                      {po.exw_price_eur && po.packing_per_pallet && po.qty_pallets ? (
                        <span className="text-primary font-semibold">
                          €{(items.reduce((s, i) => s + (i.qty_pallets ?? 0) * (i.packing_per_pallet ?? 1) * (i.exw_price_eur ?? 0), 0)).toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={`${STATUS_COLORS[po.status] ?? "bg-muted text-muted-foreground"} border-0 text-xs font-medium`}>
                        {STATUS_LABELS[po.status] ?? po.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Link href={`/po/${po.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs">
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                        {po.status === "ordered" && (
                          confirmDelete === po.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                                onClick={() => onDelete(po.id, po.po_number)}>Confirm</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                                onClick={() => setConfirmDelete(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setConfirmDelete(po.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
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

      <div className="md:hidden space-y-3">
        {pos.map(({ po, items }) => (
          <Card key={po.id} className="shadow-none hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => onOpen(po.id)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold font-mono text-foreground text-sm">{po.po_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {items.map((i) => `${i.product_name} (${i.qty_pallets}p)`).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{fmtDate(po.order_date)} → {fmt(po.arrival_month)}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge className={`${STATUS_COLORS[po.status] ?? "bg-muted"} border-0 text-xs font-medium`}>
                    {STATUS_LABELS[po.status] ?? po.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{items.reduce((s, i) => s + (i.qty_pallets ?? 0), 0)} pallets</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <Link href={`/po/${po.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </Link>
                {po.status === "ordered" && (
                  confirmDelete === po.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" className="text-xs h-7"
                        onClick={() => onDelete(po.id, po.po_number)}>Confirm Delete</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 gap-1.5 text-xs"
                      onClick={() => setConfirmDelete(po.id)}>
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
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
