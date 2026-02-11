import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Auth, DB, email providers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <ul className="list-disc space-y-1 pl-5">
              <li>Neon DATABASE_URL (pending)</li>
              <li>Auth secret + admin user (pending)</li>
              <li>Resend API key (pending)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
