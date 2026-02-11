import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pass = process.env.PANEL_PASSWORD;
  if (!pass) return NextResponse.next();

  const cookie = req.cookies.get("mp_auth")?.value;
  const ok = cookie === pass;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
