import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search (soon)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-200" />
      </div>
    </header>
  );
}
