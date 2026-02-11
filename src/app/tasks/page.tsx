export const dynamic = "force-dynamic";

import { requireDb } from "@/db";
import { tasks } from "@/db/schema";
import { desc } from "drizzle-orm";

import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function createTask(formData: FormData) {
  "use server";
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const db = requireDb();
  await db.insert(tasks).values({ title, status: "TODO" });

  const { logEvent } = await import("@/lib/events");
  await logEvent({
    kind: "success",
    title: "Task created",
    detail: title,
  });
}

export default async function TasksPage() {
  const db = requireDb();
  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

  const cols = [
    { key: "TODO", title: "TODO" },
    { key: "WAITING", title: "WAITING" },
    { key: "DONE", title: "DONE" },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              DB-backed kanban.
            </p>
          </div>

          <form action={createTask} className="flex items-center gap-2">
            <input
              name="title"
              placeholder="New task…"
              className="h-9 w-64 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
            <Button type="submit">Add</Button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cols.map((col) => {
            const items = rows.filter((t) => t.status === col.key);
            return (
              <Card key={col.key} className="min-h-[360px]">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    {col.title} <span className="text-slate-400">({items.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-sm text-slate-300/70">No tasks.</div>
                  ) : (
                    items.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
                      >
                        <div className="min-w-0 truncate">{t.title}</div>
                        <a
                          href={`/tasks/${t.id}`}
                          className="shrink-0 text-xs text-blue-300 hover:text-blue-200"
                        >
                          Open
                        </a>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
