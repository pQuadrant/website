"use client";

import type { ChromeTopRightContent } from "@/content/types";

/**
 * The top-right cluster: the entry point, a divider, and the platform link.
 *
 * Specified in `docs/design/chrome.md`. The only interactive part of the
 * chrome, so both controls opt back into pointer events that the stage's
 * corner region turns off.
 */
interface TopRightClusterProps {
  content: ChromeTopRightContent;
}

export function TopRightCluster({ content }: TopRightClusterProps) {
  return (
    // The one cluster that stays a row at every width. Two controls fit beside
    // each other where four lines of telemetry do not — keeping them together
    // keeps the page's controls in one place instead of scattering them down
    // the corner.
    //
    // The row's height is the touch target, and both children stretch to it, so
    // 44px below the breakpoint sizes them both without either one carrying
    // padding of its own. The gap tightens for the same reason the stage margin
    // does: there is less room.
    <div className="flex h-chrome-touch items-stretch gap-chrome-row-gap-tight font-mono text-chrome-label row:h-chrome-control row:gap-chrome-row-gap">
      {/* Text only, so it reads as a word rather than a control until hovered.
          It is the entry point for a conversational surface that is not yet
          designed, and does nothing until that surface exists.

          Its active state is not a duplicate of its hover state. Tailwind emits
          every `hover:` utility inside `@media (hover: hover)`, so on a touch
          device the hover rules never apply, and without this the button would
          acknowledge a tap with nothing at all. The control beside it has had
          one for this reason since it was built; this one had not. */}
      <button
        type="button"
        className="pointer-events-auto text-fg-1 text-shadow-glow-1 transition-[color,text-shadow] duration-hover ease-[ease] hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0 active:text-shadow-glow-0"
      >
        {content.entryPoint.label}
      </button>

      {/* Flat paint, and the one mark in the chrome that stays that way. It
          divides two controls; a halo on it would make it compete with them. */}
      <span aria-hidden="true" className="w-px bg-line-chrome" />

      {/* A real link, not a button: it leaves the page, so it has to open in a
          new tab on a modified click, a middle click or the context menu, and
          only an anchor with an `href` gets all of that from the browser. Same
          tab by default — no `target`.

          `flex items-center` is not a design change. A `<button>` centres its
          label vertically on its own; an anchor stretched to the row's height
          puts it at the top. This keeps the label where the toggle had it.

          The border is `fg-2` rather than `line-control`, and the body carries a
          faint white lift, so the only action on the page reads as an object
          rather than as a floating word. Both values, and the ceiling on the
          fill, are in `docs/design/chrome.md`.

          The focus ring is a `focus-visible:` treatment, so it appears for a
          keyboard and not on a click or a tap. It is deliberately outside the
          transition: a focus indicator that fades in is a focus indicator that
          is briefly not there. */}
      <a
        href={content.platformLink.href}
        className="pointer-events-auto flex items-center border border-fg-2 bg-control-fill px-chrome-control-pad text-fg-0 text-shadow-glow-0 transition-[color,border-color,text-shadow] duration-hover ease-[ease] hover:border-accent-bright hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:border-accent-bright active:text-fg-0 active:text-shadow-glow-0"
      >
        {content.platformLink.label}
      </a>
    </div>
  );
}
