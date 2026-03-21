/**
 * GET /api/init — run DB migrations on first access.
 * Called by the root layout to ensure schema is up-to-date.
 */
import { NextResponse } from "next/server";
import { initDb } from "@/lib/init";

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/init]", err);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
