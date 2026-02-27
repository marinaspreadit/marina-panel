import { NextResponse } from "next/server";

async function getAccessToken() {
  const { requireDb } = await import("@/db");
  const { spotifyTokens } = await import("@/db/schema");
  const db = requireDb();

  const rows = await db.select().from(spotifyTokens).limit(1);
  const row = rows[0];
  if (!row?.refreshToken) throw new Error("Spotify not connected (missing refresh_token)");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing Spotify client env vars");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", row.refreshToken);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Spotify refresh failed: ${res.status} ${JSON.stringify(json)}`);
  return json.access_token as string;
}

export async function POST(req: Request) {
  try {
    const accessToken = await getAccessToken();

    const body = (await req.json().catch(() => ({}))) as any;
    const name = String(body?.name || "Marina — Demo").trim();
    const isPublic = !!body?.public;
    const description = String(body?.description || "Created by Marina (OpenClaw)").trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
    }

    // Who am I?
    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meJson = await meRes.json().catch(() => ({}));
    if (!meRes.ok) {
      return NextResponse.json(
        { ok: false, error: "spotify_api_error", step: "me", status: meRes.status, details: meJson },
        { status: 500 }
      );
    }

    const userId = meJson?.id as string | undefined;
    if (!userId) throw new Error("Spotify /me did not return id");

    // Create playlist
    // Prefer /v1/me/playlists (avoids edge cases with user ids / permissions).
    const createRes = await fetch("https://api.spotify.com/v1/me/playlists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, public: isPublic, description }),
    });

    const createJson = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "spotify_api_error",
          step: "create_playlist",
          status: createRes.status,
          details: createJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: { id: userId, displayName: meJson?.display_name ?? null },
      playlist: {
        id: createJson?.id ?? null,
        name: createJson?.name ?? name,
        url: createJson?.external_urls?.spotify ?? null,
        public: createJson?.public ?? isPublic,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "playlist_create_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
