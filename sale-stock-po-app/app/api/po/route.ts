import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status").filter(Boolean);
  let sql = `SELECT po.*, pi.id as item_id, pi.product_id, pi.qty_pallets,
             p.name as product_name, p.sku, p.exw_price_eur, p.packing_per_pallet
             FROM purchase_orders po
             LEFT JOIN po_items pi ON po.id = pi.po_id
             LEFT JOIN products p ON pi.product_id = p.id
             WHERE 1=1`;
  const args: unknown[] = [];
  if (statuses.length > 0) {
    sql += ` AND po.status IN (${statuses.map(() => "?").join(",")})`;
    args.push(...statuses);
  }
  sql += " ORDER BY po.created_at DESC";
  const rows = await queryAll(sql, args);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  try {
    const { po_number, order_date, arrival_month, notes, items } = await req.json();
    if (!po_number || !order_date || !arrival_month || !items?.length) {
      return NextResponse.json({ error: "po_number, order_date, arrival_month, items required" }, { status: 400 });
    }
    const result = await executeSql(
      `INSERT INTO purchase_orders (po_number, order_date, arrival_month, notes)
       VALUES (?, ?, ?, ?)`,
      [po_number, order_date, arrival_month, notes ?? null]
    );
    const poId = Number(result.lastInsertRowid);
    for (const item of items) {
      await executeSql(
        "INSERT INTO po_items (po_id, product_id, qty_pallets) VALUES (?, ?, ?)",
        [poId, item.product_id, item.qty_pallets]
      );
    }
    const po = await queryOne("SELECT * FROM purchase_orders WHERE id = ?", [poId]);
    return NextResponse.json(po, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "PO number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
