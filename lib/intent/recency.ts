export interface RecencyVisual {
  size: number;
  opacity: number;
}

export function recencyVisual(timestampISO: string, now = new Date()): RecencyVisual {
  const ageMs = now.getTime() - new Date(timestampISO).getTime();
  const ageDays = ageMs / 86_400_000;

  if (ageDays <= 7) return { size: 1.6, opacity: 1 };
  if (ageDays <= 30) return { size: 1.2, opacity: 0.7 };
  if (ageDays <= 90) return { size: 0.9, opacity: 0.45 };
  return { size: 0.6, opacity: 0.3 };
}
