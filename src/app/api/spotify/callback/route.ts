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

  // Token exchange (Authorization Code flow)
  // Requires SPOTIFY_CLIENT_SECRET in env.
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    // fallback: still return code so we can debug quickly
    return NextResponse.json(
      {
        ok: true,
        code,
        state,
        note: "Missing env vars for token exchange (SPOTIFY_CLIENT_ID/SECRET/REDIRECT_URI).",
      },
      { status: 200 }
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirectUri);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "token_exchange_failed",
        status: tokenRes.status,
        details: tokenJson,
      },
      { status: 500 }
    );
  }

  // For MVP: show success (later: store refresh_token + use it server-side)
  return NextResponse.json({
    ok: true,
    state,
    token_type: tokenJson.token_type,
    expires_in: tokenJson.expires_in,
    scope: tokenJson.scope,
    has_refresh_token: Boolean(tokenJson.refresh_token),
  });
}

