import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Eyebrow } from "./Eyebrow";
import { EssayTitle } from "./EssayTitle";

export type CoverProps = {
  eyebrow?: string;
  title: ReactNode;
  /** Optional subtitle / dek line — italic serif. */
  dek?: ReactNode;
  /** Optional cover image URL (DALL-E/Midjourney library, per Every essay convention). */
  imageUrl?: string;
  /** When supplied, swap the procedural cover for an image with overlay treatment. */
  alt?: string;
  /** Right-side accent — e.g. issue number or status pill. */
  accent?: ReactNode;
  /** Slot for chips or a CTA below the title. */
  footer?: ReactNode;
  className?: string;
  /**
   * Visual variant of the procedural cover (used when no imageUrl is provided).
   * "rays" = conic warm/cool rays, "court" = court diagram bg, "newsprint" = flat newsprint.
   */
  variant?: "rays" | "court" | "newsprint";
};

/**
 * Cover — the full-bleed essay opening.
 *
 * Every essay convention quoted from graph/themes/every-design-system.md:41:
 *   "Bold typography for headlines paired with high-quality illustrative cover art
 *   (DALL-E/Midjourney/Every illustrations)."
 *
 * If no `imageUrl` is supplied, a procedural cover stands in — court grid + warm/cool rays —
 * so engineering doesn't block on illustration generation.
 */
export function Cover({
  eyebrow,
  title,
  dek,
  imageUrl,
  alt,
  accent,
  footer,
  className,
  variant = "rays",
}: CoverProps) {
  const variantClass =
    variant === "newsprint"
      ? "bg-court-paint bg-newsprint"
      : variant === "court"
        ? "bg-court-paint bg-cover-grid"
        : "bg-cover-rays";

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[2px] border border-foreground/10",
        "shadow-paper",
        className,
      )}
    >
      {imageUrl ? (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
          role={alt ? "img" : undefined}
          aria-label={alt}
        />
      ) : (
        <div className={cn("absolute inset-0 -z-10", variantClass)} aria-hidden />
      )}

      {/* Tonal scrim — every cover keeps the title legible regardless of art. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-tr from-black/82 via-black/60 to-black/40 mix-blend-multiply"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background"
      />

      {/* Halftime corner light */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-72 w-72 rounded-full bg-halftime-warm/30 blur-3xl"
      />

      <div className="relative grid gap-10 px-6 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:px-14 lg:pb-20 lg:pt-20">
        <div className="space-y-7 max-w-3xl">
          {eyebrow ? <Eyebrow tone="warm">{eyebrow}</Eyebrow> : null}
          <EssayTitle size="display" className="text-court-line">
            {title}
          </EssayTitle>
          {dek ? (
            <p className="font-serif text-lede italic text-court-line/85 max-w-2xl text-balance">
              {dek}
            </p>
          ) : null}
          {footer ? <div className="pt-2">{footer}</div> : null}
        </div>

        {accent ? <div className="self-start lg:self-end">{accent}</div> : null}
      </div>
    </section>
  );
}
