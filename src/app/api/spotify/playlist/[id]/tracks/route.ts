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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // Playlist tracks (paginated)
    const items: any[] = [];
    let url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(
      id
    )}/tracks?limit=100&market=from_token`;

    for (let i = 0; i < 30 && url; i++) {
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
      items.push(...(json.items || []));
      url = json.next;
    }

    const tracks = items
      .map((it) => it?.track)
      .filter(Boolean)
      .map((t) => ({
        id: t.id as string | null,
        name: t.name as string,
        artists: (t.artists || []).map((a: any) => a?.name).filter(Boolean),
        album: t.album?.name ?? null,
        popularity: t.popularity ?? null,
        explicit: !!t.explicit,
        uri: t.uri ?? null,
      }));

    // Optional audio features (only when we have ids)
    const ids = tracks.map((t) => t.id).filter((x): x is string => !!x);
    const featuresById: Record<string, any> = {};

    for (const group of chunk(ids, 100)) {
      const res = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${encodeURIComponent(group.join(","))}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json.audio_features)) {
        for (const f of json.audio_features) {
          if (f?.id) featuresById[f.id] = f;
        }
      }
    }

    const enriched = tracks.map((t) => ({
      ...t,
      audio: t.id ? featuresById[t.id] ?? null : null,
    }));

    return NextResponse.json({ ok: true, playlistId: id, count: enriched.length, tracks: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "playlist_tracks_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
