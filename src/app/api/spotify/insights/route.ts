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

type SlimTrack = {
  id: string | null;
  name: string;
  artists: string[];
  popularity: number | null;
};

type Audio = {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  loudness: number;
} & Record<string, any>;

async function fetchPlaylistTracks(accessToken: string, playlistId: string) {
  const items: any[] = [];
  let url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(
    playlistId
  )}/tracks?limit=100&market=from_token`;

  for (let i = 0; i < 30 && url; i++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Spotify playlist tracks failed: ${res.status} ${JSON.stringify(json)}`);
    items.push(...(json.items || []));
    url = json.next;
  }

  const tracks: SlimTrack[] = items
    .map((it) => it?.track)
    .filter(Boolean)
    .map((t) => ({
      id: t.id as string | null,
      name: t.name as string,
      artists: (t.artists || []).map((a: any) => a?.name).filter(Boolean),
      popularity: t.popularity ?? null,
    }));

  const ids = tracks.map((t) => t.id).filter((x): x is string => !!x);
  const featuresById: Record<string, Audio> = {};

  for (const group of chunk(ids, 100)) {
    const res = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${encodeURIComponent(group.join(","))}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) continue;
    for (const f of json.audio_features || []) {
      if (f?.id) featuresById[f.id] = f;
    }
  }

  const enriched = tracks.map((t) => ({
    ...t,
    audio: t.id ? featuresById[t.id] ?? null : null,
  }));

  return enriched;
}

function topN<T extends string>(arr: T[], n: number) {
  const counts = new Map<T, number>();
  for (const a of arr) counts.set(a, (counts.get(a) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playlistId = url.searchParams.get("playlistId");
    const top = Math.min(Number(url.searchParams.get("top") || 15) || 15, 50);

    if (!playlistId) {
      return NextResponse.json(
        { ok: false, error: "missing_playlistId", hint: "Use ?playlistId=<id>" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const tracks = await fetchPlaylistTracks(accessToken, playlistId);

    const artists = tracks.flatMap((t) => t.artists);
    const topArtists = topN(artists, top);

    const audios = tracks.map((t: any) => t.audio).filter(Boolean) as Audio[];

    const summary = {
      danceability: avg(audios.map((a) => a.danceability).filter((x) => typeof x === "number")),
      energy: avg(audios.map((a) => a.energy).filter((x) => typeof x === "number")),
      valence: avg(audios.map((a) => a.valence).filter((x) => typeof x === "number")),
      tempo: avg(audios.map((a) => a.tempo).filter((x) => typeof x === "number")),
      acousticness: avg(audios.map((a) => a.acousticness).filter((x) => typeof x === "number")),
      instrumentalness: avg(
        audios.map((a) => a.instrumentalness).filter((x) => typeof x === "number")
      ),
      speechiness: avg(audios.map((a) => a.speechiness).filter((x) => typeof x === "number")),
      liveness: avg(audios.map((a) => a.liveness).filter((x) => typeof x === "number")),
      loudness: avg(audios.map((a) => a.loudness).filter((x) => typeof x === "number")),
    };

    return NextResponse.json({
      ok: true,
      playlistId,
      count: tracks.length,
      topArtists,
      audioSummary: summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "insights_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
