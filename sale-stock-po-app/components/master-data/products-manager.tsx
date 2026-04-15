"use client";

import { useDeferredValue, useRef, useState } from "react";
import { Download, PencilLine, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
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
import type { Product } from "@/components/master-data/master-data-workspace";
import { exportSheet, readSheetNumber, readSheetRows, readSheetText } from "@/lib/master-data-sheet";

type ProductForm = { name: string; sku: string; exwPriceEur: string; packingPerPallet: string };

const EMPTY_FORM: ProductForm = { name: "", sku: "", exwPriceEur: "", packingPerPallet: "1" };
const PRODUCT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "exw_price_eur", label: "EXW Price (EUR)" },
  { key: "packing_per_pallet", label: "Units per Pallet" },
];

export function ProductsManager({ products, onRefresh }: { products: Product[]; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredProducts = products.filter((product) => {
    if (!deferredQuery) return true;
    return `${product.name} ${product.sku}`.toLowerCase().includes(deferredQuery);
  });

  async function saveProduct(endpoint: string, method: "POST" | "PUT", payload: ProductForm) {
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          sku: payload.sku,
          exw_price_eur: Number(payload.exwPriceEur || 0),
          packing_per_pallet: Number(payload.packingPerPallet || 1),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      await onRefresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    await exportSheet({
      rows: products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        exw_price_eur: product.exw_price_eur,
        packing_per_pallet: product.packing_per_pallet,
      })),
      columns: PRODUCT_COLUMNS,
      filename: "products-master-data.xlsx",
      sheetName: "Products",
    });
    toast.success("Product sheet exported");
  }

  async function handleImport(file: File | null) {
    if (!file) return;
    setImporting(true);
    try {
      const rows = await readSheetRows(file);
      const payload = rows
        .map((row) => {
          const id = readSheetNumber(row, ["id", "productid"]);
          const name = readSheetText(row, ["productname", "name", "product"]);
          const sku = readSheetText(row, ["sku", "productsku"]);
          if (!id && !name && !sku) return null;
          return {
            id: id || null,
            name,
            sku,
            exw_price_eur: readSheetNumber(row, ["exwpriceeur", "exweur", "priceeur", "exwprice"]),
            packing_per_pallet: Math.max(
              1,
              readSheetNumber(row, ["unitsperpallet", "packingperpallet", "unitspallet", "palletunits"], 1)
            ),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (payload.length === 0) {
        throw new Error("No product rows found in the sheet");
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      await onRefresh();
      toast.success(`Imported products: ${data.created ?? 0} created, ${data.updated ?? 0} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
          <CardDescription>Create the SKUs used in stock, forecasts, and purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const saved = await saveProduct("/api/products", "POST", form);
              if (!saved) return;
              setForm(EMPTY_FORM);
              toast.success("Product added");
            }}
          >
            <ProductFields form={form} onChange={setForm} />
            <Button type="submit" disabled={saving} className="gap-1.5">
              <Plus className="size-3.5" />
              {saving ? "Saving..." : "Add product"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Search, export, or bulk import the SKU list you want to maintain.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleExport()}>
                <Download className="size-3.5" />
                Export sheet
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {importing ? "Importing..." : "Import sheet"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => void handleImport(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or SKU" className="pl-9" />
          </label>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/55">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SKU</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">EXW EUR</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Units / pallet</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/35">
                    <td className="px-3 py-3 font-semibold text-foreground">{product.name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="px-3 py-3 text-right text-foreground">{Number(product.exw_price_eur).toFixed(3)}</td>
                    <td className="px-3 py-3 text-right text-foreground">{product.packing_per_pallet}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            setEditing(product);
                            setEditForm({
                              name: product.name,
                              sku: product.sku,
                              exwPriceEur: String(product.exw_price_eur),
                              packingPerPallet: String(product.packing_per_pallet),
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
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
                              const data = await response.json();
                              if (!response.ok) throw new Error(data.error ?? "Delete failed");
                              await onRefresh();
                              toast.success(`Deleted ${product.name}`);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Delete failed");
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Keep the SKU and pallet settings aligned with supplier reality.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!editing) return;
              const saved = await saveProduct(`/api/products/${editing.id}`, "PUT", editForm);
              if (!saved) return;
              setEditing(null);
              toast.success("Product updated");
            }}
          >
            <ProductFields form={editForm} onChange={setEditForm} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductFields({
  form,
  onChange,
}: {
  form: ProductForm;
  onChange: React.Dispatch<React.SetStateAction<ProductForm>>;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="product-name">Product name</Label>
        <Input id="product-name" value={form.name} onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product-sku">SKU</Label>
        <Input id="product-sku" value={form.sku} onChange={(event) => onChange((prev) => ({ ...prev, sku: event.target.value }))} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product-price">EXW price (EUR)</Label>
          <Input id="product-price" type="number" step="0.001" min="0" value={form.exwPriceEur} onChange={(event) => onChange((prev) => ({ ...prev, exwPriceEur: event.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-packing">Units per pallet</Label>
          <Input id="product-packing" type="number" min="1" value={form.packingPerPallet} onChange={(event) => onChange((prev) => ({ ...prev, packingPerPallet: event.target.value }))} required />
        </div>
      </div>
    </>
  );
}
