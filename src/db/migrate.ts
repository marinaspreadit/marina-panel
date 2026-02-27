import path from "path";

// Drizzle migrator for Neon HTTP driver.
// Runs SQL migrations from /drizzle using the embedded journal.
// Safe to call multiple times (uses _journal table).

let ran = false;
let running: Promise<void> | null = null;

export async function ensureMigrations(db: any) {
  if (ran) return;
  if (running) return running;

  running = (async () => {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");

    // In Next.js / Vercel, process.cwd() is the app root.
    const migrationsFolder = path.join(process.cwd(), "drizzle");

    await migrate(db, { migrationsFolder });
    ran = true;
  })().finally(() => {
    running = null;
  });

  return running;
}
