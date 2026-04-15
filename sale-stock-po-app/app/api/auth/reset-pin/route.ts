import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { executeSql } from "@/lib/db";
import { hasValidRequestSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (!(await hasValidRequestSession(req))) {
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

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session_pin", hash, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[auth/reset-pin]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
