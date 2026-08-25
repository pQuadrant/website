import type { ChromeTopLeftContent } from "@/content/types";

/**
 * The top-left cluster: the product line above the server line.
 *
 * Specified in `docs/design/chrome.md`. Non-interactive — the stage's corner
 * region does not intercept pointer events, so clicks reach the motif beneath.
 */
interface TopLeftClusterProps {
  content: ChromeTopLeftContent;
}

export function TopLeftCluster({ content }: TopLeftClusterProps) {
  return (
    <div className="flex flex-col gap-[7px] font-mono">
      {/* A row above the breakpoint, a column below it, on the same 7px rhythm
          as the server line beneath. As a row the three items align on their
          baselines, not their box centres. */}
      <p className="flex flex-col gap-[7px] text-label text-fg-1 row:flex-row row:items-baseline row:gap-[14px]">
        <span>{content.productOne}</span>
        {/* A divider rather than a character in a sentence, which is why it is
            markedly dimmer than the names either side of it, and why it is
            drawn here rather than held in `src/content/`. Stacked there is no
            row left to divide, so it goes: a divider between two things sitting
            one above the other is not the same mark. */}
        <span aria-hidden="true" className="hidden text-separator row:block">
          /
        </span>
        <span>{content.productTwo}</span>
      </p>
      <p className="text-subhead text-fg-3">{content.server}</p>
    </div>
  );
}
