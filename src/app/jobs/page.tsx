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
                    <div className="text-xs text-slate-300/80 font-mono break-words">
                      {j.payloadJson}
                    </div>
                    {a.length ? (
                      <div className="space-y-1">
                        {a.map((x) => (
                          <a
                            key={x.id}
                            href={x.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm text-blue-300 hover:text-blue-200"
                          >
                            {x.name}
                          </a>
                        ))}
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
