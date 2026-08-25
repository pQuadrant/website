import type { ReactNode } from "react";

/**
 * The stage: the full-window surface every other part of the home page sits on.
 *
 * Specified in `docs/design/home.md`. The layer order, the gradient stops, the
 * margins and the window-size behaviour all come from that file.
 *
 * Layer one, the stage fill, is not drawn here. It is set on the document in
 * `src/app/layout.tsx`, because a fill applied to this element alone leaves a
 * white band where an overscroll rubber-bands past the top or bottom edge.
 */
interface StageProps {
  /** The panel, centred over the motif. */
  children?: ReactNode;
}

export function Stage({ children }: StageProps) {
  return (
    <main className="relative">
      {/* Layer 2 — centre lift. A cool wash that keeps the motif off dead
          black. If it reads as a distinct glow, it is too strong. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(46%_52%_at_50%_50%,var(--color-centre-lift)_0%,transparent_72%)]" />

      {/* Layer 3 — motif canvas. Fixed, so it stays put behind the scrolling
          content in a short window.

          SCAFFOLDING: empty, and sized to the motif's own box rather than to
          the whole stage, so the radius rule and its 396px cap are observable
          while there is nothing drawn on it. The hairline is here for the same
          reason. When the globe lands the canvas spans the stage and the radius
          becomes a drawing parameter — see `docs/design/globe.md`. */}
      <canvas
        aria-hidden="true"
        className="fixed top-1/2 left-1/2 size-[min(88dvmin,var(--spacing-motif-max))] -translate-x-1/2 -translate-y-1/2 border border-line-chrome"
      />

      {/* Layer 4 — vignette. Above the canvas, so it darkens the motif's outer
          edge as well as the background, which is what keeps the corner chrome
          legible. Its centre sits above the middle of the stage. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(118%_88%_at_50%_46%,transparent_40%,var(--color-vignette)_100%)]" />

      {/* Layer 5 — auth bloom. At rest it is invisible; it is revealed only
          while a sign-in attempt is processing, which nothing triggers yet. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(42%_46%_at_50%_50%,var(--color-bloom-core)_0%,var(--color-bloom-mid)_46%,var(--color-bloom-edge)_78%)] opacity-0 mix-blend-screen transition-opacity duration-bloom ease-out motion-reduce:hidden" />

      {/* The panel region. Above the stage's minimum height the panel is
          centred in the window. Below it the region holds at that height, so
          the page scrolls rather than clipping and the clearance survives. One
          value drives both, so there is no threshold to cross while resizing
          and nothing jumps. */}
      <div className="relative flex min-h-[max(100dvh,var(--spacing-stage-min-height))] items-center justify-center py-stage-margin">
        {children}
      </div>

      {/* The four corner regions. Empty until the chrome is built; they carry
          the margin rules only. The two top offsets are optical and differ from
          each other by design — do not normalise them.

          SCAFFOLDING: the hairline squares mark where each cluster anchors. */}
      <div className="absolute top-[62px] left-stage-margin-narrow size-4 border border-line-chrome stage:left-stage-margin" />
      <div className="absolute top-[56px] right-stage-margin-narrow size-4 border border-line-chrome stage:right-stage-margin" />
      <div className="absolute bottom-stage-margin left-stage-margin-narrow size-4 border border-line-chrome stage:left-stage-margin" />
      <div className="absolute right-stage-margin-narrow bottom-stage-margin size-4 border border-line-chrome stage:right-stage-margin" />
    </main>
  );
}
