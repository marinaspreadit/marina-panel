import { Search } from "lucide-react";

import { MobileNav } from "@/components/shell/mobile-nav";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-white/5 px-4 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <MobileNav />
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search (soon)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
    </header>
  );
}
