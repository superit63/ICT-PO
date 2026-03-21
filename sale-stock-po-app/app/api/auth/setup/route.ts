import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, executeSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string" || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
    }

    const existing = await queryOne<{ value: string }>(
      "SELECT value FROM app_config WHERE key = 'pin_hash'"
    );
    if (existing) {
      return NextResponse.json({ error: "PIN already set up" }, { status: 409 });
    }

    const hash = await bcrypt.hash(pin, 10);
    await executeSql(
      "INSERT INTO app_config (key, value) VALUES ('pin_hash', ?)",
      [hash]
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session_pin", "1", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[auth/setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
