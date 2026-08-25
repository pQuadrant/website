"use client";

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
}

export function TopRightCluster({
  content,
  panelOpen,
  onToggle,
  panelId,
}: TopRightClusterProps) {
  const toggle = panelOpen
    ? content.signInToggle.open
    : content.signInToggle.closed;

  return (
    <div className="flex h-[34px] items-stretch gap-[18px] font-mono text-label">
      {/* Text only, so it reads as a word rather than a control until hovered.
          It is the entry point for a conversational surface that is not yet
          designed, and does nothing until that surface exists. */}
      <button
        type="button"
        className="pointer-events-auto text-fg-1 transition-colors duration-hover ease-[ease] hover:text-fg-0"
      >
        {content.entryPoint.label}
      </button>

      <span aria-hidden="true" className="w-px bg-line-chrome" />

      {/* Dimmer while the panel is open: with the panel on screen, the panel is
          the subject and this control recedes. The spec records that colour as
          an accepted contrast deviation — do not raise it. */}
      <button
        type="button"
        aria-expanded={panelOpen}
        aria-controls={panelId}
        aria-label={toggle.accessibleLabel}
        onClick={onToggle}
        className={`pointer-events-auto border border-line-control px-[16px] transition-colors duration-hover ease-[ease] hover:border-accent-bright hover:text-fg-0 ${
          panelOpen ? "text-fg-2" : "text-fg-0"
        }`}
      >
        {toggle.label}
      </button>
    </div>
  );
}
