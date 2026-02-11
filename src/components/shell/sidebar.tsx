import Link from "next/link";
import { LayoutGrid, ListTodo, PlaySquare, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/jobs", label: "Jobs", icon: PlaySquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 border-r border-slate-200/70 bg-white/70 backdrop-blur md:block">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200/70 px-4">
        <div className="h-7 w-7 rounded-lg bg-blue-600" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">Marina Panel</div>
          <div className="text-xs text-slate-500">Spreadit • Genius</div>
        </div>
      </div>

      <nav className="p-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 text-xs text-slate-500">
        Minimal • fast • structured
      </div>
    </aside>
  );
}
