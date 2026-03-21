import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  try {
    const products = await queryAll("SELECT * FROM products ORDER BY name");
    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  try {
    const { name, sku, exw_price_eur, packing_per_pallet } = await req.json();
    if (!name || !sku) {
      return NextResponse.json({ error: "name and sku required" }, { status: 400 });
    }
    const result = await executeSql(
      `INSERT INTO products (name, sku, exw_price_eur, packing_per_pallet)
       VALUES (?, ?, ?, ?)`,
      [name, sku, exw_price_eur ?? 0, packing_per_pallet ?? 1]
    );
    const product = await queryOne("SELECT * FROM products WHERE id = ?", [
      Number(result.lastInsertRowid),
    ]);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
