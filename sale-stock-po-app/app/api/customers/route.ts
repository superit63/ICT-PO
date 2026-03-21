import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const customers = await queryAll("SELECT * FROM customers ORDER BY name");
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) return unauthorized();
  const { name, region, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const result = await executeSql(
    "INSERT INTO customers (name, region, notes) VALUES (?, ?, ?)",
    [name, region ?? "MB", notes ?? null]
  );
  const customer = await queryOne("SELECT * FROM customers WHERE id = ?", [Number(result.lastInsertRowid)]);
  return NextResponse.json(customer, { status: 201 });
}
