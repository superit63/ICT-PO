import { NextRequest, NextResponse } from "next/server";
import { queryAll, executeSql, queryOne } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** GET /api/forecasts?productId=&customerId=&month= */
export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const customerId = searchParams.get("customerId");
  const month = searchParams.get("month");

  let sql = "SELECT f.*, p.name as product_name, c.name as customer_name FROM forecasts f JOIN products p ON f.product_id=p.id JOIN customers c ON f.customer_id=c.id WHERE 1=1";
  const args: unknown[] = [];
  if (productId) { sql += " AND f.product_id=?"; args.push(productId); }
  if (customerId) { sql += " AND f.customer_id=?"; args.push(customerId); }
  if (month) { sql += " AND f.month=?"; args.push(month); }
  sql += " ORDER BY c.name, p.name, f.month";

  const rows = await queryAll(sql, args);
  return NextResponse.json(rows);
}

/**
 * POST /api/forecasts — upsert one or many forecast rows.
 * Body: { customer_id, product_id, month, qty_units }[]  OR single object
 */
export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const results = [];
    for (const { customer_id, product_id, month, qty_units } of items) {
      if (!customer_id || !product_id || !month) continue;
      await executeSql(
        `INSERT INTO forecasts (customer_id, product_id, month, qty_units)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(customer_id, product_id, month)
         DO UPDATE SET qty_units = excluded.qty_units`,
        [customer_id, product_id, month, qty_units ?? 0]
      );
      const row = await queryOne(
        "SELECT * FROM forecasts WHERE customer_id=? AND product_id=? AND month=?",
        [customer_id, product_id, month]
      );
      results.push(row);
    }
    return NextResponse.json(results, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
