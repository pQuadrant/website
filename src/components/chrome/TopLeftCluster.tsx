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
      {/* The three items align on their baselines, not their box centres. */}
      <p className="flex items-baseline gap-[14px] text-label text-fg-1">
        <span>{content.productOne}</span>
        {/* A divider rather than a character in a sentence, which is why it is
            markedly dimmer than the names either side of it, and why it is
            drawn here rather than held in `src/content/`. */}
        <span aria-hidden="true" className="text-separator">
          /
        </span>
        <span>{content.productTwo}</span>
      </p>
      <p className="text-subhead text-fg-3">{content.server}</p>
    </div>
  );
}
