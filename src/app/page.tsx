export const dynamic = "force-dynamic";

import Link from "next/link";

import { AppShell } from "@/components/shell/app-shell";
import { ActivityStream } from "@/components/activity-stream";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { requireDb } from "@/db";
import { artifacts, events, jobs, tasks } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

export default async function Home() {
  const db = requireDb();

  const [{ value: totalTasks } = { value: 0 }] = await db
    .select({ value: count() })
    .from(tasks);

  const [{ value: activeJobs } = { value: 0 }] = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.status, "RUNNING"));

  const [{ value: totalArtifacts } = { value: 0 }] = await db
    .select({ value: count() })
    .from(artifacts);

  const [{ value: totalEvents } = { value: 0 }] = await db
    .select({ value: count() })
    .from(events);

  const nowTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "IN_PROGRESS"))
    .orderBy(desc(tasks.updatedAt))
    .limit(8);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              What’s happening now + downloads.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/tasks" className="sm:inline-block">
              <Button className="h-11 w-full sm:w-auto">+ New task</Button>
            </Link>
            <Link href="/jobs" className="sm:inline-block">
              <Button variant="secondary" className="h-11 w-full sm:w-auto">Jobs</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Tasks</CardTitle>
              <CardDescription>Total</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">
                {totalTasks}
              </span>
              <Badge variant="blue">Live</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Active Jobs</CardTitle>
              <CardDescription>RUNNING</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">
                {activeJobs}
              </span>
              <span className="text-sm text-slate-300/70">Now</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Events</CardTitle>
              <CardDescription>Total</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">
                {totalEvents}
              </span>
              <span className="text-sm text-slate-300/70">Auto</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Artifacts</CardTitle>
              <CardDescription>Downloads + links</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">
                {totalArtifacts}
              </span>
              <span className="text-sm text-slate-300/70">Files</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-100">Recent Activity</CardTitle>
              <CardDescription>Events stream</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityStream />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-100">Now (In Progress)</CardTitle>
              <CardDescription>What Marina is working on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {nowTasks.length === 0 ? (
                <div className="text-sm text-slate-300/70">
                  No tasks in progress.
                </div>
              ) : (
                nowTasks.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 hover:bg-black/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 truncate text-sm font-medium text-slate-100">
                        {t.title}
                      </div>
                      <div className="shrink-0 text-xs text-slate-400">
                        {new Date(t.updatedAt as any).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-300/70">
                      owner: {t.owner} · priority: {t.priority}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
