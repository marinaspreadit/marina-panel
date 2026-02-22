import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { requireDb } = await import("@/db");
    const { spotifyTokens } = await import("@/db/schema");
    const db = requireDb();

    const rows = await db.select().from(spotifyTokens).limit(1);
    const row = rows[0];

    return NextResponse.json({
      ok: true,
      connected: Boolean(row?.refreshToken),
      scope: row?.scope || "",
      tokenType: row?.tokenType || "",
      updatedAt: row?.updatedAt || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "status_failed",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
