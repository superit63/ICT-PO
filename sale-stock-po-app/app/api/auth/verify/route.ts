import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN required" }, { status: 400 });
    }

    const record = await queryOne<{ value: string }>(
      "SELECT value FROM app_config WHERE key = 'pin_hash'"
    );

    if (!record) {
      return NextResponse.json({ error: "PIN not set up yet" }, { status: 404 });
    }

    const valid = await bcrypt.compare(pin, record.value);
    if (!valid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session_pin", "1", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[auth/verify]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
