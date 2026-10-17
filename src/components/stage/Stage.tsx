import type { ReactNode } from "react";

import { CHROME_CORNER_ATTRIBUTE } from "@/lib/stage/chrome-clearance";

/**
 * The stage: the full-window surface every other part of the home page sits on.
 *
 * Mapped in `codebase-map/stage.md`, which records the layer order, the
 * centre and the corner regions, and what else depends on them.
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
  /** The route's content, above the stage layers and below the corner chrome. */
  children?: ReactNode;
  /** The chrome clusters, pinned at the two top corners. */
  topLeft?: ReactNode;
  topRight?: ReactNode;
}

export function Stage({
  starfield,
  motif,
  children,
  topLeft,
  topRight,
}: StageProps) {
  return (
    <main className="relative">
      {/* Layer 2 — starfield. Carries the ambient light as well as the stars,
          which is what gives the page its tonal range: the fill below is the
          black point, and this puts light on it.

          Both live on a canvas rather than in CSS because both are positioned
          relative to the motif radius, and no CSS gradient can be — a
          gradient's stops follow the stage, the motif radius does not, and the
          two drift apart as the window changes. See `codebase-map/starfield.md`. */}
      {starfield}

      {/* Layer 3 — the motif. Its canvas spans the stage and is fixed, so it
          stays put behind the scrolling content in a short window. The radius
          is a drawing parameter inside the module, not the size of the element
          — see `codebase-map/globe.md`. */}
      {motif}

      {/* Layer 4 — vignette. Above the canvas, so it darkens the motif's outer
          edge as well as the background, which is what keeps the corner chrome
          legible. Its centre sits above the middle of the stage. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(118%_88%_at_50%_46%,transparent_52%,var(--color-vignette)_100%)]" />

      {/* The document's height. Every layer on the stage is fixed, so without
          this the document would have none of its own. It holds nothing and
          exists so the page is exactly as tall as the window a visitor can see:
          there is nothing below the fold, so the page does not scroll at any
          window size.

          It spans the stage, so it is inert for the same reason the corner
          regions are: were it not, it would take every click meant for the
          motif.

          The height is twice the shared centre — see Stage centre in
          `codebase-map/stage.md`. Written that way rather than as `min-h-svh`,
          which would be the same rule expressed a second time and free to drift
          from it; the declaration is the one in `globals.css`. Not `dvh`, which
          is the *current* viewport and tracks a mobile browser's toolbar. */}
      <div className="pointer-events-none relative min-h-[calc(var(--stage-centre-y)*2)]" />

      {children}

      {/* The two top corner regions. They carry the margin rules only; what
          sits in them is the chrome's business.

          The horizontal margins share three tiers, tightening twice as the
          window narrows, and both are driven by width alone — `stage-narrow:`
          and `stage:`. The top offset does not tier with them: both regions sit
          56px from the top at every size. The two bars inside them are the same
          height at every size, so they share one centre line and a wordmark
          reads level with the bordered control opposite it.

          The margin tier and the reflow are deliberately on different
          triggers. `row:` is both axes — at least 640px wide and at least
          500px tall — because a cluster runs out of room in either direction.
          The margin tightens only because the window has run out of
          *horizontal* room, and a phone in landscape has 930px of it. At
          932 x 330 every cluster stacks and these margins stay at 40px.

          The safe-area padding is added to the margin rather than substituted
          for it, and that does not change with the tiers. The margins are
          measured from the edge of the usable display, and on a notched phone
          the notch moves that edge inward — so the design's offset is that far
          clear of the island, not that far from a point underneath it.
          Substituting `max()` for the addition would put the chrome its margin
          from the *physical* edge and only the remainder clear of the notch,
          which is the failure the inset exists to prevent. On every display
          without an inset the padding is zero and nothing moves.

          The regions are inert, so anything they hold sits over the motif
          without taking its clicks. A cluster with something interactive in it
          opts that element back in.

          They carry `data-chrome-corner` so the motif can measure them. One of
          the terms in its radius rule is the room these leave it, and the
          margins and offsets that decide that are all in the CSS above — so the
          motif reads the boxes rather than keeping a second copy of the rules
          that produce them. The marker is on the region and not on the cluster
          inside it, because the margin is the part the motif has to stay out
          of.

          `fixed`, not `absolute`, and pinned to the window exactly as the two
          canvases are. Positioned in the document they moved when the document
          did, and the canvases did not, so a touch screen's rubber-band drag
          slid the corner chrome across the middle of the globe. Everything is
          pinned, so nothing moves relative to anything else and the gesture has
          nothing left to break — which is what lets the page leave
          pull-to-refresh and the trackpad's bounce alone.

          They fade in one after another over the second phase of the page's
          entrance, 200ms to 900ms, 60ms apart, in reading order. The chrome
          finishes well before the globe does on purpose: the frame is ready and
          waiting, and the motif arrives into it. The delay is written on the
          region rather than in the animation because the stagger is a property
          of which corner this is.

          The fade is opacity and nothing else — the regions are laid out and
          hit-testable from the first frame, so the platform link answers a
          click at one second in whether or not it has finished appearing, and
          the sequence carries on underneath. */}
      <div
        className="pointer-events-none fixed top-[56px] left-stage-margin-tight pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] stage-narrow:left-stage-margin-narrow stage:left-stage-margin animate-chrome-in [animation-delay:200ms] motion-reduce:animate-none"
        {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      >
        {topLeft}
      </div>
      <div
        className="pointer-events-none fixed top-[56px] right-stage-margin-tight pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] stage-narrow:right-stage-margin-narrow stage:right-stage-margin animate-chrome-in [animation-delay:260ms] motion-reduce:animate-none"
        {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      >
        {topRight}
      </div>
    </main>
  );
}
