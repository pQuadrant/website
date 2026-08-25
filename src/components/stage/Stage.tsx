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
  /** The motif, layer three, spanning the stage behind everything above it. */
  motif?: ReactNode;
  /** The chrome clusters, pinned at the four corners. */
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  /** The panel, centred over the motif. */
  children?: ReactNode;
}

export function Stage({
  motif,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  children,
}: StageProps) {
  return (
    <main className="relative">
      {/* Layer 2 — centre lift. A cool wash that keeps the motif off dead
          black. If it reads as a distinct glow, it is too strong. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(46%_52%_at_50%_50%,var(--color-centre-lift)_0%,transparent_72%)]" />

      {/* Layer 3 — the motif. Its canvas spans the stage and is fixed, so it
          stays put behind the scrolling content in a short window. The radius
          is a drawing parameter inside the module, not the size of the element
          — see `docs/design/globe.md`. */}
      {motif}

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
          and nothing jumps.

          The region spans the stage, so it is inert for the same reason the
          corner regions are: were it not, it would take every click meant for
          the motif. The panel opts back in. */}
      <div className="pointer-events-none relative flex min-h-[max(100dvh,var(--spacing-stage-min-height))] items-center justify-center py-stage-margin">
        {children}
      </div>

      {/* The four corner regions. They carry the margin rules only; what sits
          in them is the chrome's business. The two top offsets are optical and
          differ from each other by design — do not normalise them.

          The regions are inert, so anything they hold sits over the motif
          without taking its clicks. A cluster with something interactive in it
          opts that element back in. */}
      <div className="pointer-events-none absolute top-[62px] left-stage-margin-narrow stage:left-stage-margin">
        {topLeft}
      </div>
      <div className="pointer-events-none absolute top-[56px] right-stage-margin-narrow stage:right-stage-margin">
        {topRight}
      </div>
      <div className="pointer-events-none absolute bottom-stage-margin left-stage-margin-narrow stage:left-stage-margin">
        {bottomLeft}
      </div>
      <div className="pointer-events-none absolute right-stage-margin-narrow bottom-stage-margin stage:right-stage-margin">
        {bottomRight}
      </div>
    </main>
  );
}
