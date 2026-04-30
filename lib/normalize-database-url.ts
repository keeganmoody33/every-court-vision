/**
 * Vercel / shell mistakes sometimes paste `DATABASE_URL=postgresql://...` as the value.
 * Neon and pg expect a URL starting with postgres scheme only.
 */
export function normalizeDatabaseUrl(raw: string): string {
  const t = raw.trim();
  return t.startsWith("DATABASE_URL=") ? t.slice("DATABASE_URL=".length).trimStart() : t;
}
