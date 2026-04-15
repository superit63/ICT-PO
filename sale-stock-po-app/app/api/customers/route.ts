import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type CustomerPayload = {
  id: number | null;
  name: string;
  region: string;
  notes: string | null;
};

function normalizeCustomerInput(body: Record<string, unknown>): CustomerPayload {
  return {
    id: Number(body.id ?? 0) || null,
    name: String(body.name ?? "").trim(),
    region: String(body.region ?? "MB").trim() || "MB",
    notes: String(body.notes ?? "").trim() || null,
  };
}

async function upsertCustomer(item: CustomerPayload) {
  const existingById =
    item.id != null ? await queryOne<{ id: number }>("SELECT id FROM customers WHERE id = ?", [item.id]) : null;
  let targetId = existingById?.id ?? null;

  if (targetId == null) {
    const matches = await queryAll<{ id: number }>(
      "SELECT id FROM customers WHERE lower(name) = lower(?) AND lower(region) = lower(?) ORDER BY id",
      [item.name, item.region]
    );
    if (matches.length > 1) {
      throw new Error(`AMBIGUOUS:${item.name}:${item.region}`);
    }
    targetId = matches[0]?.id ?? null;
  }

  if (targetId != null) {
    await executeSql("UPDATE customers SET name = ?, region = ?, notes = ? WHERE id = ?", [
      item.name,
      item.region,
      item.notes,
      targetId,
    ]);
    return "updated" as const;
  }

  await executeSql("INSERT INTO customers (name, region, notes) VALUES (?, ?, ?)", [
    item.name,
    item.region,
    item.notes,
  ]);
  return "created" as const;
}

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const customers = await queryAll("SELECT * FROM customers ORDER BY name");
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const deduped = new Map<string, CustomerPayload>();
      for (const [index, rawItem] of body.entries()) {
        const item = normalizeCustomerInput(rawItem ?? {});
        if (!item.name) {
          return NextResponse.json({ error: `Row ${index + 2}: name required` }, { status: 400 });
        }
        deduped.set((item.id ?? `${item.name}:${item.region}`).toString().toLowerCase(), item);
      }

      let created = 0;
      let updated = 0;
      for (const item of deduped.values()) {
        const action = await upsertCustomer(item);
        if (action === "created") created += 1;
        if (action === "updated") updated += 1;
      }

      const customers = await queryAll("SELECT * FROM customers ORDER BY name");
      return NextResponse.json({ created, updated, items: customers });
    }

    const item = normalizeCustomerInput(body);
    if (!item.name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const result = await executeSql(
      "INSERT INTO customers (name, region, notes) VALUES (?, ?, ?)",
      [item.name, item.region, item.notes]
    );
    const customer = await queryOne("SELECT * FROM customers WHERE id = ?", [Number(result.lastInsertRowid)]);
    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message.startsWith("AMBIGUOUS:")) {
      return NextResponse.json(
        { error: "Bulk import found multiple existing customers with the same name and region. Export first to keep IDs." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
