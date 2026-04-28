import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EssayTitle({
  children,
  className,
  size = "essay",
}: {
  children: ReactNode;
  className?: string;
  size?: "essay" | "display" | "figure";
}) {
  const sizeClass = {
    essay: "text-essay-title",
    display: "text-display",
    figure: "text-figure-title",
  }[size];

  return (
    <h1
      className={cn(
        "font-serif text-balance leading-[1.04] text-foreground",
        sizeClass,
        className,
      )}
      style={{ fontVariationSettings: '"SOFT" 60, "WONK" 0, "opsz" 144' }}
    >
      {children}
    </h1>
  );
}
