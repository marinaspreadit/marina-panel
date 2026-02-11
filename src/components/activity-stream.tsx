"use client";

import { useEffect, useMemo, useState } from "react";

type EventRow = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  createdAt: string;
};

function pillClass(kind: string) {
  if (kind === "success") return "bg-emerald-500/15 text-emerald-200";
  if (kind === "warning") return "bg-amber-500/15 text-amber-200";
  if (kind === "error") return "bg-rose-500/15 text-rose-200";
  return "bg-white/10 text-slate-200";
}

export function ActivityStream({ className }: { className?: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [connected, setConnected] = useState(false);

  const subtitle = useMemo(
    () => (connected ? "Live" : "Connecting…"),
    [connected],
  );

  useEffect(() => {
    const es = new EventSource("/api/events/stream");

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload?.events) {
          setEvents(payload.events);
        }
      } catch {
        // ignore
      }
    };

    return () => es.close();
  }, []);

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">Recent Activity</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-sm text-slate-300/70">No events yet.</div>
        ) : (
          events.slice(0, 10).map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-100">{e.title}</div>
                {e.detail ? (
                  <div className="truncate text-xs text-slate-400">{e.detail}</div>
                ) : null}
              </div>
              <div
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] " +
                  pillClass(e.kind)
                }
              >
                {e.kind}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
