import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";

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

type LikedItem = {
  added_at: string;
  track: {
    id: string;
    uri: string;
    name: string;
    artists: { name: string }[];
  };
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
} & Record<string, any>;

type Decision = {
  playlistName: string;
  confidence: number; // 0-100
  rule: string;
};

function decide(a: Audio | null): Decision {
  if (!a) return { playlistName: "Unsorted / Review", confidence: 10, rule: "no_audio_features" };

  // Rules from artifacts/spotify_liked_songs_to_playlists_plan_v1.md (MVP)
  // NOTE: We purposely keep it simple + interpretable.
  const perreito =
    a.energy >= 0.65 && a.danceability >= 0.65 && a.tempo >= 90 && a.speechiness >= 0.05;
  if (perreito) {
    return { playlistName: "Perreíto Pegaito", confidence: 85, rule: "perreito_v1" };
  }

  const gold =
    a.energy >= 0.45 && a.energy <= 0.75 && a.danceability >= 0.55 && a.valence <= 0.65;
  if (gold) {
    return { playlistName: "G(old)", confidence: 70, rule: "gold_v1" };
  }

  const valth = a.energy <= 0.55 && (a.acousticness >= 0.35 || a.valence <= 0.55);
  if (valth) {
    return { playlistName: "Valth", confidence: 70, rule: "valth_v1" };
  }

  return { playlistName: "Unsorted / Review", confidence: 30, rule: "fallback_unsorted" };
}

async function fetchAllPlaylists(accessToken: string) {
  const out: any[] = [];
  let url = "https://api.spotify.com/v1/me/playlists?limit=50";
  for (let i = 0; i < 20 && url; i++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Spotify playlists failed: ${res.status} ${JSON.stringify(json)}`);
    out.push(...(json.items || []));
    url = json.next;
  }
  return out as any[];
}

function findPlaylistIdByName(playlists: any[], name: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(name);
  const p = playlists.find((x) => norm(String(x?.name || "")) === target);
  return (p?.id as string) || null;
}

async function addTracksToPlaylist(accessToken: string, playlistId: string, uris: string[]) {
  if (!uris.length) return { ok: true, added: 0 };

  let added = 0;
  for (const group of chunk(uris, 50)) {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: group }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Spotify add tracks failed: ${res.status} ${JSON.stringify(json)}`);
    added += group.length;
  }

  return { ok: true, added };
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

    // Optional auth gate for cron/public deployments.
    // If SPOTIFY_CRON_SECRET is set, callers must provide it via:
    // - Header: x-cron-secret: <secret>
    // - OR query param: ?secret=<secret>
    const expected = process.env.SPOTIFY_CRON_SECRET;
    if (expected) {
      const got = req.headers.get("x-cron-secret") || url.searchParams.get("secret") || "";
      if (got !== expected) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
    const limit = Math.min(Number(url.searchParams.get("limit") || 20) || 20, 50);

    const accessToken = await getAccessToken();

    // 1) pull recent liked songs
    const likedRes = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const likedJson = await likedRes.json().catch(() => ({}));
    if (!likedRes.ok) {
      return NextResponse.json(
        { ok: false, error: "spotify_api_error", status: likedRes.status, details: likedJson },
        { status: 500 }
      );
    }

    const items: LikedItem[] = Array.isArray(likedJson.items) ? likedJson.items : [];
    const liked = items
      .map((it) => ({
        trackId: it?.track?.id,
        trackUri: it?.track?.uri,
        trackName: it?.track?.name,
        artists: (it?.track?.artists || []).map((a) => a?.name).filter(Boolean),
        addedAt: it?.added_at,
      }))
      .filter((x) => !!x.trackId && !!x.trackUri);

    const { requireDb } = await import("@/db");
    const { ensureMigrations } = await import("@/db/migrate");
    const { spotifyProcessedTracks } = await import("@/db/schema");
    const db = requireDb();
    await ensureMigrations(db);

    // 2) remove already processed
    const ids = liked.map((t) => t.trackId as string);
    const existing = ids.length
      ? await db
          .select({ trackId: spotifyProcessedTracks.trackId })
          .from(spotifyProcessedTracks)
          .where(inArray(spotifyProcessedTracks.trackId, ids))
      : [];

    const seen = new Set(existing.map((r) => r.trackId));
    const todo = liked.filter((t) => !seen.has(t.trackId as string));

    // 3) fetch audio features
    const featuresById: Record<string, Audio> = {};
    for (const group of chunk(todo.map((t) => t.trackId as string), 100)) {
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

    // 4) decide playlists
    const decisions = todo.map((t) => {
      const audio = featuresById[t.trackId as string] ?? null;
      const d = decide(audio);
      return { ...t, audio, decision: d };
    });

    // 5) map playlist names → ids
    const playlists = await fetchAllPlaylists(accessToken);
    const uniquePlaylistNames = [...new Set(decisions.map((d) => d.decision.playlistName))];
    const playlistIdByName: Record<string, string> = {};
    const missing: string[] = [];

    for (const name of uniquePlaylistNames) {
      const pid = findPlaylistIdByName(playlists, name);
      if (!pid) missing.push(name);
      else playlistIdByName[name] = pid;
    }

    // 6) add tracks per playlist (unless dryRun)
    const byPlaylist: Record<string, { playlistId: string; uris: string[] }> = {};
    for (const d of decisions) {
      const playlistId = playlistIdByName[d.decision.playlistName];
      if (!playlistId) continue;
      if (!byPlaylist[d.decision.playlistName]) {
        byPlaylist[d.decision.playlistName] = { playlistId, uris: [] };
      }
      byPlaylist[d.decision.playlistName].uris.push(d.trackUri as string);
    }

    const adds: any[] = [];
    if (!dryRun) {
      for (const [playlistName, payload] of Object.entries(byPlaylist)) {
        const r = await addTracksToPlaylist(accessToken, payload.playlistId, payload.uris);
        adds.push({ playlistName, playlistId: payload.playlistId, ...r });
      }
    }

    // 7) persist processed rows
    if (decisions.length) {
      const nowStatus = dryRun ? "dryrun" : "added";
      await db.insert(spotifyProcessedTracks).values(
        decisions.map((d) => ({
          trackId: d.trackId as string,
          trackUri: d.trackUri as string,
          trackName: d.trackName as string,
          artists: d.artists.join(", "),
          likedAddedAt: d.addedAt ? new Date(d.addedAt) : null,
          decision: d.decision.rule,
          confidence: d.decision.confidence,
          targetPlaylistName: d.decision.playlistName,
          targetPlaylistId: playlistIdByName[d.decision.playlistName] || "",
          actionStatus: playlistIdByName[d.decision.playlistName] ? nowStatus : "skipped_missing_playlist",
          error: playlistIdByName[d.decision.playlistName] ? "" : "missing_playlist",
        }))
      );
    }

    const summary: Record<string, number> = {};
    for (const d of decisions) {
      summary[d.decision.playlistName] = (summary[d.decision.playlistName] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      requested: limit,
      likedCount: liked.length,
      alreadyProcessed: liked.length - todo.length,
      toProcess: todo.length,
      missingPlaylists: missing,
      summary,
      adds: dryRun ? [] : adds,
      note:
        missing.length > 0
          ? "Create the missing playlists (exact name match) or adjust rules/names."
          : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "liked_process_failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
