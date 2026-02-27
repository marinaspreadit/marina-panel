import { sql } from "drizzle-orm";

// NOTE: In Vercel serverless, running full drizzle migrations from filesystem
// can be brittle (bundling/tracing/runtime). For critical paths, we keep a
// lightweight, idempotent schema ensure.

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensureSpotifyProcessedTracksTable(db: any) {
  if (ensured) return;
  if (ensuring) return ensuring;

  ensuring = (async () => {
    // Needed for gen_random_uuid() default.
    await db.execute(sql.raw('create extension if not exists "pgcrypto";'));

    await db.execute(
      sql.raw(`
        create table if not exists "spotify_processed_tracks" (
          "id" uuid primary key default gen_random_uuid() not null,
          "track_id" text not null,
          "track_uri" text default '' not null,
          "track_name" text default '' not null,
          "artists" text default '' not null,
          "liked_added_at" timestamp,
          "processed_at" timestamp default now() not null,
          "decision" text default '' not null,
          "confidence" integer default 0 not null,
          "target_playlist_name" text default '' not null,
          "target_playlist_id" text default '' not null,
          "action_status" text default 'queued' not null,
          "error" text default '' not null
        );
      `)
    );

    await db.execute(
      sql.raw(
        `create unique index if not exists "spotify_processed_tracks_track_id_unique" on "spotify_processed_tracks" ("track_id");`
      )
    );

    ensured = true;
  })().finally(() => {
    ensuring = null;
  });

  return ensuring;
}
