import { NextResponse } from "next/server";

/**
 * Start Spotify OAuth flow.
 *
 * Env vars required (set in Vercel):
 * - SPOTIFY_CLIENT_ID
 * - SPOTIFY_REDIRECT_URI (should be https://marina-panel.vercel.app/api/spotify/callback)
 *
 * Optional:
 * - SPOTIFY_SCOPES (space-separated)
 */
export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_env",
        details:
          "Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI in environment.",
      },
      { status: 500 }
    );
  }

  const scopes =
    process.env.SPOTIFY_SCOPES ||
    [
      "playlist-read-private",
      "playlist-modify-private",
      "playlist-modify-public",
      "user-library-read",
      "user-library-modify",
    ].join(" ");

  const state = crypto.randomUUID();

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
