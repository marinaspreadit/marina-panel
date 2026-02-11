import { NextResponse } from "next/server";

import { logEvent } from "@/lib/events";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { kind?: string; title?: string; detail?: string }
    | null;

  if (!body?.title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  await logEvent({
    kind: (body.kind as any) ?? "info",
    title: body.title,
    detail: body.detail ?? "",
  });

  return NextResponse.json({ ok: true });
}
