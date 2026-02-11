export const dynamic = "force-dynamic";

import { getRecentEvents } from "@/lib/events";

function encode(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      let lastId: string | null = null;

      const interval = setInterval(async () => {
        try {
          const rows = await getRecentEvents(25);
          if (rows.length === 0) return;

          const newestId = String(rows[0].id);
          if (lastId && newestId === lastId) return;

          lastId = newestId;
          controller.enqueue(encode({ events: rows }));
        } catch {
          // swallow
        }
      }, 1500);

      controller.enqueue(encode({ hello: true }));

      // NOTE: Next will cancel the stream automatically on disconnect.
      // We still guard interval cleanup.
      (controller as any)._cleanup = () => clearInterval(interval);
    },
    cancel(reason) {
      // best-effort cleanup
      try {
        (reason as any)?._cleanup?.();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
