import { NextRequest, NextResponse } from "next/server";
import { queryOne, executeSql } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { id } = await params;
  const product = await queryOne("SELECT * FROM products WHERE id = ?", [id]);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { id } = await params;
  const { name, sku, exw_price_eur, packing_per_pallet } = await req.json();
  await executeSql(
    `UPDATE products SET name=?, sku=?, exw_price_eur=?, packing_per_pallet=? WHERE id=?`,
    [name, sku, exw_price_eur, packing_per_pallet, id]
  );
  const product = await queryOne("SELECT * FROM products WHERE id = ?", [id]);
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { id } = await params;
  await executeSql("DELETE FROM products WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
