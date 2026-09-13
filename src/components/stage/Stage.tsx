import type { ReactNode } from "react";

import { CHROME_CORNER_ATTRIBUTE } from "@/lib/stage/chrome-clearance";

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
          the motif. The panel opts back in.

          The height is twice the shared centre, so the panel's middle lands on
          exactly the number the motif draws on — see the Motif centring section
          of `docs/design/home.md`. Written that way rather than as `min-h-svh`,
          which would be the same rule expressed a second time and free to drift
          from it; the declaration is the one in `globals.css`.

          Not `dvh`, which is what this was. `dvh` is the *current* viewport, so
          it tracks a mobile browser's toolbar: the panel sat correctly while the
          toolbar showed, then slid to a new centre as it retracted while the
          motif stayed put — two layers centring on two heights, one of which
          moves. */}
      <div className="pointer-events-none relative flex min-h-[calc(var(--stage-centre-y)*2)] items-center justify-center py-stage-margin">
        {children}
      </div>

      {/* The four corner regions. They carry the margin rules only; what sits
          in them is the chrome's business. The two top offsets are optical and
          differ from each other by design — do not normalise them.

          The horizontal and bottom margins share three tiers, tightening twice
          as the window narrows, and all three are driven by width alone —
          `stage-narrow:` and `stage:`. The top offsets do not tier with them.
          The right one holds 56px at every size; the left one falls to 34px in
          a tight window, and that is not tightening — it is where a block 88px
          tall has to start to be centred on the 44px row opposite, whose centre
          line is 78px. The top-right offset is the one that governs, and the
          number to re-derive if either cluster's height ever changes is this
          one. See the Margins section of `docs/design/home.md`.

          The margin tier and the reflow are deliberately on different
          triggers. `row:` is both axes — at least 640px wide and at least
          500px tall — because a cluster runs out of room in either direction.
          The margin tightens only because the window has run out of
          *horizontal* room, and a phone in landscape has 930px of it. At
          932 x 330 every cluster stacks and these margins stay at 40px.

          That is a deliberate asymmetry rather than an oversight, and it is
          what the two edges are carrying. The top holds the identity and the
          only controls on the page — foreground, and the half a visitor aims
          at. The bottom holds telemetry, which is ambient by design and reads
          better settled into the frame's edge than floating off it. Giving both
          the same inset made the controls read as crammed into the corner on a
          phone at the same moment it stopped the telemetry floating; they are
          different problems and they do not share an answer.

          The two top offsets differ from each other by an optical lift — the
          right cluster's bordered control sits lower inside its own box than
          bare type does. Do not normalise them.

          The safe-area padding is added to the margin rather than substituted
          for it, and that does not change with the tiers. The margins are
          measured from the edge of the usable display, and on a notched phone
          the notch and the home indicator move that edge inward — so the
          design's offset is that far clear of the island, not that far from a
          point underneath it. Substituting `max()` for the addition would put
          the chrome its margin from the *physical* edge and only the remainder
          clear of the indicator, which is the failure the inset exists to
          prevent. On every display without an inset the padding is zero and
          nothing moves.

          The regions are inert, so anything they hold sits over the motif
          without taking its clicks. A cluster with something interactive in it
          opts that element back in.

          They carry `data-chrome-corner` so the motif can measure them. One of
          the four terms in its radius rule is the room these leave it, and the
          margins and offsets that decide that are all in the CSS above — so the
          motif reads the boxes rather than keeping a second copy of the rules
          that produce them. The marker is on the region and not on the cluster
          inside it, because the margin is the part the motif has to stay out
          of. See the Motif sizing section of `docs/design/home.md`.

          `fixed`, not `absolute`, and pinned to the window exactly as the two
          canvases are. Positioned in the document they moved when the document
          did, and the canvases did not, so a touch screen's rubber-band drag
          slid the corner telemetry across the middle of the globe. Everything
          except the panel is now pinned, so nothing moves relative to anything
          else and the gesture has nothing left to break — which is what lets
          the page leave pull-to-refresh and the trackpad's bounce alone. See
          Touch edges in `docs/design/home.md`.

          They fade in one after another over the second phase of the page's
          entrance, 200ms to 900ms, 60ms apart, in reading order. The chrome
          finishes well before the globe does on purpose: the frame is ready and
          waiting, and the motif arrives into it. The delay is written on the
          region rather than in the animation because the stagger is a property
          of which corner this is. See the Entrance section of
          `docs/design/globe.md`.

          The fade is opacity and nothing else — the regions are laid out and
          hit-testable from the first frame, so the sign-in toggle answers a
          click at one second in whether or not it has finished appearing, and
          the sequence carries on underneath. */}
      <div
        className="pointer-events-none fixed top-[34px] left-stage-margin-tight pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] row:top-[62px] stage-narrow:left-stage-margin-narrow stage:left-stage-margin animate-chrome-in [animation-delay:200ms] motion-reduce:animate-none"
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
      <div
        className="pointer-events-none fixed bottom-stage-margin-tight left-stage-margin-tight pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] stage-narrow:bottom-stage-margin-narrow stage-narrow:left-stage-margin-narrow stage:bottom-stage-margin stage:left-stage-margin animate-chrome-in [animation-delay:320ms] motion-reduce:animate-none"
        {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      >
        {bottomLeft}
      </div>
      <div
        className="pointer-events-none fixed right-stage-margin-tight bottom-stage-margin-tight pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] stage-narrow:bottom-stage-margin-narrow stage-narrow:right-stage-margin-narrow stage:bottom-stage-margin stage:right-stage-margin animate-chrome-in [animation-delay:380ms] motion-reduce:animate-none"
        {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      >
        {bottomRight}
      </div>
    </main>
  );
}
