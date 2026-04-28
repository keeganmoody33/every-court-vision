import { Sparkles } from "lucide-react";

/**
 * Honest disclosure that a post or aggregate is preview-grade synthetic data, not
 * real engagement. Triggers when `Post.sourceId` is null/empty (no acquisition has
 * tagged this row yet) — i.e., it's a seed fixture. Real scraped posts get
 * `sourceId = "acquired:<provider>"` from `lib/acquisition/persist.ts` and the
 * pill clears.
 *
 * Usage:
 *   {isSyntheticPost(post) ? <SyntheticPill /> : null}
 *   {isSyntheticPost(post) ? <SyntheticPill compact /> : null}
 */
export function SyntheticPill({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-orange-300/40 bg-orange-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200"
        title="Preview data. Body text and engagement numbers are placeholders. Real values land when Phase 4 acquisition runs against this surface."
      >
        <Sparkles className="size-2.5" />
        Preview
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/40 bg-orange-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200"
      title="Preview data. Body text and engagement numbers are placeholders. Real values land when Phase 4 acquisition runs against this surface."
    >
      <Sparkles className="size-3" />
      Synthetic preview · awaiting first scrape
    </span>
  );
}

/**
 * Single source of truth for "is this post still preview data?" Used by every
 * consumer that wants to gate the pill — keeps the rule consistent across pages.
 *
 * The acquisition layer (lib/acquisition/persist.ts) tags real scrapes as
 * `acquired:<provider>`; everything else (seed fixtures with `seeded:roster-fixture`,
 * null, manual entry) renders the pill.
 */
export function isSyntheticPost(post: { sourceId?: string | null }): boolean {
  return !post.sourceId || !post.sourceId.startsWith("acquired:");
}
