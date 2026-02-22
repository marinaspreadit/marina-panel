export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireDb } from "@/db";
import { artifacts } from "@/db/schema";
import { eq } from "drizzle-orm";

function requireAuth(req: NextRequest) {
  const pass = process.env.PANEL_PASSWORD;
  if (!pass) return;
  const cookie = req.cookies.get("mp_auth")?.value;
  if (cookie !== pass) {
    throw new Response("Unauthorized", { status: 401 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(req);

    const { id } = await params;
    const db = requireDb();
    const rows = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
    const a: any = rows[0];

    if (!a) return new NextResponse("Not found", { status: 404 });
    if (a.storage !== "inline") return new NextResponse("Not an inline artifact", { status: 400 });
    if (!a.contentBase64) return new NextResponse("Empty artifact", { status: 400 });

    const buf = Buffer.from(a.contentBase64, "base64");
    const filename = (a.filename || a.name || "artifact").replace(/[\r\n\"]/g, "_");

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": a.mime || "application/octet-stream",
        "content-length": String(buf.length),
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new NextResponse("Server error", { status: 500 });
  }
}
