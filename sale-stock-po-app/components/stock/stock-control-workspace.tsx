"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { PackageOpen, PencilLine, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StockAdjustmentHistory,
  type StockAdjustmentRow,
} from "@/components/stock/stock-adjustment-history";

type Product = { id: number; name: string; sku: string };
type StockRow = {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  lot_number: string;
  expiry_date: string;
  qty_units: number;
  updated_at: string;
};

type StockForm = {
  productId: string;
  lotNumber: string;
  expiryDate: string;
  qtyUnits: string;
  reason: string;
};

const EMPTY_FORM: StockForm = {
  productId: "",
  lotNumber: "",
  expiryDate: "",
  qtyUnits: "",
  reason: "",
};

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getExpiryMeta(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return { label: "Expired", className: "bg-destructive/12 text-destructive" };
  if (diffDays <= 30) return { label: "<= 30 days", className: "bg-critical/14 text-critical" };
  if (diffDays <= 90) return { label: "<= 90 days", className: "bg-warning/14 text-warning" };
  return { label: "Healthy", className: "bg-success/12 text-success" };
}

export function StockControlWorkspace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [form, setForm] = useState<StockForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<StockRow | null>(null);
  const [editForm, setEditForm] = useState<StockForm>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<StockRow | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, stockResponse, adjustmentResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stock"),
        fetch("/api/stock/adjustments?limit=100"),
      ]);
      if (!productResponse.ok || !stockResponse.ok || !adjustmentResponse.ok) {
        throw new Error("Load failed");
      }

      const [productData, stockData, adjustmentData] = await Promise.all([
        productResponse.json(),
        stockResponse.json(),
        adjustmentResponse.json(),
      ]);
      setProducts(productData);
      setRows(stockData);
      setAdjustments(adjustmentData);
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRows = rows.filter((row) => {
    if (filterProduct && String(row.product_id) !== filterProduct) return false;
    if (!deferredQuery) return true;
    const haystack = `${row.product_name} ${row.sku} ${row.lot_number}`.toLowerCase();
    return haystack.includes(deferredQuery);
  });

  const filteredAdjustments = adjustments.filter((adjustment) => {
    if (filterProduct && String(adjustment.product_id) !== filterProduct) return false;
    if (!deferredQuery) return true;
    const haystack = `${adjustment.product_name} ${adjustment.sku} ${adjustment.lot_number ?? ""} ${adjustment.reason ?? ""}`.toLowerCase();
    return haystack.includes(deferredQuery);
  });

  const totalUnits = filteredRows.reduce((sum, row) => sum + Number(row.qty_units ?? 0), 0);
  const expiringSoon = filteredRows.filter((row) => getExpiryMeta(row.expiry_date).label !== "Healthy").length;
  const stockedProducts = new Set(filteredRows.map((row) => row.product_id)).size;

  async function saveStock(endpoint: string, method: "POST" | "PUT", payload: StockForm) {
    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: Number(payload.productId),
          lot_number: payload.lotNumber,
          expiry_date: payload.expiryDate,
          qty_units: Number(payload.qtyUnits),
          reason: payload.reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      await loadData();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const saved = await saveStock("/api/stock", "POST", form);
    if (!saved) return;
    setForm(EMPTY_FORM);
    toast.success("Stock lot added");
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const saved = await saveStock(`/api/stock/${editing.id}`, "PUT", editForm);
    if (!saved) return;
    setEditing(null);
    setEditForm(EMPTY_FORM);
    toast.success("Stock lot updated");
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/stock/${deleting.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      await loadData();
      toast.success(`Removed lot ${deleting.lot_number}`);
      setDeleting(null);
      setDeleteReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-44" />
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Skeleton className="h-[320px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Control</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage current on-hand lots, expiry dates, quantity corrections, and audit history.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Lots", value: String(filteredRows.length) },
          { label: "Units on hand", value: totalUnits.toLocaleString() },
          { label: "Products stocked", value: String(stockedProducts) },
          { label: "Expiry alerts", value: String(expiringSoon) },
        ].map((item) => (
          <Card key={item.label} size="sm">
            <CardContent className="space-y-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {item.label}
              </p>
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add Stock Lot</CardTitle>
            <CardDescription>Create a new on-hand lot entry for an existing product.</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                <p>Add products before recording stock.</p>
                <Link href="/master-data" className="inline-flex items-center gap-1 text-primary hover:underline">
                  Open master data
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleCreate}>
                <FormFields form={form} products={products} onChange={setForm} />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Add stock lot"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div>
              <CardTitle>Current Lots</CardTitle>
              <CardDescription>Filter by product, lot code, or SKU to find stock quickly.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product, SKU, or lot"
                  className="pl-9"
                />
              </label>
              <select
                value={filterProduct}
                onChange={(event) => setFilterProduct(event.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRows.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/60 p-8 text-center">
                <PackageOpen className="mx-auto size-10 text-muted-foreground/40" />
                <p className="font-medium text-foreground">No stock lots match this view</p>
                <p className="text-sm text-muted-foreground">Adjust filters or add a new lot on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/55">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lot</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expiry</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Units</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRows.map((row) => {
                      const expiryMeta = getExpiryMeta(row.expiry_date);
                      return (
                        <tr key={row.id} className="hover:bg-secondary/35">
                          <td className="px-3 py-3">
                            <p className="font-semibold text-foreground">{row.product_name}</p>
                            <p className="text-xs text-muted-foreground">{row.sku}</p>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-foreground">{row.lot_number}</td>
                          <td className="px-3 py-3 text-foreground">{formatDate(row.expiry_date)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-foreground">{Number(row.qty_units).toLocaleString()}</td>
                          <td className="px-3 py-3">
                            <Badge className={expiryMeta.className}>{expiryMeta.label}</Badge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                  setEditing(row);
                                  setEditForm({
                                    productId: String(row.product_id),
                                    lotNumber: row.lot_number,
                                    expiryDate: row.expiry_date,
                                    qtyUnits: String(row.qty_units),
                                    reason: "",
                                  });
                                }}
                              >
                                <PencilLine className="size-3.5" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleting(row);
                                  setDeleteReason("");
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StockAdjustmentHistory adjustments={filteredAdjustments} />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Lot</DialogTitle>
            <DialogDescription>Update the lot details to match the physical stock on hand.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdate}>
            <FormFields form={editForm} products={products} onChange={setEditForm} />
            <div className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              Use delete if the lot no longer exists physically. Edit is intended for corrections.
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setDeleteReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Lot</DialogTitle>
            <DialogDescription>
              Removing a lot also writes a ledger entry so the stock history stays auditable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{deleting?.product_name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{deleting?.lot_number}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {deleting ? Number(deleting.qty_units).toLocaleString() : 0} units will be removed.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-reason">Reason</Label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Damaged, expired, duplicate entry..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={submitting} onClick={() => void handleDelete()}>
              {submitting ? "Removing..." : "Delete lot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormFields({
  form,
  products,
  onChange,
}: {
  form: StockForm;
  products: Product[];
  onChange: React.Dispatch<React.SetStateAction<StockForm>>;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="stock-product">Product</Label>
        <select
          id="stock-product"
          value={form.productId}
          onChange={(event) => onChange((prev) => ({ ...prev, productId: event.target.value }))}
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          required
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stock-lot">Lot number</Label>
        <Input
          id="stock-lot"
          value={form.lotNumber}
          onChange={(event) => onChange((prev) => ({ ...prev, lotNumber: event.target.value }))}
          placeholder="LOT-2026-001"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="stock-expiry">Expiry date</Label>
          <Input
            id="stock-expiry"
            type="date"
            value={form.expiryDate}
            onChange={(event) => onChange((prev) => ({ ...prev, expiryDate: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock-qty">Units</Label>
          <Input
            id="stock-qty"
            type="number"
            min="1"
            value={form.qtyUnits}
            onChange={(event) => onChange((prev) => ({ ...prev, qtyUnits: event.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stock-reason">Reason / note</Label>
        <Input
          id="stock-reason"
          value={form.reason}
          onChange={(event) => onChange((prev) => ({ ...prev, reason: event.target.value }))}
          placeholder="Optional note for the stock ledger"
        />
      </div>
    </>
  );
}
