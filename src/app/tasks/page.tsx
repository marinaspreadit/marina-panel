import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kanban board (DB-backed) is next.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {["TODO", "WAITING", "DONE"].map((col) => (
            <Card key={col} className="min-h-[260px]">
              <CardHeader>
                <CardTitle>{col}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">
                No data yet.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
