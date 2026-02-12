export const dynamic = "force-dynamic";

import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { requireDb } from "@/db";
import { jobs, tasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { logEvent } from "@/lib/events";

const SCRAPER_TASK_TITLE = "Scraper (runs)";

async function getOrCreateScraperTaskId() {
  const db = requireDb();
  const existing = await db
    .select()
    .from(tasks)
    .where(eq(tasks.title, SCRAPER_TASK_TITLE))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const inserted = await db
    .insert(tasks)
    .values({
      title: SCRAPER_TASK_TITLE,
      status: "IN_PROGRESS",
      owner: "Marina",
      priority: 2,
      notes: "Auto-created task to group Scraper runs.",
      updatedAt: new Date(),
    } as any)
    .returning({ id: tasks.id });

  return inserted[0]!.id;
}

async function runScraper(formData: FormData) {
  "use server";
  const query = String(formData.get("query") || "peluquería").trim();
  const city = String(formData.get("city") || "Barcelona").trim();
  const vertical = String(formData.get("vertical") || "Peluquería").trim();
  const limit = Number(formData.get("limit") || 50);

  const taskId = await getOrCreateScraperTaskId();
  const db = requireDb();

  const payload = {
    query,
    city,
    vertical,
    limit: Number.isFinite(limit) ? limit : 50,
    createdFrom: "panel",
  };

  await db.insert(jobs).values({
    taskId,
    type: "scraper_run",
    status: "QUEUED",
    payloadJson: JSON.stringify(payload),
    log: "",
  } as any);

  await logEvent({
    kind: "info",
    title: "Scraper job queued",
    detail: `${query} — ${city} (${payload.limit})`,
  });
}

export default async function ScraperPage() {
  const db = requireDb();
  const taskId = await getOrCreateScraperTaskId();

  const recent = await db
    .select()
    .from(jobs)
    .where(eq(jobs.taskId, taskId))
    .orderBy(desc(jobs.createdAt))
    .limit(25);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Scraper
          </h1>
          <p className="mt-1 text-sm text-slate-300/80">
            Run a scrape from the panel. This creates a Job and the runner will execute it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Run</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={runScraper} className="grid gap-3 md:grid-cols-4">
              <input
                name="query"
                defaultValue="peluquería"
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
              <input
                name="city"
                defaultValue="Barcelona"
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
              <input
                name="vertical"
                defaultValue="Peluquería"
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
              <input
                name="limit"
                type="number"
                defaultValue={50}
                min={1}
                max={200}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit">RUN</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Recent runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <div className="text-sm text-slate-300/70">No runs yet.</div>
            ) : (
              recent.map((j: any) => (
                <div
                  key={j.id}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-100">
                      {j.status} · {j.type}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(j.createdAt as any).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 break-words text-xs font-mono text-slate-300/80">
                    {j.payloadJson}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
