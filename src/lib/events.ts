import { desc } from "drizzle-orm";

import { requireDb } from "@/db";
import { events } from "@/db/schema";

export type EventKind = "info" | "success" | "warning" | "error";

export async function logEvent(params: {
  kind?: EventKind;
  title: string;
  detail?: string;
}) {
  const db = requireDb();
  await db.insert(events).values({
    kind: params.kind ?? "info",
    title: params.title,
    detail: params.detail ?? "",
  });
}

export async function getRecentEvents(limit = 20) {
  const db = requireDb();
  return db.select().from(events).orderBy(desc(events.createdAt)).limit(limit);
}
