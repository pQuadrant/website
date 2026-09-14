"use client";

import type { Ref } from "react";

import type { ChromeTopRightContent } from "@/content/types";

/**
 * The top-right cluster: the entry point, a divider, and the sign-in toggle.
 *
 * Specified in `docs/design/chrome.md`. The only interactive part of the
 * chrome, so the two buttons opt back into pointer events that the stage's
 * corner region turns off.
 */
interface TopRightClusterProps {
  content: ChromeTopRightContent;
  /** Whether the sign-in panel is currently open. */
  panelOpen: boolean;
  onToggle: () => void;
  /** The id of the panel the toggle controls. */
  panelId: string;
  /** The toggle, which is where focus returns when the panel closes. */
  toggleRef?: Ref<HTMLButtonElement>;
}

export function TopRightCluster({
  content,
  panelOpen,
  onToggle,
  panelId,
  toggleRef,
}: TopRightClusterProps) {
  const toggle = panelOpen
    ? content.signInToggle.open
    : content.signInToggle.closed;

  return (
    // The one cluster that stays a row at every width. Two controls fit beside
    // each other where four lines of telemetry do not, and both of them are
    // buttons — keeping them together keeps the page's controls in one place
    // instead of scattering them down the corner.
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
          acknowledge a tap with nothing at all. The toggle beside it has had
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

      {/* Dimmer while the panel is open: with the panel on screen, the panel is
          the subject and this control recedes. The spec records that colour as
          an accepted contrast deviation — do not raise it.

          The border is `fg-2` rather than `line-control`, and the body carries a
          faint white lift, so the only action on the page reads as an object
          rather than as two floating words. Both values, and the ceiling on the
          fill, are in `docs/design/chrome.md`.

          The focus ring is a `focus-visible:` treatment, so it appears for a
          keyboard and not on a click or a tap. It is deliberately outside the
          transition: a focus indicator that fades in is a focus indicator that
          is briefly not there. */}
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={panelOpen}
        aria-controls={panelId}
        aria-label={toggle.accessibleLabel}
        onClick={onToggle}
        className={`pointer-events-auto border border-fg-2 bg-control-fill px-chrome-control-pad transition-[color,border-color,text-shadow] duration-hover ease-[ease] hover:border-accent-bright hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:border-accent-bright active:text-fg-0 active:text-shadow-glow-0 ${
          panelOpen
            ? "text-fg-2 text-shadow-glow-2"
            : "text-fg-0 text-shadow-glow-0"
        }`}
      >
        {toggle.label}
      </button>
    </div>
  );
}
