import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll, executeSql } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";
import { logStockAdjustment } from "@/lib/stock-adjustments";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type POLotInput = {
  product_id: number;
  lot_number: string;
  expiry_date: string;
  qty_units: number;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;
  const po = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await queryAll(
    `SELECT pi.*, p.name as product_name, p.sku, p.exw_price_eur, p.packing_per_pallet
     FROM po_items pi JOIN products p ON pi.product_id=p.id WHERE pi.po_id=?`,
    [id]
  );
  return NextResponse.json({ ...po, items });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "receive") {
    return handleReceive(id, body.lots);
  }
  if (body.action === "update_status") {
    return handleUpdateStatus(id, body.status);
  }

  const { status, notes, items } = body;
  if (status !== undefined) {
    return handleUpdateStatus(id, status);
  }
  if (notes !== undefined) {
    await executeSql("UPDATE purchase_orders SET notes=? WHERE id=?", [notes, id]);
  }
  if (items !== undefined) {
    await executeSql("DELETE FROM po_items WHERE po_id = ?", [id]);
    for (const item of items) {
      await executeSql(
        "INSERT INTO po_items (po_id, product_id, qty_pallets) VALUES (?, ?, ?)",
        [id, item.product_id, item.qty_pallets]
      );
    }
  }

  return buildPOResponse(id);
}

async function handleUpdateStatus(id: string, status: string) {
  const valid = ["ordered", "confirmed", "in_transit", "received"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const po = await queryOne<{ status: string; po_number: string }>(
    "SELECT status, po_number FROM purchase_orders WHERE id = ?",
    [id]
  );
  if (!po) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (po.status === "received" && status === "received") {
    return NextResponse.json({ error: "Purchase order already received" }, { status: 409 });
  }

  await executeSql("UPDATE purchase_orders SET status=? WHERE id=?", [status, id]);

  if (status === "received") {
    const poItems = await queryAll<{ product_id: number; qty_pallets: number }>(
      "SELECT product_id, qty_pallets FROM po_items WHERE po_id = ?",
      [id]
    );
    for (const item of poItems) {
      const product = await queryOne<{ packing_per_pallet: number }>(
        "SELECT packing_per_pallet FROM products WHERE id = ?",
        [item.product_id]
      );
      const qtyUnits = item.qty_pallets * (product?.packing_per_pallet ?? 1);
      await insertReceivedStockLot({
        poId: id,
        poNumber: po.po_number,
        productId: item.product_id,
        lotNumber: po.po_number ?? "unknown",
        expiryDate: "2099-12-31",
        qtyUnits,
      });
    }
  }

  return buildPOResponse(id);
}

async function handleReceive(id: string, lots: POLotInput[]) {
  if (!Array.isArray(lots) || lots.length === 0) {
    return NextResponse.json({ error: "lots array required" }, { status: 400 });
  }

  const po = await queryOne<{ status: string; po_number: string }>(
    "SELECT status, po_number FROM purchase_orders WHERE id = ?",
    [id]
  );
  if (!po) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (po.status === "received") {
    return NextResponse.json({ error: "Purchase order already received" }, { status: 409 });
  }

  await executeSql("UPDATE purchase_orders SET status='received' WHERE id=?", [id]);

  for (const lot of lots) {
    const lotNumber = String(lot.lot_number ?? "").trim();
    const expiryDate = String(lot.expiry_date ?? "").trim()
      ? String(lot.expiry_date).slice(0, 10)
      : "2099-12-31";
    const qtyUnits = Number(lot.qty_units ?? 0);

    if (!lot.product_id || !lotNumber || !expiryDate || !Number.isFinite(qtyUnits) || qtyUnits <= 0) {
      return NextResponse.json(
        { error: "Each received lot needs product, lot, expiry date, and quantity." },
        { status: 400 }
      );
    }

    await insertReceivedStockLot({
      poId: id,
      poNumber: po.po_number,
      productId: Number(lot.product_id),
      lotNumber,
      expiryDate,
      qtyUnits,
    });
  }

  return buildPOResponse(id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;
  const po = await queryOne<{ status: string }>(
    "SELECT status FROM purchase_orders WHERE id = ?",
    [id]
  );
  if (po?.status === "received") {
    return NextResponse.json({ error: "Cannot delete a received PO" }, { status: 400 });
  }
  await executeSql("DELETE FROM po_items WHERE po_id = ?", [id]);
  await executeSql("DELETE FROM purchase_orders WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}

async function buildPOResponse(id: string) {
  const updated = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  const updatedItems = await queryAll(
    `SELECT pi.*, p.name as product_name, p.sku, p.exw_price_eur, p.packing_per_pallet
     FROM po_items pi JOIN products p ON pi.product_id=p.id WHERE pi.po_id=?`,
    [id]
  );
  return NextResponse.json({ ...updated, items: updatedItems });
}

async function insertReceivedStockLot({
  poId,
  poNumber,
  productId,
  lotNumber,
  expiryDate,
  qtyUnits,
}: {
  poId: string;
  poNumber: string;
  productId: number;
  lotNumber: string;
  expiryDate: string;
  qtyUnits: number;
}) {
  const result = await executeSql(
    `INSERT INTO stock (product_id, lot_number, expiry_date, qty_units)
     VALUES (?, ?, ?, ?)`,
    [productId, lotNumber, expiryDate, qtyUnits]
  );
  await logStockAdjustment({
    stockId: Number(result.lastInsertRowid),
    productId,
    lotNumber,
    expiryDate,
    changeType: "receipt",
    reason: `Received from PO ${poNumber}`,
    qtyDelta: qtyUnits,
    previousQty: 0,
    nextQty: qtyUnits,
    referenceType: "purchase_order",
    referenceId: poId,
  });
}
