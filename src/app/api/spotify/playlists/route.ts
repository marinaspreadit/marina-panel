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

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    // Get current user playlists
    const out: any[] = [];
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";

    for (let i = 0; i < 20 && url; i++) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "spotify_api_error", status: res.status, details: json },
          { status: 500 }
        );
      }
      out.push(...(json.items || []));
      url = json.next;
    }

    // Keep response small: return name + id + tracks count + public/collaborative
    const slim = out.map((p) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks?.total ?? null,
      public: p.public,
      collaborative: p.collaborative,
      owner: p.owner?.display_name || p.owner?.id || null,
    }));

    return NextResponse.json({ ok: true, count: slim.length, playlists: slim });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "playlists_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
