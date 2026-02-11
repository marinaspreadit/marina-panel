import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "blue" | "green" | "gray" | "red";

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-900 text-white",
  blue: "bg-blue-600 text-white",
  green: "bg-emerald-600 text-white",
  gray: "bg-slate-100 text-slate-700",
  red: "bg-rose-600 text-white",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
