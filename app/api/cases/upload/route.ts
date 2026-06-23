import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { replaceCases } from "@/lib/db";
import { parseCasesWorkbook } from "@/lib/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel file." }, { status: 400 });
  }

  const validExtension = /\.(xlsx|xls|xlsm)$/i.test(file.name);
  if (!validExtension) {
    return NextResponse.json({ error: "Only Excel files are supported." }, { status: 400 });
  }

  const rows = parseCasesWorkbook(await file.arrayBuffer());
  replaceCases(rows);

  return NextResponse.json({
    ok: true,
    imported: rows.length
  });
}
