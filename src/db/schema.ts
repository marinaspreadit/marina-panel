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
