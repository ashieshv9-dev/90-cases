import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { getCaseStats, searchCases } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  return NextResponse.json({
    items: searchCases(query),
    stats: getCaseStats()
  });
}
