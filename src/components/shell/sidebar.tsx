"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListTodo, PlaySquare, Settings, Wrench } from "lucide-react";

const coreItems = [{ href: "/", label: "Home", icon: LayoutGrid }];
const opsItems = [
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/jobs", label: "Jobs", icon: PlaySquare },
  { href: "/scraper", label: "G-News", icon: Wrench },
];
const systemItems = [{ href: "/settings", label: "Settings", icon: Settings }];

function NavSection({ title, items }: { title: string; items: typeof coreItems }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <div className="px-3 pb-1 pt-3 text-[11px] font-medium tracking-wider text-slate-400/80">
        {title}
      </div>
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition " +
              (active
                ? "bg-white/10 text-slate-50"
                : "text-slate-300 hover:bg-white/5 hover:text-slate-100")
            }
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 border-r border-white/10 bg-[#060A15] md:block">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <div className="h-7 w-7 rounded-lg bg-blue-600" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-50">Mission Control</div>
          <div className="text-xs text-slate-400">Marina • Spreadit</div>
        </div>
      </div>

      <nav className="p-2">
        <NavSection title="CORE" items={coreItems} />
        <NavSection title="OPERATIONS" items={opsItems} />
        <NavSection title="SYSTEM" items={systemItems} />
      </nav>

      <div className="px-4 py-3 text-xs text-slate-400">
        Minimal • fast • structured
      </div>
    </aside>
  );
}
