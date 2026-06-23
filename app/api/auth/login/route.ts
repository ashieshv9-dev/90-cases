import { NextResponse } from "next/server";
import { createSessionToken, getAdminPin, sessionCookieName, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { pin?: string } | null;
  const pin = String(body?.pin || "").trim();

  if (pin !== getAdminPin()) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, createSessionToken(), sessionCookieOptions());

  return response;
}
