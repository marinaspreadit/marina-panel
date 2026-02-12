import { NextResponse } from "next/server";

import { requireDb } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";

function b64ToUint8(b64: string) {
  const bin = Buffer.from(b64, "base64");
  return new Uint8Array(bin);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = requireDb();
  const rows = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
  const a = rows[0];
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // For url-only artifacts, just redirect.
  if ((a as any).storage === "url" || !(a as any).contentBase64) {
    const url = (a as any).url as string;
    if (!url) return NextResponse.json({ error: "No content" }, { status: 400 });
    return NextResponse.redirect(url);
  }

  const mime = ((a as any).mime as string) || "application/octet-stream";
  const filename = ((a as any).filename as string) || `${(a as any).name || "artifact"}`;

  const bytes = b64ToUint8((a as any).contentBase64 as string);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename=\"${filename.replaceAll('"', "") }\"`,
      "Cache-Control": "no-store",
    },
  });
}
