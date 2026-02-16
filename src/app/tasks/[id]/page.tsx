export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Link from "next/link";

import { requireDb } from "@/db";
import { artifacts, jobs, taskComments, tasks } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logEvent } from "@/lib/events";

async function addComment(taskId: string, formData: FormData) {
  "use server";
  const body = String(formData.get("body") || "").trim();
  const author = String(formData.get("author") || "Joel").trim() || "Joel";
  if (!body) return;

  const db = requireDb();
  await db.insert(taskComments).values({ taskId, author, body });
  await logEvent({ kind: "info", title: "Task comment", detail: body });
}

async function updateTask(taskId: string, formData: FormData) {
  "use server";
  const status = String(formData.get("status") || "").trim();
  const owner = String(formData.get("owner") || "").trim();
  const notes = String(formData.get("notes") || "");
  const priority = Number(formData.get("priority") || 2);

  const db = requireDb();
  await db
    .update(tasks)
    .set({
      status: status || "READY",
      owner: owner || "Marina",
      notes: notes || "",
      priority: Number.isFinite(priority) ? priority : 2,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  await logEvent({ kind: "success", title: "Task updated", detail: taskId });
}

async function createJob(taskId: string, formData: FormData) {
  "use server";
  const type = String(formData.get("type") || "manual").trim() || "manual";
  const payloadJson = String(formData.get("payloadJson") || "{}").trim() || "{}";

  const db = requireDb();
  await db.insert(jobs).values({ taskId, type, status: "QUEUED", payloadJson, log: "" });
  await logEvent({ kind: "info", title: "Job created", detail: `${type} → ${taskId}` });
}

async function addArtifact(jobId: string, formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "artifact").trim() || "artifact";

  const file = formData.get("file") as File | null;
  const url = String(formData.get("url") || "").trim();

  const db = requireDb();

  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const contentBase64 = buf.toString("base64");
    await db.insert(artifacts).values({
      jobId,
      name,
      storage: "inline",
      url: "",
      filename: file.name || `${name}.bin`,
      mime: file.type || "application/octet-stream",
      contentBase64,
    } as any);
    await logEvent({ kind: "success", title: "Artifact uploaded", detail: file.name || name });
    return;
  }

  if (!url) return;
  await db.insert(artifacts).values({ jobId, name, storage: "url", url } as any);
  await logEvent({ kind: "success", title: "Artifact linked", detail: name });
}

async function deleteArtifact(artifactId: string) {
  "use server";
  const db = requireDb();
  await db.delete(artifacts).where(eq(artifacts.id, artifactId));
  await logEvent({ kind: "info", title: "Artifact deleted", detail: artifactId });
}

