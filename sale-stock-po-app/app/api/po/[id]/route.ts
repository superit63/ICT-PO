import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll, executeSql } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
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
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { id } = await params;
  const body = await req.json();

  // Dispatch based on action field (for PATCH-style semantics)
  if (body.action === "receive") {
    return handleReceive(id, body.lots);
  }
  if (body.action === "update_status") {
    return handleUpdateStatus(id, body.status);
  }

  // Legacy flat PUT: { status } or { notes } or { items }
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

  const updated = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  const updatedItems = await queryAll(
    `SELECT pi.*, p.name as product_name FROM po_items pi JOIN products p ON pi.product_id=p.id WHERE pi.po_id=?`,
    [id]
  );
  return NextResponse.json({ ...updated, items: updatedItems });
}

// ─── Internal handlers ───────────────────────────────────────────────────────

async function handleUpdateStatus(id: string, status: string) {
  const valid = ["ordered", "confirmed", "in_transit", "received"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  await executeSql("UPDATE purchase_orders SET status=? WHERE id=?", [status, id]);

  // "Receive PO" → add units to stock table
  if (status === "received") {
    const poItems = await queryAll<{ product_id: number; qty_pallets: number }>(
      "SELECT product_id, qty_pallets FROM po_items WHERE po_id = ?",
      [id]
    );
    const po = await queryOne<{ po_number: string }>(
      "SELECT po_number FROM purchase_orders WHERE id = ?",
      [id]
    );
    for (const item of poItems) {
      const product = await queryOne<{ packing_per_pallet: number }>(
        "SELECT packing_per_pallet FROM products WHERE id = ?",
        [item.product_id]
      );
      const units = item.qty_pallets * (product?.packing_per_pallet ?? 1);
      await executeSql(
        `INSERT INTO stock (product_id, lot_number, expiry_date, qty_units)
         VALUES (?, ?, ?, ?)`,
        [item.product_id, po?.po_number ?? "unknown", "2099-12-31", units]
      );
    }
  }

  const updated = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  const updatedItems = await queryAll(
    `SELECT pi.*, p.name as product_name FROM po_items pi JOIN products p ON pi.product_id=p.id WHERE pi.po_id=?`,
    [id]
  );
  return NextResponse.json({ ...updated, items: updatedItems });
}

async function handleReceive(id: string, lots: {
  product_id: number;
  lot_number: string;
  expiry_date: string;
  qty_units: number;
}[]) {
  if (!Array.isArray(lots) || lots.length === 0) {
    return NextResponse.json({ error: "lots array required" }, { status: 400 });
  }

  // 1. Update PO status to received
  await executeSql("UPDATE purchase_orders SET status='received' WHERE id=?", [id]);

  // 2. Insert stock entries — add to existing stock qty
  for (const lot of lots) {
    // Ensure expiry_date is in DB format
    const expiryDate = lot.expiry_date
      ? String(lot.expiry_date).slice(0, 10)
      : "2099-12-31";

    await executeSql(
      `INSERT INTO stock (product_id, lot_number, expiry_date, qty_units)
       VALUES (?, ?, ?, ?)`,
      [lot.product_id, lot.lot_number, expiryDate, lot.qty_units]
    );
  }

  const updated = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  const updatedItems = await queryAll(
    `SELECT pi.*, p.name as product_name, p.sku, p.exw_price_eur, p.packing_per_pallet
     FROM po_items pi JOIN products p ON pi.product_id=p.id WHERE pi.po_id=?`,
    [id]
  );
  return NextResponse.json({ ...updated, items: updatedItems });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
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
