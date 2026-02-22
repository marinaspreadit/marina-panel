import Link from "next/link";

import { Search } from "lucide-react";

import { MobileNav } from "@/components/shell/mobile-nav";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3 text-sm text-slate-300">
        <MobileNav />

        <form
          method="GET"
          action="/search"
          className="hidden min-w-0 items-center gap-2 sm:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <input
            name="q"
            placeholder="Search tasks/jobs…"
            className="h-9 w-72 max-w-[45vw] rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </form>

        <div className="sm:hidden">Marina Panel</div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/tasks"
          className="hidden h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 hover:bg-white/10 sm:inline-flex"
        >
          Tasks
        </Link>
        <Link
          href="/jobs"
          className="hidden h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 hover:bg-white/10 sm:inline-flex"
        >
          Jobs
        </Link>

        <Link
          href="/tasks"
          className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500"
        >
          + New task
        </Link>

        <a
          href="/api/logout"
          className="hidden h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 hover:bg-white/10 sm:inline-flex"
        >
          Logout
        </a>

        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
    </header>
  );
}
