import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getStatus, type Month, type RollforwardResult, type Units } from "@/lib/calculations";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { searchParams } = new URL(req.url);
  const planningMonth: Month = (searchParams.get("planningMonth") ?? getCurrentMonth()) as Month;
  const horizon = 8; // 8-month rolling window

  // 1. All products
  const products = await queryAll<{
    id: number; name: string; sku: string;
    packing_per_pallet: number; exw_price_eur: number;
  }>("SELECT * FROM products ORDER BY name");

  // 2. Current stock per product (sum all lots)
  const stockRows = await queryAll<{ product_id: number; total: number }>(
    "SELECT product_id, SUM(qty_units) as total FROM stock GROUP BY product_id"
  );
  const stockMap: Record<number, number> = {};
  for (const r of stockRows) stockMap[r.product_id] = toNumber(r.total);

  // 3. Incoming PO units per (product, arrival_month)
  const poRows = await queryAll<{
    product_id: number; arrival_month: string; qty_pallets: number; packing_per_pallet: number;
  }>(
    `SELECT pi.product_id, po.arrival_month, pi.qty_pallets, p.packing_per_pallet
     FROM po_items pi
     JOIN purchase_orders po ON pi.po_id = po.id
     JOIN products p ON pi.product_id = p.id
     WHERE po.status IN ('ordered','confirmed','in_transit')`
  );
  const inpoMap: Record<string, number> = {}; // key: "productId:YYYY-MM"
  for (const r of poRows) {
    const key = `${r.product_id}:${r.arrival_month}`;
    const units = toNumber(r.qty_pallets) * toNumber(r.packing_per_pallet);
    inpoMap[key] = (inpoMap[key] ?? 0) + units;
  }

  // 4. Forecast totals per (product, month)
  const fcRows = await queryAll<{ product_id: number; month: string; total: number }>(
    "SELECT product_id, month, SUM(qty_units) as total FROM forecasts GROUP BY product_id, month"
  );
  const fcMap: Record<string, number> = {};
  for (const r of fcRows) {
    fcMap[`${r.product_id}:${r.month}`] = toNumber(r.total);
  }

  // 5. Build month list
  const months: Month[] = [];
  for (let i = 0; i < horizon; i++) {
    months.push(addMonths(planningMonth, i));
  }

  // 6. Compute rollforward per product
  const results: RollforwardResult[] = [];
  for (const p of products) {
    const currentStock = stockMap[p.id] ?? 0;
    let runningBalance: Units = currentStock;
    const entries = [];
    for (const month of months) {
      const incoming = inpoMap[`${p.id}:${month}`] ?? 0;
      const forecast = fcMap[`${p.id}:${month}`] ?? 0;
      runningBalance = runningBalance + incoming - forecast;
      const status = getStatus(runningBalance, p.packing_per_pallet);
      entries.push({ month, currentStock, incomingPOUnits: incoming, forecastUnits: forecast, balance: runningBalance, status });
    }
    results.push({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      packingPerPallet: p.packing_per_pallet,
      currentStock,
      exwPriceEur: p.exw_price_eur,
      entries,
    });
  }

  return NextResponse.json({ planningMonth, months, results });
}

function addMonths(yearMonth: Month, count: number): Month {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + count, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonth(): Month {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}
