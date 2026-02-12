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
  const owner = String(formData.get("owner") || "Marina").trim() || "Marina";
  const priority = Number(formData.get("priority") || 2);
  if (!title) return;

  const db = requireDb();
  await db.insert(tasks).values({
    title,
    status: "READY",
    owner,
    priority: Number.isFinite(priority) ? priority : 2,
    updatedAt: new Date(),
  } as any);

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
    { key: "READY", title: "Ready" },
    { key: "IN_PROGRESS", title: "In Progress" },
    { key: "BLOCKED", title: "Blocked" },
    { key: "DONE", title: "Done" },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Ready / In Progress / Blocked / Done.
            </p>
          </div>

          <form
            action={createTask}
            className="w-full max-w-xl rounded-lg border border-white/10 bg-black/20 p-3"
          >
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                name="title"
                placeholder="+ New task (title)…"
                className="h-10 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
              <input
                name="owner"
                placeholder="owner"
                defaultValue="Marina"
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 md:w-40"
              />
              <select
                name="priority"
                defaultValue={2}
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm text-slate-100 outline-none focus:border-blue-500 md:w-32"
              >
                <option value={1}>High</option>
                <option value={2}>Normal</option>
                <option value={3}>Low</option>
              </select>
              <Button type="submit" className="h-10">Create</Button>
            </div>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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
