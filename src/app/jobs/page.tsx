export const dynamic = "force-dynamic";

import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { requireDb } from "@/db";
import { artifacts, jobs, tasks } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export default async function JobsPage() {
  const db = requireDb();
  const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(100);
  const taskIds = Array.from(new Set(jobRows.map((j) => j.taskId)));
  const taskRows = taskIds.length
    ? await db.select().from(tasks).where(inArray(tasks.id, taskIds))
    : [];
  const taskById = new Map(taskRows.map((t) => [t.id, t]));

  const jobIds = jobRows.map((j) => j.id);
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
          </p>
        </div>

        <div className="space-y-3">
          {jobRows.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-slate-300/70">
                No jobs yet.
              </CardContent>
            </Card>
          ) : (
            jobRows.map((j) => {
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
                    <div className="break-words rounded-md border border-white/10 bg-black/10 p-2 text-xs font-mono text-slate-300/80">
                      {j.payloadJson}
                    </div>
                    {a.length ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {a.map((x) => {
                          const href = x.url?.trim()
                            ? x.url
                            : `/api/artifacts/${x.id}/download`;
                          const isExternal = href.startsWith("http://") || href.startsWith("https://");
                          return (
                            <a
                              key={x.id}
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noreferrer" : undefined}
                              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm text-slate-100 hover:bg-white/10 sm:w-auto"
                            >
                              Open: {x.name}
                            </a>
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
