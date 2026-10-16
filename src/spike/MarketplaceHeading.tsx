import { spikeContent } from "@/spike/content";

interface MarketplaceHeadingProps {
  mode: "home" | "market";
}

/**
 * SPIKE. "AI Systems" and its line, fixed beside the small globe — not in the
 * catalogue's scroller, so they stay put while the rows move.
 *
 * Beside the globe in a tall window; under it, in the left column, in a short
 * one. Both positions come from the `--mk-heading-*` properties in CSS.
 *
 * Part of the persistent stage: it fades in 350ms after the marketplace opens,
 * once the globe has nearly arrived, and clears in 100ms on the way home so the
 * growing globe never passes under it.
 */
export function MarketplaceHeading({ mode }: MarketplaceHeadingProps) {
  const { heading, subline } = spikeContent.panel;

  return (
    <div
      data-mode={mode}
      inert={mode === "home"}
      className="pointer-events-none fixed top-[var(--mk-heading-top)] left-[var(--mk-heading-left)] flex w-[var(--mk-heading-width)] translate-y-[var(--mk-heading-shift)] flex-col gap-1.5 [transition:opacity_600ms_ease-out_350ms,visibility_0s_linear_350ms] data-[mode=home]:invisible data-[mode=home]:opacity-0 data-[mode=home]:[transition:opacity_100ms_ease-out,visibility_0s_linear_100ms] motion-reduce:transition-none!"
    >
      <h1 className="font-sans text-[calc(28*var(--chrome-unit))] leading-[1.15] tracking-[-0.015em] text-fg-0 text-shadow-glow-0">
        {heading}
      </h1>
      <p className="font-sans text-[calc(15*var(--chrome-unit))] leading-[1.4] text-fg-1">
        {subline}
      </p>
    </div>
  );
}
