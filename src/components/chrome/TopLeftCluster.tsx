import type { ChromeTopLeftContent } from "@/content/types";

/**
 * The top-left cluster: the product line.
 *
 * Specified in `docs/design/chrome.md`. Non-interactive — the stage's corner
 * region does not intercept pointer events, so clicks reach the motif beneath.
 *
 * The server line used to sit beneath this one. It is telemetry, wearing
 * telemetry's colour, and it now sits with the rest of it in the bottom-right
 * cluster; what is left here is identity alone.
 */
interface TopLeftClusterProps {
  content: ChromeTopLeftContent;
}

export function TopLeftCluster({ content }: TopLeftClusterProps) {
  return (
    /* A row above the breakpoint, a column below it, on the 7px rhythm the
       chrome uses wherever it stacks. As a row the three items align on their
       baselines, not their box centres. */
    <p className="flex flex-col gap-[7px] font-mono text-label text-fg-1 text-shadow-glow-1 row:flex-row row:items-baseline row:gap-[14px]">
      <span>{content.productOne}</span>
      {/* A divider rather than a character in a sentence, which is why it is
          markedly dimmer than the names either side of it, and why it is
          drawn here rather than held in `src/content/`. Stacked there is no
          row left to divide, so it goes: a divider between two things sitting
          one above the other is not the same mark.

          It is the one mark in the chrome that does not emit, and it clears
          the inherited glow to stay that way. A halo on a divider makes it
          compete with the names it is there to separate. */}
      <span
        aria-hidden="true"
        className="hidden text-separator text-shadow-none row:block"
      >
        /
      </span>
      <span>{content.productTwo}</span>
    </p>
  );
}
