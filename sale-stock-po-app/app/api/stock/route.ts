import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  let sql = "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id=p.id WHERE 1=1";
  const args: unknown[] = [];
  if (productId) { sql += " AND s.product_id=?"; args.push(productId); }
  sql += " ORDER BY s.expiry_date";
  const rows = await queryAll(sql, args);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { product_id, lot_number, expiry_date, qty_units } = await req.json();
  if (!product_id || !lot_number || !expiry_date || qty_units == null) {
    return NextResponse.json({ error: "product_id, lot_number, expiry_date, qty_units required" }, { status: 400 });
  }
  const result = await executeSql(
    `INSERT INTO stock (product_id, lot_number, expiry_date, qty_units)
     VALUES (?, ?, ?, ?)`,
    [product_id, lot_number, expiry_date, qty_units]
  );
  const row = await queryOne("SELECT * FROM stock WHERE id = ?", [Number(result.lastInsertRowid)]);
  return NextResponse.json(row, { status: 201 });
}
