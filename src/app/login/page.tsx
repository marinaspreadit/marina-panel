"use client";

import { useState } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getNextPath() {
  if (typeof window === "undefined") return "/";
  const sp = new URLSearchParams(window.location.search);
  return sp.get("next") || "/";
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const nextPath = getNextPath();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password, next: nextPath }),
    });

    if (!res.ok) {
      setErr("Password incorrecta");
      return;
    }

    const data = await res.json();
    window.location.href = data.next || "/";
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {err ? <p className="text-sm text-rose-600">{err}</p> : null}
              <Button className="w-full" type="submit">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
