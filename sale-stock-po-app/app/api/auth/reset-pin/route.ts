import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, executeSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session_pin");
  if (!cookie?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { newPin } = await req.json();
    if (!newPin || typeof newPin !== "string" || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPin, 10);
    await executeSql(
      "UPDATE app_config SET value = ? WHERE key = 'pin_hash'",
      [hash]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset-pin]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
