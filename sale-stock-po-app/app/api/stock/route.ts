import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";
import { logStockAdjustment } from "@/lib/stock-adjustments";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  let sql = `SELECT s.*, p.name as product_name, p.sku
             FROM stock s
             JOIN products p ON s.product_id=p.id
             WHERE 1=1`;
  const args: unknown[] = [];
  if (productId) { sql += " AND s.product_id=?"; args.push(productId); }
  sql += " ORDER BY s.expiry_date, p.name, s.lot_number";
  const rows = await queryAll(sql, args);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { product_id, lot_number, expiry_date, qty_units, reason } = await req.json();
  const normalizedLotNumber = String(lot_number ?? "").trim();
  const normalizedExpiryDate = String(expiry_date ?? "").slice(0, 10);
  const normalizedQty = Number(qty_units ?? 0);
  const normalizedReason = String(reason ?? "").trim() || null;
  if (!product_id || !normalizedLotNumber || !normalizedExpiryDate || qty_units == null) {
    return NextResponse.json({ error: "product_id, lot_number, expiry_date, qty_units required" }, { status: 400 });
  }
  if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
    return NextResponse.json({ error: "qty_units must be greater than 0" }, { status: 400 });
  }
  const result = await executeSql(
    `INSERT INTO stock (product_id, lot_number, expiry_date, qty_units)
     VALUES (?, ?, ?, ?)`,
    [product_id, normalizedLotNumber, normalizedExpiryDate, normalizedQty]
  );
  const stockId = Number(result.lastInsertRowid);
  await logStockAdjustment({
    stockId,
    productId: Number(product_id),
    lotNumber: normalizedLotNumber,
    expiryDate: normalizedExpiryDate,
    changeType: "create",
    reason: normalizedReason,
    qtyDelta: normalizedQty,
    previousQty: 0,
    nextQty: normalizedQty,
  });
  const row = await queryOne("SELECT * FROM stock WHERE id = ?", [stockId]);
  return NextResponse.json(row, { status: 201 });
}
