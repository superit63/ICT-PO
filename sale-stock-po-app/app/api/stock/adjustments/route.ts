import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) return unauthorized();

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 20)));
  let sql = `SELECT sa.*, p.name as product_name, p.sku
             FROM stock_adjustments sa
             JOIN products p ON sa.product_id = p.id
             WHERE 1=1`;
  const args: unknown[] = [];
  if (productId) {
    sql += " AND sa.product_id = ?";
    args.push(Number(productId));
  }
  sql += " ORDER BY sa.created_at DESC, sa.id DESC LIMIT ?";
  args.push(limit);

  const rows = await queryAll(sql, args);
  return NextResponse.json(rows);
}
