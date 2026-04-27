import { cn } from "@/lib/utils";

export function ProgressLine({
  label,
  value,
  tone = "teal",
}: {
  label: string;
  value: number;
  tone?: "teal" | "orange" | "purple" | "red";
}) {
  const color = {
    teal: "bg-primary",
    orange: "bg-orange-300",
    purple: "bg-violet-300",
    red: "bg-red-300",
  }[tone];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
