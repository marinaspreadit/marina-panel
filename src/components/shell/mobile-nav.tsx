"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  ListTodo,
  PlaySquare,
  Settings,
  Wrench,
  X,
  Menu,
} from "lucide-react";

const items = [
  { section: "CORE", href: "/", label: "Home", icon: LayoutGrid },
  { section: "OPERATIONS", href: "/tasks", label: "Tasks", icon: ListTodo },
  { section: "OPERATIONS", href: "/jobs", label: "Jobs", icon: PlaySquare },
  { section: "OPERATIONS", href: "/scraper", label: "Scraper", icon: Wrench },
  { section: "SYSTEM", href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Close on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Prevent background scroll while the mobile menu is open.
    // (Important on iOS where fixed overlays can still allow scroll.)
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[#060A15]">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <div className="text-sm font-semibold text-slate-50">Mission Control</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-2">
              {(["CORE", "OPERATIONS", "SYSTEM"] as const).map((section) => (
                <div key={section} className="space-y-1">
                  <div className="px-3 pb-1 pt-3 text-[11px] font-medium tracking-wider text-slate-400/80">
                    {section}
                  </div>
                  {items
                    .filter((i) => i.section === section)
                    .map((it) => {
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
              ))}
            </nav>

            <div className="px-4 py-3 text-xs text-slate-400">
              Minimal • fast • structured
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
