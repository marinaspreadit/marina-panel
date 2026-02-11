import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("TODO"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("QUEUED"),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const artifacts = pgTable("artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull().default("info"),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
