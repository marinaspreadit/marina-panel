import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

export const sql = databaseUrl ? neon(databaseUrl) : null;
export const db = sql ? drizzle(sql) : null;

export function requireDb() {
  if (!db) throw new Error("Missing DATABASE_URL");
  return db;
}
