import { NextResponse } from "next/server";

import { logEvent } from "@/lib/events";

export async function POST(req: Request) {
  const { password, next } = (await req.json()) as {
    password?: string;
    next?: string;
  };

  const pass = process.env.PANEL_PASSWORD;
  if (!pass) {
    return NextResponse.json(
      { error: "PANEL_PASSWORD not set" },
      { status: 500 },
    );
  }

  if (!password || password !== pass) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await logEvent({ kind: "info", title: "Login", detail: "Panel session started" });

  const res = NextResponse.json({ ok: true, next: next || "/" });
  res.cookies.set("mp_auth", pass, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
