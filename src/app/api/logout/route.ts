import { NextResponse } from "next/server";

import { logEvent } from "@/lib/events";

export async function GET(req: Request) {
  await logEvent({ kind: "info", title: "Logout", detail: "Panel session ended" });

  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set("mp_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
