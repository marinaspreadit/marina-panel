import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold">Marina Panel</h1>
        <p className="text-slate-600">
          MVP: Panel de gestió (jobs + artefactes) per a Spreadit/Genius.
        </p>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Status</h2>
          <ul className="mt-2 list-disc pl-5 text-slate-700">
            <li>Auth: pending (NextAuth)</li>
            <li>DB: pending (Neon/Supabase)</li>
            <li>Email jobs: pending (Resend)</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            className="rounded-md bg-black px-4 py-2 text-white"
            href="/jobs"
          >
            Jobs
          </Link>
          <a
            className="rounded-md border px-4 py-2"
            href="https://github.com/marinaspreadit/marina-panel"
            target="_blank"
            rel="noreferrer"
          >
            Repo
          </a>
        </div>
      </div>
    </main>
  );
}
