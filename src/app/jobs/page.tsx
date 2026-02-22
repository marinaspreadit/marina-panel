export const dynamic = "force-dynamic";

import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

import { requireDb } from "@/db";
import { artifacts, jobs, tasks } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const db = requireDb();
  const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(100);
  const q = String(searchParams?.q || "").trim().toLowerCase();

  const taskIds = Array.from(new Set(jobRows.map((j) => j.taskId)));
  const taskRows = taskIds.length
    ? await db.select().from(tasks).where(inArray(tasks.id, taskIds))
    : [];
  const taskById = new Map(taskRows.map((t) => [t.id, t]));

  const filteredJobRows = q
    ? jobRows.filter((j) => {
        const t = taskById.get(j.taskId);
        const hay = `${j.type} ${j.status} ${j.payloadJson ?? ""} ${t?.title ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
    : jobRows;

  const jobIds = filteredJobRows.map((j) => j.id);
  const artifactRows = jobIds.length
    ? await db.select().from(artifacts).where(inArray(artifacts.jobId, jobIds))
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Jobs</h1>
          <p className="mt-1 text-sm text-slate-300/80">
            Runs + artifacts (latest 100).
            {q ? (
              <span className="ml-2 text-slate-400">
                (filtered by “{q}” · {filteredJobRows.length}/{jobRows.length})
              </span>
            ) : null}
          </p>
        </div>

        <form method="GET" className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              name="q"
              defaultValue={searchParams?.q || ""}
              placeholder="Search jobs (type/status/payload/task)…"
              className="h-10 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 md:w-auto"
            >
              Search
            </button>
            <a
              href="/jobs"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm text-slate-100 hover:bg-white/10 md:w-auto"
            >
              Clear
            </a>
          </div>
        </form>

        <div className="space-y-3">
          {filteredJobRows.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-slate-300/70">
                No jobs yet.
              </CardContent>
            </Card>
          ) : (
            filteredJobRows.map((j) => {
              const t = taskById.get(j.taskId);
              const a = artifactRows.filter((x) => x.jobId === j.id);
              return (
                <Card key={j.id}>
                  <CardHeader className="space-y-1">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{j.type}</span>
                        <Badge>{j.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(j.createdAt as any).toLocaleString()}
                      </div>
                    </CardTitle>
                    {t ? (
                      <div className="text-sm text-slate-300/80">
                        Task: <Link className="text-blue-300 hover:text-blue-200" href={`/tasks/${t.id}`}>{t.title}</Link>
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2 rounded-md border border-white/10 bg-black/10 p-2">
                      <div className="min-w-0 flex-1 break-words text-xs font-mono text-slate-300/80">
                        {j.payloadJson}
                      </div>
                      <CopyButton text={j.payloadJson as any} label="Copy payload" />
                    </div>
                    {a.length ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {a.map((x) => {
                          const href = x.url?.trim()
                            ? x.url
                            : `/api/artifacts/${x.id}/download`;
                          const isExternal = href.startsWith("http://") || href.startsWith("https://");
                          return (
                            <div key={x.id} className="flex w-full items-center gap-2 sm:w-auto">
                              <a
                                href={href}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noreferrer" : undefined}
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm text-slate-100 hover:bg-white/10"
                              >
                                Open: {x.name}
                              </a>
                              <CopyButton text={href} label="Copy" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-300/70">No artifacts.</div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
