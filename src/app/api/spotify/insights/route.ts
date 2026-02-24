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

type EnrichedTrack = SlimTrack & { audio: Audio | null };

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

  // Spotify caps audio-features to 100 ids per request.
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

  const enriched: EnrichedTrack[] = tracks.map((t) => ({
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// --- Simple K-means for small playlists (no deps) ---

type Vec = number[];

function distSq(a: Vec, b: Vec) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

function meanVec(vectors: Vec[], dim: number): Vec {
  if (!vectors.length) return new Array(dim).fill(0);
  const out = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) out[i] += v[i];
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

function zscore(vectors: Vec[]) {
  const n = vectors.length;
  const dim = vectors[0]?.length || 0;
  const mean = new Array(dim).fill(0);
  const stdev = new Array(dim).fill(0);

  for (const v of vectors) for (let i = 0; i < dim; i++) mean[i] += v[i];
  for (let i = 0; i < dim; i++) mean[i] /= Math.max(1, n);

  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      const d = v[i] - mean[i];
      stdev[i] += d * d;
    }
  }
  for (let i = 0; i < dim; i++) {
    stdev[i] = Math.sqrt(stdev[i] / Math.max(1, n));
    if (!Number.isFinite(stdev[i]) || stdev[i] === 0) stdev[i] = 1;
  }

  const scaled = vectors.map((v) => v.map((x, i) => (x - mean[i]) / stdev[i]));
  return { scaled, mean, stdev };
}

function kmeans(vectors: Vec[], k: number, maxIter = 25) {
  const n = vectors.length;
  const dim = vectors[0]?.length || 0;
  if (!n || !dim) return { centroids: [] as Vec[], labels: [] as number[] };

  // init: pick first k (deterministic) — good enough for our use.
  const centroids: Vec[] = [];
  for (let i = 0; i < k; i++) centroids.push([...vectors[i % n]]);

  const labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = 0;

    // assign
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distSq(vectors[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed++;
      }
    }

    // recompute
    const groups: Vec[][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) groups[labels[i]].push(vectors[i]);
    for (let c = 0; c < k; c++) {
      if (groups[c].length) centroids[c] = meanVec(groups[c], dim);
    }

    if (changed === 0) break;
  }

  return { centroids, labels };
}

function audioToVec(a: Audio) {
  // Keep dims small + interpretable. Tempo and loudness are scaled.
  return [
    a.danceability,
    a.energy,
    a.valence,
    a.acousticness,
    a.instrumentalness,
    a.speechiness,
    a.liveness,
    // normalize tempo to ~[0..1] for typical ranges 60..200
    clamp((a.tempo - 60) / 140, 0, 1),
    // normalize loudness roughly -60..0
    clamp((a.loudness + 60) / 60, 0, 1),
  ];
}

function clusterSummary(tracks: EnrichedTrack[]) {
  const audios = tracks.map((t) => t.audio).filter(Boolean) as Audio[];
  return {
    count: tracks.length,
    danceability: avg(audios.map((a) => a.danceability)),
    energy: avg(audios.map((a) => a.energy)),
    valence: avg(audios.map((a) => a.valence)),
    tempo: avg(audios.map((a) => a.tempo)),
    acousticness: avg(audios.map((a) => a.acousticness)),
    instrumentalness: avg(audios.map((a) => a.instrumentalness)),
    speechiness: avg(audios.map((a) => a.speechiness)),
    liveness: avg(audios.map((a) => a.liveness)),
    loudness: avg(audios.map((a) => a.loudness)),
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playlistId = url.searchParams.get("playlistId");

    const top = Math.min(Number(url.searchParams.get("top") || 15) || 15, 50);
    const kRaw = Number(url.searchParams.get("k") || 5) || 5;

    if (!playlistId) {
      return NextResponse.json(
        { ok: false, error: "missing_playlistId", hint: "Use ?playlistId=<id>" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const tracks = await fetchPlaylistTracks(accessToken, playlistId);

    // global stats
    const artists = tracks.flatMap((t) => t.artists);
    const topArtists = topN(artists, top);

    const audiosAll = tracks.map((t) => t.audio).filter(Boolean) as Audio[];
    const audioSummary = {
      danceability: avg(audiosAll.map((a) => a.danceability)),
      energy: avg(audiosAll.map((a) => a.energy)),
      valence: avg(audiosAll.map((a) => a.valence)),
      tempo: avg(audiosAll.map((a) => a.tempo)),
      acousticness: avg(audiosAll.map((a) => a.acousticness)),
      instrumentalness: avg(audiosAll.map((a) => a.instrumentalness)),
      speechiness: avg(audiosAll.map((a) => a.speechiness)),
      liveness: avg(audiosAll.map((a) => a.liveness)),
      loudness: avg(audiosAll.map((a) => a.loudness)),
    };

    // clustering
    const withAudio = tracks.filter((t) => !!t.audio);
    const vectors = withAudio.map((t) => audioToVec(t.audio!));

    const k = clamp(kRaw, 2, Math.min(10, Math.max(2, Math.floor(withAudio.length / 5) || 2)));

    let clusters: any[] = [];
    if (withAudio.length >= 10) {
      const { scaled } = zscore(vectors);
      const km = kmeans(scaled, k);

      const byCluster: EnrichedTrack[][] = Array.from({ length: k }, () => []);
      for (let i = 0; i < withAudio.length; i++) byCluster[km.labels[i]].push(withAudio[i]);

      clusters = byCluster
        .map((group, idx) => {
          const sample = [...group]
            .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
            .slice(0, 8)
            .map((t) => ({ id: t.id, name: t.name, artists: t.artists, popularity: t.popularity }));
          return {
            id: idx,
            summary: clusterSummary(group),
            sample,
          };
        })
        .sort((a, b) => (b.summary.count || 0) - (a.summary.count || 0));
    }

    return NextResponse.json({
      ok: true,
      playlistId,
      count: tracks.length,
      withAudioCount: withAudio.length,
      topArtists,
      audioSummary,
      clustering: {
        ok: clusters.length > 0,
        k: clusters.length > 0 ? k : 0,
        clusters,
        note:
          clusters.length > 0
            ? undefined
            : "Not enough tracks with audio features to compute clusters (need ~10+)",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "insights_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
