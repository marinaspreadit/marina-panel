export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDb } from "@/db";
import { taskComments, tasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

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

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Task</h1>
            <div className="mt-1 text-sm text-slate-300/80">{task[0].title}</div>
          </div>
          <Link href="/tasks">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>

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
              <div className="flex justify-end">
                <Button type="submit">Add comment</Button>
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