async function deleteJob(jobId: string) {
  "use server";
  const db = requireDb();
  // delete artifacts first (FK not enforced here, but keeps UI clean)
  await db.delete(artifacts).where(eq(artifacts.jobId, jobId));
  await db.delete(jobs).where(eq(jobs.id, jobId));
  await logEvent({ kind: "info", title: "Job deleted", detail: jobId });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = requireDb();

  const task = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task[0]) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <div className="text-sm text-slate-300/80">Task not found.</div>
        </div>
      </AppShell>
    );
  }

  const comments = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.taskId, id))
    .orderBy(desc(taskComments.createdAt));

  const jobRows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.taskId, id))
    .orderBy(desc(jobs.createdAt));

  const jobIds = jobRows.map((j) => j.id);
  const artifactRows = jobIds.length
    ? await db
        .select()
        .from(artifacts)
        .where(inArray(artifacts.jobId, jobIds))
        .orderBy(desc(artifacts.createdAt))
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Task</h1>
            <div className="mt-1 text-sm text-slate-300/80">{task[0].title}</div>
          </div>
          <Link href="/tasks" className="w-full sm:w-auto">
            <Button variant="secondary" className="h-10 w-full sm:w-auto">Back</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateTask.bind(null, id)} className="grid gap-3">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-slate-300">
                  Status
                  <select
                    name="status"
                    defaultValue={task[0].status as any}
                    className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="READY">Ready</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-slate-300">
                  Priority
                  <select
                    name="priority"
                    defaultValue={(task[0] as any).priority ?? 2}
                    className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value={1}>High</option>
                    <option value={2}>Normal</option>
                    <option value={3}>Low</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-sm text-slate-300">
                Owner
                <input
                  name="owner"
                  defaultValue={(task[0] as any).owner ?? "Marina"}
                  className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-300">
                Notes
                <textarea
                  name="notes"
                  defaultValue={(task[0] as any).notes ?? ""}
                  className="h-28 w-full resize-none rounded-md border border-white/10 bg-white/5 p-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-stretch sm:justify-end">
                <Button type="submit" className="h-10 w-full sm:w-auto">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={createJob.bind(null, id)} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <input
                name="type"
                placeholder="type (e.g. leads_scrape)"
                className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
              <input
                name="payloadJson"
                placeholder='payload JSON (optional) e.g. {"limit":50}'
                className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
              <Button type="submit" className="h-9 w-full md:w-auto">Create job</Button>
            </form>

            {jobRows.length === 0 ? (
              <div className="text-sm text-slate-300/70">No jobs yet.</div>
            ) : (
              <div className="space-y-2">
                {jobRows.map((j) => (
                  <div key={j.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-100">
                        {j.type} <span className="text-slate-400">({j.status})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400">
                          {new Date(j.createdAt as any).toLocaleString()}
                        </div>
                        <form action={deleteJob.bind(null, j.id)}>
                          <Button
                            type="submit"
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                          >
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="text-xs text-slate-300/80">
                        <div className="font-mono break-words">{j.payloadJson}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="grid gap-3">
                          <form
                            action={addArtifact.bind(null, j.id)}
                            className="grid gap-2 md:grid-cols-[1fr_2fr_auto]"
                          >
                            <input
                              name="name"
                              placeholder="artifact name"
                              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                            />
                            <input
                              name="url"
                              placeholder="paste a URL"
                              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                            />
                            <Button
                              type="submit"
                              variant="secondary"
                              className="h-9 w-full md:w-auto"
                            >
                              Add link
                            </Button>
                          </form>

                          <form
                            action={addArtifact.bind(null, j.id)}
                            className="grid gap-2 md:grid-cols-[1fr_2fr_auto]"
                          >
                            <input
                              name="name"
                              placeholder="artifact name"
                              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                            />
                            <input
                              type="file"
                              name="file"
                              className="w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-slate-100 hover:file:bg-white/15"
                            />
                            <Button type="submit" className="h-9 w-full md:w-auto">Upload file</Button>
                          </form>
                        </div>

                        <div className="space-y-1">
                          {artifactRows
                            .filter((a) => a.jobId === j.id)
                            .map((a: any) => {
                              const href =
                                a.storage === "inline"
                                  ? `/api/artifacts/${a.id}/download`
                                  : a.url;
                              return (
                                <div key={a.id} className="flex items-center justify-between gap-2">
                                  <a
                                    href={href}
                                    className="min-w-0 flex-1 truncate text-sm text-blue-300 hover:text-blue-200"
                                    target={a.storage === "inline" ? undefined : "_blank"}
                                    rel={a.storage === "inline" ? undefined : "noreferrer"}
                                  >
                                    {a.name}
                                    <span className="text-slate-400">
                                      {a.storage === "inline" ? " (download)" : " (link)"}
                                    </span>
                                  </a>
                                  <form action={deleteArtifact.bind(null, a.id)}>
                                    <Button
                                      type="submit"
                                      variant="secondary"
                                      className="h-7 px-2 text-[11px]"
                                    >
                                      Delete
                                    </Button>
                                  </form>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={addComment.bind(null, id)} className="space-y-2">
              <input type="hidden" name="author" value="Joel" />
              <textarea
                name="body"
                placeholder="Write a comment…"
                className="h-24 w-full resize-none rounded-md border border-white/10 bg-white/5 p-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
              <div className="flex justify-stretch sm:justify-end">
                <Button type="submit" className="h-10 w-full sm:w-auto">Add comment</Button>
              </div>
            </form>

            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="text-sm text-slate-300/70">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-100">
                        {c.author}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(c.createdAt as any).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-200/90">
                      {c.body}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
