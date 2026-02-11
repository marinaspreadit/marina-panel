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

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Live operations: tasks, jobs, artifacts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">New task</Button>
            <Button>Run scraper</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Total Tasks</CardTitle>
              <CardDescription>All-time</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">—</span>
              <Badge variant="blue">Live</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Active Jobs</CardTitle>
              <CardDescription>Currently running</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">—</span>
              <span className="text-sm text-slate-300/70">Soon</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Events Today</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">—</span>
              <span className="text-sm text-slate-300/70">Auto</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-100">Artifacts</CardTitle>
              <CardDescription>CSV / files</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-50">—</span>
              <span className="text-sm text-slate-300/70">Soon</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-100">Recent Activity</CardTitle>
              <CardDescription>What I'm doing right now</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityStream />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-100">Operations View</CardTitle>
              <CardDescription>Map / status board (next)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
