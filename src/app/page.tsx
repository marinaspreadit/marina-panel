import { AppShell } from "@/components/shell/app-shell";
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
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Simple, structured operations: tasks, jobs, artifacts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">New task</Button>
            <Button>Run scraper</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>System</CardTitle>
              <CardDescription>Current runtime status</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="blue">Online</Badge>
              <span className="text-sm text-slate-500">Vercel</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Work queue</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold">—</span>
              <span className="text-sm text-slate-500">DB pending</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Scraper runs & outputs</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-semibold">—</span>
              <span className="text-sm text-slate-500">Email-jobs pending</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next</CardTitle>
            <CardDescription>What I’m building now</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Auth (minimal) + Neon DB connection</li>
              <li>Tasks: kanban (TODO / WAITING / DONE)</li>
              <li>Jobs: run scraper → store artifact → download CSV</li>
              <li>Email-jobs: panel → email → OpenClaw execution</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
