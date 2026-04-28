import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "primary" | "warm" | "chalk";
}) {
  const toneClass = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warm: "text-court-orange",
    chalk: "text-court-line/80",
  }[tone];

  return (
    <p
      className={cn(
        "ticker tabular flex items-center gap-2 text-eyebrow",
        toneClass,
        className,
      )}
    >
      <span aria-hidden className="inline-block h-px w-6 bg-current opacity-60" />
      <span>{children}</span>
    </p>
  );
}
