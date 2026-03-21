"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert as AlertTriangle, ChevronLeft, Package, Plus } from "lucide-react";

type Product = { id: number; name: string; sku: string; packing_per_pallet: number; exw_price_eur: number };

function NewPOForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState(params.get("productId") ?? "");
  const [pallets, setPallets] = useState(params.get("pallets") ?? "1");
  const [orderDate, setOrderDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [arrivalMonth, setArrivalMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [notes, setNotes] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [containerWarn, setContainerWarn] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    const now = new Date();
    setPoNumber(`PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`);
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === productId);

  function checkContainer(qty: number) {
    if (qty !== 22 && qty !== 44 && qty > 0) {
      setContainerWarn(`${qty} pallets is non-standard. Standard container sizes are 22 or 44 pallets.`);
    } else {
      setContainerWarn("");
    }
  }

  const palletsNum = parseInt(pallets) || 0;
  const poValue = selectedProduct
    ? palletsNum * selectedProduct.packing_per_pallet * selectedProduct.exw_price_eur
    : 0;
  const totalUnits = selectedProduct ? palletsNum * selectedProduct.packing_per_pallet : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !poNumber || !arrivalMonth) { setError("Please fill all required fields"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po_number: poNumber,
          order_date: orderDate,
          arrival_month: arrivalMonth,
          notes,
          items: [{ product_id: parseInt(productId), qty_pallets: parseInt(pallets) }],
        }),
      });
      if (res.ok) { router.push("/po"); }
      else { const d = await res.json(); setError(d.error ?? "Failed to create PO"); }
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-border">|</span>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            New Purchase Order
          </h1>
          <p className="text-sm text-muted-foreground">5-month lead time — plan accordingly</p>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="po-number">PO Number</Label>
                <Input
                  id="po-number"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-date">Order Date</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pallets">Qty Pallets</Label>
                <Input
                  id="pallets"
                  type="number"
                  min={1}
                  value={pallets}
                  onChange={(e) => {
                    setPallets(e.target.value);
                    checkContainer(parseInt(e.target.value) || 0);
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="arrival-month">Arrival Month</Label>
                <Input
                  id="arrival-month"
                  type="month"
                  value={arrivalMonth}
                  onChange={(e) => setArrivalMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            {containerWarn && (
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{containerWarn}</span>
              </div>
            )}

            {selectedProduct && (
              <Card className="bg-primary/5 border-primary/20 shadow-none">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    PO Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Total Units</p>
                      <p className="font-semibold">{totalUnits.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Unit Price</p>
                      <p className="font-semibold">€{selectedProduct.exw_price_eur.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">PO Value</p>
                      <p className="font-bold text-primary">
                        €{poValue.toLocaleString("en-EU", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="gap-2">
                <Plus className="w-4 h-4" />
                {loading ? "Creating..." : "Create PO"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewPOPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    }>
      <NewPOForm />
    </Suspense>
  );
}
