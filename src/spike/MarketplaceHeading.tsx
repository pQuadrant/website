import { spikeContent } from "@/spike/content";

/**
 * SPIKE. "AI Systems" and its line, fixed beside the small globe — not in the
 * catalogue's scroller, so they stay put while the rows move.
 *
 * Beside the globe in a tall window; under it, in the left column, in a short
 * one. Both positions come from the `--mk-heading-*` properties in CSS.
 */
export function MarketplaceHeading() {
  const { heading, subline } = spikeContent.panel;

  return (
    <div className="pointer-events-none fixed top-[var(--mk-heading-top)] left-[var(--mk-heading-left)] flex w-[var(--mk-heading-width)] translate-y-[var(--mk-heading-shift)] flex-col gap-1.5">
      <h1 className="font-sans text-[calc(28*var(--chrome-unit))] leading-[1.15] tracking-[-0.015em] text-fg-0 text-shadow-glow-0">
        {heading}
      </h1>
      <p className="font-sans text-[calc(15*var(--chrome-unit))] leading-[1.4] text-fg-1">
        {subline}
      </p>
    </div>
  );
}
