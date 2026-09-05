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
  /** The starfield, layer two. Carries the ambient light as well as the stars. */
  starfield?: ReactNode;
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
  starfield,
  motif,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  children,
}: StageProps) {
  return (
    <main className="relative">
      {/* Layer 2 — starfield. Carries the ambient light as well as the stars,
          which is what gives the page its tonal range: the fill below is the
          black point, and this puts light on it.

          Both live on a canvas rather than in CSS because both are positioned
          relative to the motif radius, and no CSS gradient can be — a
          gradient's stops follow the stage, the motif radius does not, and the
          two drift apart as the window changes. See `docs/design/starfield.md`. */}
      {starfield}

      {/* Layer 3 — the motif. Its canvas spans the stage and is fixed, so it
          stays put behind the scrolling content in a short window. The radius
          is a drawing parameter inside the module, not the size of the element
          — see `docs/design/globe.md`. */}
      {motif}

      {/* Layer 4 — vignette. Above the canvas, so it darkens the motif's outer
          edge as well as the background, which is what keeps the corner chrome
          legible. Its centre sits above the middle of the stage. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(118%_88%_at_50%_46%,transparent_52%,var(--color-vignette)_100%)]" />

      {/* Layer 5 — auth bloom. At rest it is invisible; it is revealed only
          while a sign-in attempt is processing, which nothing triggers yet. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(42%_46%_at_50%_50%,var(--color-bloom-core)_0%,var(--color-bloom-mid)_46%,var(--color-bloom-edge)_78%)] opacity-0 mix-blend-screen transition-opacity duration-bloom ease-out motion-reduce:hidden" />

      {/* The panel region. It is at least the height of the window, and grows
          past it only when something inside it does not fit — which means the
          page scrolls when the panel is open on a short window, and does not
          scroll at all when the panel is closed. There is nothing below the
          fold on this page, so a page that scrolls with the panel shut is
          revealing empty room reserved for something that is not on screen.

          The clearance is the padding, and only the padding. An explicit
          minimum height computed from the panel's height said the same thing a
          second time, and the two could disagree; the region sizes itself to
          its contents, so the padding alone keeps the panel off the window
          edges without anything needing to know how tall the panel is.

          The region spans the stage, so it is inert for the same reason the
          corner regions are: were it not, it would take every click meant for
          the motif. The panel opts back in. */}
      <div className="pointer-events-none relative flex min-h-dvh items-center justify-center py-stage-margin">
        {children}
      </div>

      {/* The four corner regions. They carry the margin rules only; what sits
          in them is the chrome's business. The two top offsets are optical and
          differ from each other by design — do not normalise them.

          The horizontal margin has three tiers, tightening twice as the window
          narrows. The bottom margin has one: only the horizontal margin moves,
          because only the horizontal axis runs out of room.

          The safe-area padding is added to the margin rather than substituted
          for it. The margins are measured from the edge of the usable display,
          and on a notched phone the notch and the home indicator move that edge
          inward — so the design's 62px is 62px clear of the island, not 62px
          from a point underneath it. On every display without an inset the
          padding is zero and nothing moves.

          The regions are inert, so anything they hold sits over the motif
          without taking its clicks. A cluster with something interactive in it
          opts that element back in. */}
      <div className="pointer-events-none absolute top-[62px] left-stage-margin-tight pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] row:left-stage-margin-narrow stage:left-stage-margin">
        {topLeft}
      </div>
      <div className="pointer-events-none absolute top-[56px] right-stage-margin-tight pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] row:right-stage-margin-narrow stage:right-stage-margin">
        {topRight}
      </div>
      <div className="pointer-events-none absolute bottom-stage-margin left-stage-margin-tight pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] row:left-stage-margin-narrow stage:left-stage-margin">
        {bottomLeft}
      </div>
      <div className="pointer-events-none absolute right-stage-margin-tight bottom-stage-margin pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] row:right-stage-margin-narrow stage:right-stage-margin">
        {bottomRight}
      </div>
    </main>
  );
}
