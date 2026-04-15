import type { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";

type PinHashRecord = { value: string };

export async function getPinHashRecord() {
  return queryOne<PinHashRecord>("SELECT value FROM app_config WHERE key = 'pin_hash'");
}

export async function hasValidSessionValue(sessionValue?: string | null) {
  if (!sessionValue) return false;
  const pinHash = await getPinHashRecord();
  return Boolean(pinHash?.value && pinHash.value === sessionValue);
}

export async function hasValidRequestSession(req: NextRequest) {
  return hasValidSessionValue(req.cookies.get("session_pin")?.value);
}
