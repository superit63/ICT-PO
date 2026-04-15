import { NextRequest, NextResponse } from "next/server";
import { queryOne, executeSql } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;
  const product = await queryOne("SELECT * FROM products WHERE id = ?", [id]);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;
  const { name, sku, exw_price_eur, packing_per_pallet } = await req.json();
  const trimmedName = String(name ?? "").trim();
  const trimmedSku = String(sku ?? "").trim();
  if (!trimmedName || !trimmedSku) {
    return NextResponse.json({ error: "name and sku required" }, { status: 400 });
  }

  try {
    await executeSql(
      `UPDATE products SET name=?, sku=?, exw_price_eur=?, packing_per_pallet=? WHERE id=?`,
      [trimmedName, trimmedSku, Number(exw_price_eur ?? 0), Math.max(1, Number(packing_per_pallet ?? 1)), id]
    );
    const product = await queryOne("SELECT * FROM products WHERE id = ?", [id]);
    return NextResponse.json(product);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { id } = await params;

  const [forecastUsage, stockUsage, poUsage] = await Promise.all([
    queryOne<{ count: number }>("SELECT COUNT(*) as count FROM forecasts WHERE product_id = ?", [id]),
    queryOne<{ count: number }>("SELECT COUNT(*) as count FROM stock WHERE product_id = ?", [id]),
    queryOne<{ count: number }>("SELECT COUNT(*) as count FROM po_items WHERE product_id = ?", [id]),
  ]);
  const dependencies =
    Number(forecastUsage?.count ?? 0) + Number(stockUsage?.count ?? 0) + Number(poUsage?.count ?? 0);
  if (dependencies > 0) {
    return NextResponse.json(
      { error: "Cannot delete a product that is already used in forecasts, stock, or purchase orders." },
      { status: 409 }
    );
  }

  await executeSql("DELETE FROM products WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
