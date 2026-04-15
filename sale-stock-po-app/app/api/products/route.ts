import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type ProductPayload = {
  id: number | null;
  name: string;
  sku: string;
  exwPriceEur: number;
  packingPerPallet: number;
};

function normalizeProductInput(body: Record<string, unknown>): ProductPayload {
  return {
    id: Number(body.id ?? 0) || null,
    name: String(body.name ?? "").trim(),
    sku: String(body.sku ?? "").trim(),
    exwPriceEur: Number(body.exw_price_eur ?? body.exwPriceEur ?? 0),
    packingPerPallet: Math.max(1, Number(body.packing_per_pallet ?? body.packingPerPallet ?? 1)),
  };
}

async function upsertProduct(item: ProductPayload) {
  const existingById =
    item.id != null ? await queryOne<{ id: number }>("SELECT id FROM products WHERE id = ?", [item.id]) : null;
  const existingBySku = await queryOne<{ id: number }>(
    "SELECT id FROM products WHERE lower(sku) = lower(?)",
    [item.sku]
  );
  const targetId = existingById?.id ?? existingBySku?.id ?? null;

  if (targetId != null) {
    await executeSql(
      `UPDATE products
       SET name = ?, sku = ?, exw_price_eur = ?, packing_per_pallet = ?
       WHERE id = ?`,
      [item.name, item.sku, item.exwPriceEur, item.packingPerPallet, targetId]
    );
    return "updated" as const;
  }

  await executeSql(
    `INSERT INTO products (name, sku, exw_price_eur, packing_per_pallet)
     VALUES (?, ?, ?, ?)`,
    [item.name, item.sku, item.exwPriceEur, item.packingPerPallet]
  );
  return "created" as const;
}

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  try {
    const products = await queryAll("SELECT * FROM products ORDER BY name");
    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const deduped = new Map<string, ProductPayload>();
      for (const [index, rawItem] of body.entries()) {
        const item = normalizeProductInput(rawItem ?? {});
        if (!item.name || !item.sku) {
          return NextResponse.json({ error: `Row ${index + 2}: name and sku required` }, { status: 400 });
        }
        deduped.set((item.id ?? `sku:${item.sku}`).toString().toLowerCase(), item);
      }

      let created = 0;
      let updated = 0;
      for (const item of deduped.values()) {
        const action = await upsertProduct(item);
        if (action === "created") created += 1;
        if (action === "updated") updated += 1;
      }

      const products = await queryAll("SELECT * FROM products ORDER BY name");
      return NextResponse.json({ created, updated, items: products });
    }

    const item = normalizeProductInput(body);
    if (!item.name || !item.sku) {
      return NextResponse.json({ error: "name and sku required" }, { status: 400 });
    }

    const result = await executeSql(
      `INSERT INTO products (name, sku, exw_price_eur, packing_per_pallet)
       VALUES (?, ?, ?, ?)`,
      [item.name, item.sku, item.exwPriceEur, item.packingPerPallet]
    );
    const product = await queryOne("SELECT * FROM products WHERE id = ?", [Number(result.lastInsertRowid)]);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
