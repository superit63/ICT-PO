"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    // Generate PO number
    const now = new Date();
    setPoNumber(`PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`);
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === productId);

  function checkContainer(qty: number) {
    if (qty !== 22 && qty !== 44 && qty > 0) {
      setContainerWarn(`⚠️ Container warning: ${qty} pallets is non-standard. Standard sizes are 22 or 44 pallets per container.`);
    } else {
      setContainerWarn("");
    }
  }

  const poValue = selectedProduct
    ? parseInt(pallets) * selectedProduct.packing_per_pallet * selectedProduct.exw_price_eur
    : 0;

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
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">➕ New Purchase Order</h1>
        <p className="text-sm text-slate-500">Order now → arrives in 5 months</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PO Number</Label>
                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1" required />
              </div>
            </div>

            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.sku})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qty Pallets</Label>
                <Input
                  type="number" min={1} value={pallets}
                  onChange={(e) => { setPallets(e.target.value); checkContainer(parseInt(e.target.value) || 0); }}
                  className="mt-1" required
                />
              </div>
              <div>
                <Label>Arrival Month</Label>
                <Input type="month" value={arrivalMonth} onChange={(e) => setArrivalMonth(e.target.value)} className="mt-1" required />
              </div>
            </div>

            {containerWarn && (
              <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded px-3 py-2">{containerWarn}</p>
            )}

            {selectedProduct && (
              <div className="rounded-md bg-slate-50 border p-3 space-y-1 text-sm">
                <p className="font-medium text-slate-700">PO Preview</p>
                <div className="grid grid-cols-2 gap-x-4 text-slate-600">
                  <p>Units: <strong>{parseInt(pallets) * selectedProduct.packing_per_pallet}</strong></p>
                  <p>Unit price: <strong>€{selectedProduct.exw_price_eur.toFixed(3)}</strong></p>
                  <p>PO value: <strong className="text-blue-700">€{poValue.toLocaleString("en-EU", { minimumFractionDigits: 2 })}</strong></p>
                </div>
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Internal notes..." />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create PO"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewPOPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded" />}>
      <NewPOForm />
    </Suspense>
  );
}
