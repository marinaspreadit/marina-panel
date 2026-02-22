import { NextRequest, NextResponse } from "next/server";

/**
 * Spotify OAuth callback endpoint.
 *
 * Redirect URI to configure in Spotify Developer Dashboard:
 *   https://marina-panel.vercel.app/api/spotify/callback
 *
 * This endpoint is intentionally minimal: it captures the `code` and redirects
 * the user to an internal page or returns it for manual copy.
 *
 * NOTE: Full token exchange will be implemented once env vars are set:
 *   - SPOTIFY_CLIENT_ID
 *   - SPOTIFY_CLIENT_SECRET
 *   - SPOTIFY_REDIRECT_URI
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { ok: false, error, details: "Spotify returned an error in callback." },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "missing_code", details: "No code param in callback." },
      { status: 400 }
    );
  }

  // For now, show the code so we can finish wiring the token exchange.
  // We'll replace this with a server-side exchange + secure storage.
  return NextResponse.json({ ok: true, code, state });
}
