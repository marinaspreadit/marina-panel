export default function JobsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-slate-600">
          Aquí mostrarem el llistat de jobs i els artefactes (CSV) per descarregar.
        </p>
        <div className="rounded-lg border p-4">
          <p className="text-slate-700">
            MVP en construcció: primer deploy + login + DB.
          </p>
        </div>
      </div>
    </main>
  );
}
