export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { requireDb } from "@/db";
import { artifacts, jobs, tasks } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
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

function csvEscape(s: any) {
  const v = String(s ?? "");
  if (/[",\n\r]/.test(v)) return '"' + v.replaceAll('"', '""') + '"';
  return v;
}

function toCsv(rows: Record<string, any>[], header: string[]) {
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) lines.push(header.map((h) => csvEscape(r[h] ?? "")).join(","));
  return lines.join("\n") + "\n";
}

async function fallbackScrape({ city, vertical, limit }: any) {
  // Minimal fallback: for BCN peluquerías we use Sants directory as a source.
  const header = [
    "vertical",
    "city",
    "name",
    "phone",
    "whatsapp",
    "address",
    "maps_link",
    "website",
    "email",
    "source",
  ];

  if (!/barcelona/i.test(city)) {
    return { header, rows: [] as any[], source: "fallback-empty" };
  }

  const url =
    "https://www.carrerdesants.cat/cat/socis/equipament-i-serveis-personals/perruqueria";
  const html = await fetch(url, { cache: "no-store" }).then((r) => r.text());
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: any[] = [];
  const seenPhone = new Set<string>();

  for (let i = 0; i < lines.length - 2 && rows.length < limit; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    const c = lines[i + 2];

    // Heuristic: address line + postal code line + phone line.
    if (!/\b080\d{2}\b/.test(b)) continue;
    const phoneDigits = c.replace(/\D/g, "");
    if (phoneDigits.length < 8) continue;
    const phoneNorm = phoneDigits.replace(/^34/, "");
    if (seenPhone.has(phoneNorm)) continue;
    seenPhone.add(phoneNorm);

    const address = `${a}, ${b}`;
    rows.push({
      vertical,
      city,
      name: "",
      phone: phoneDigits.length === 9 ? `+34 ${phoneDigits}` : phoneDigits,
      whatsapp: "",
      address,
      maps_link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      website: "",
      email: "",
      source: url,
    });
  }

  return { header, rows, source: url };
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

  const inserted = await db
    .insert(jobs)
    .values({
      taskId,
      type: "scraper_run",
      status: "RUNNING",
      payloadJson: JSON.stringify(payload),
      log: "Starting…",
    } as any)
    .returning({ id: jobs.id });

  const jobId = inserted[0]!.id;

  try {
    const res = await fallbackScrape(payload);
    const csv = toCsv(res.rows, res.header);

    await db.insert(artifacts).values({
      jobId,
      name: `scrape_${city}_${vertical}_${payload.limit}.csv`,
      storage: "inline",
      url: "",
      filename: `scrape_${city}_${vertical}_${payload.limit}.csv`,
      mime: "text/csv",
      contentBase64: Buffer.from(csv, "utf8").toString("base64"),
    } as any);

    await db
      .update(jobs)
      .set({ status: "SUCCESS", log: `OK: ${res.rows.length} rows (source: ${res.source})` } as any)
      .where(eq(jobs.id, jobId));

    await logEvent({
      kind: "success",
      title: "Scraper run finished",
      detail: `${query} — ${city} (${res.rows.length})`,
    });
  } catch (e: any) {
    await db
      .update(jobs)
      .set({ status: "ERROR", log: String(e?.message || e) } as any)
      .where(eq(jobs.id, jobId));

    await logEvent({
      kind: "error",
      title: "Scraper run failed",
      detail: String(e?.message || e),
    });
  }
}

export default async function ScraperPage() {
  const db = requireDb();
  const taskId = await getOrCreateScraperTaskId();

  const build = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "local",
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
  };

  const recent = await db
    .select()
    .from(jobs)
    .where(eq(jobs.taskId, taskId))
    .orderBy(desc(jobs.createdAt))
    .limit(25);

  const jobIds = recent.map((j) => j.id);
  const recentArtifacts = jobIds.length
    ? await db.select().from(artifacts).where(inArray(artifacts.jobId, jobIds))
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Scraper
          </h1>
          <p className="mt-1 text-sm text-slate-300/80">
            Run and download results.
          </p>
          <div className="mt-1 text-xs text-slate-400">
            build: {build.env} · {build.commit.slice(0, 7)}
          </div>
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
              <div className="md:col-span-4 flex justify-stretch md:justify-end">
                <Button type="submit" className="h-11 w-full md:w-auto">RUN</Button>
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
              recent.map((j: any) => {
                const arts = recentArtifacts.filter((a: any) => a.jobId === j.id);
                return (
                  <div
                    key={j.id}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
                    <div className="mt-2 space-y-1">
                      {arts.length ? (
                        arts.map((a: any) => (
                          <a
                            key={a.id}
                            href={`/api/artifacts/${a.id}/download`}
                            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm text-slate-100 hover:bg-white/10 md:w-auto"
                          >
                            Download: {a.name}
                          </a>
                        ))
                      ) : (
                        <div className="text-sm text-slate-300/60">No file yet.</div>
                      )}
                      {j.log ? (
                        <div className="text-xs text-slate-300/60">{j.log}</div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
