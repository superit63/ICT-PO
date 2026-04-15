import { NextRequest, NextResponse } from "next/server";
import { executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";
import { logStockAdjustment } from "@/lib/stock-adjustments";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeStockInput(body: Record<string, unknown>) {
  return {
    productId: Number(body.product_id ?? 0),
    lotNumber: String(body.lot_number ?? "").trim(),
    expiryDate: String(body.expiry_date ?? "").slice(0, 10),
    qtyUnits: Number(body.qty_units ?? 0),
    reason: String(body.reason ?? "").trim() || null,
  };
}

async function readOptionalBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const row = await queryOne(
    `SELECT s.*, p.name as product_name, p.sku
     FROM stock s
     JOIN products p ON s.product_id = p.id
     WHERE s.id = ?`,
    [id]
  );
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const payload = normalizeStockInput(await req.json());
  const existing = await queryOne<{
    id: number;
    product_id: number;
    lot_number: string;
    expiry_date: string;
    qty_units: number;
  }>("SELECT * FROM stock WHERE id = ?", [id]);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!payload.productId || !payload.lotNumber || !payload.expiryDate) {
    return NextResponse.json(
      { error: "product_id, lot_number, expiry_date, qty_units required" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(payload.qtyUnits) || payload.qtyUnits <= 0) {
    return NextResponse.json({ error: "qty_units must be greater than 0" }, { status: 400 });
  }

  await executeSql(
    `UPDATE stock
     SET product_id = ?, lot_number = ?, expiry_date = ?, qty_units = ?, updated_at = date('now')
     WHERE id = ?`,
    [payload.productId, payload.lotNumber, payload.expiryDate, payload.qtyUnits, id]
  );
  await logStockAdjustment({
    stockId: existing.id,
    productId: payload.productId,
    lotNumber: payload.lotNumber,
    expiryDate: payload.expiryDate,
    changeType: "update",
    reason: payload.reason,
    qtyDelta: payload.qtyUnits - Number(existing.qty_units ?? 0),
    previousQty: Number(existing.qty_units ?? 0),
    nextQty: payload.qtyUnits,
  });

  const row = await queryOne(
    `SELECT s.*, p.name as product_name, p.sku
     FROM stock s
     JOIN products p ON s.product_id = p.id
     WHERE s.id = ?`,
    [id]
  );
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const body = await readOptionalBody(req);
  const existing = await queryOne<{
    id: number;
    product_id: number;
    lot_number: string;
    expiry_date: string;
    qty_units: number;
  }>("SELECT * FROM stock WHERE id = ?", [id]);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logStockAdjustment({
    stockId: existing.id,
    productId: Number(existing.product_id),
    lotNumber: existing.lot_number,
    expiryDate: existing.expiry_date,
    changeType: "delete",
    reason: String(body.reason ?? "").trim() || null,
    qtyDelta: -Number(existing.qty_units ?? 0),
    previousQty: Number(existing.qty_units ?? 0),
    nextQty: 0,
  });
  await executeSql("DELETE FROM stock WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
