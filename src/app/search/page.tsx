export const dynamic = "force-dynamic";

import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { requireDb } from "@/db";
import { artifacts, jobs, tasks } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = String(searchParams?.q || "").trim();
  const ql = q.toLowerCase();

  const db = requireDb();

  // Pull a bounded set; do in-memory match (simple + avoids drizzle like/ilike differences).
  const taskRows = await db.select().from(tasks).orderBy(desc(tasks.updatedAt)).limit(200);
  const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(200);

  const matchedTasks = q
    ? taskRows.filter((t: any) => `${t.title} ${t.status} ${t.owner}`.toLowerCase().includes(ql))
    : [];

  const matchedJobs = q
    ? jobRows.filter((j: any) => `${j.type} ${j.status} ${j.payloadJson ?? ""}`.toLowerCase().includes(ql))
    : [];

  const jobIds = matchedJobs.map((j: any) => j.id);
  const artifactRows = jobIds.length
    ? await db.select().from(artifacts).where(inArray(artifacts.jobId, jobIds))
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Search</h1>
          <p className="mt-1 text-sm text-slate-300/80">
            Global search across Tasks + Jobs (latest 200 each).
          </p>
        </div>

        {!q ? (
          <Card>
            <CardContent className="py-6 text-sm text-slate-300/70">
              Type a query in the top search bar.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-slate-300/80">
              Results for <span className="font-mono text-slate-100">{q}</span>: {matchedTasks.length} tasks · {matchedJobs.length} jobs
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-100">Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matchedTasks.length === 0 ? (
                    <div className="text-sm text-slate-300/70">No tasks match.</div>
                  ) : (
                    matchedTasks.slice(0, 50).map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:bg-black/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 text-sm font-medium text-slate-100">
                            {t.title}
                          </div>
                          <Badge className="shrink-0">{t.status}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          owner: {t.owner} · updated {new Date((t.updatedAt ?? t.createdAt) as any).toLocaleString()}
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-100">Jobs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matchedJobs.length === 0 ? (
                    <div className="text-sm text-slate-300/70">No jobs match.</div>
                  ) : (
                    matchedJobs.slice(0, 50).map((j: any) => {
                      const a = artifactRows.filter((x: any) => x.jobId === j.id);
                      return (
                        <div
                          key={j.id}
                          className="rounded-lg border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium text-slate-100">{j.type}</div>
                            <Badge className="shrink-0">{j.status}</Badge>
                          </div>
                          <div className="mt-2 break-words text-xs font-mono text-slate-300/80">
                            {String(j.payloadJson || "").slice(0, 260)}
                            {String(j.payloadJson || "").length > 260 ? "…" : ""}
                          </div>
                          {a.length ? (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              {a.slice(0, 4).map((x: any) => {
                                const href = x.url?.trim() ? x.url : `/api/artifacts/${x.id}/download`;
                                const isExternal = href.startsWith("http://") || href.startsWith("https://");
                                return (
                                  <a
                                    key={x.id}
                                    href={href}
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noreferrer" : undefined}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 hover:bg-white/10"
                                  >
                                    {x.name}
                                  </a>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
