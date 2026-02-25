CREATE TABLE "spotify_processed_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" text NOT NULL,
	"track_uri" text DEFAULT '' NOT NULL,
	"track_name" text DEFAULT '' NOT NULL,
	"artists" text DEFAULT '' NOT NULL,
	"liked_added_at" timestamp,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"decision" text DEFAULT '' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"target_playlist_name" text DEFAULT '' NOT NULL,
	"target_playlist_id" text DEFAULT '' NOT NULL,
	"action_status" text DEFAULT 'queued' NOT NULL,
	"error" text DEFAULT '' NOT NULL
);

CREATE UNIQUE INDEX "spotify_processed_tracks_track_id_unique" ON "spotify_processed_tracks" ("track_id");
