import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// NOTE: Keep enums as text for speed; we enforce via UI.
// Task status: TODO | WAITING | DONE
// Job status: QUEUED | RUNNING | SUCCESS | ERROR

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("TODO"),
  priority: integer("priority").notNull().default(2), // 1=high,2=normal,3=low
  owner: text("owner").notNull().default("Marina"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("QUEUED"),
  payloadJson: text("payload_json").notNull().default("{}"),
  log: text("log").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const artifacts = pgTable("artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull(),
  name: text("name").notNull(),

  // storage='url' → use url
  // storage='inline' → contentBase64 + mime + filename
  storage: text("storage").notNull().default("url"),
  url: text("url").notNull().default(""),
  filename: text("filename").notNull().default(""),
  mime: text("mime").notNull().default("application/octet-stream"),
  contentBase64: text("content_base64").notNull().default(""),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull().default("info"),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  author: text("author").notNull().default("Joel"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Spotify OAuth tokens (single-user for now)
export const spotifyTokens = pgTable("spotify_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Store refresh_token to get new access tokens.
  refreshToken: text("refresh_token").notNull().default(""),
  scope: text("scope").notNull().default(""),
  tokenType: text("token_type").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tracks already processed from Liked Songs → playlists
export const spotifyProcessedTracks = pgTable("spotify_processed_tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: text("track_id").notNull(),
  trackUri: text("track_uri").notNull().default(""),
  trackName: text("track_name").notNull().default(""),
  artists: text("artists").notNull().default(""),
  likedAddedAt: timestamp("liked_added_at"),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  decision: text("decision").notNull().default(""),
  confidence: integer("confidence").notNull().default(0),
  targetPlaylistName: text("target_playlist_name").notNull().default(""),
  targetPlaylistId: text("target_playlist_id").notNull().default(""),
  actionStatus: text("action_status").notNull().default("queued"),
  error: text("error").notNull().default(""),
});
