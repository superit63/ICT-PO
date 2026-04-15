import { NextRequest, NextResponse } from "next/server";
import { executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeCustomerInput(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? "").trim(),
    region: String(body.region ?? "MB").trim() || "MB",
    notes: String(body.notes ?? "").trim() || null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const customer = await queryOne("SELECT * FROM customers WHERE id = ?", [id]);
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const payload = normalizeCustomerInput(await req.json());
  if (!payload.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  await executeSql("UPDATE customers SET name = ?, region = ?, notes = ? WHERE id = ?", [
    payload.name,
    payload.region,
    payload.notes,
    id,
  ]);

  const customer = await queryOne("SELECT * FROM customers WHERE id = ?", [id]);
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { id } = await params;
  const forecastUsage = await queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM forecasts WHERE customer_id = ?",
    [id]
  );
  if (Number(forecastUsage?.count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a customer that already has forecast data." },
      { status: 409 }
    );
  }

  await executeSql("DELETE FROM customers WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
