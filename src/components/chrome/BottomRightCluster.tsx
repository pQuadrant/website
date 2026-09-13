import { Clock } from "@/components/chrome/Clock";
import type { ChromeBottomRightContent } from "@/content/types";

/**
 * The bottom-right cluster: the server line, then the city and the time there.
 *
 * Specified in `docs/design/chrome.md`. Only the city name and the server line
 * are content; the time is resolved at runtime by `Clock`. Non-interactive.
 *
 * The server line arrived here from the top-left cluster. It is a static
 * display value like everything else in this half of the chrome, and it already
 * wore this half's colour while sitting among identity type.
 *
 * Laid out as the bottom-left cluster is — a row above the breakpoint on the
 * same 40px gap, a column below it on the same 7px rhythm — so the two ends of
 * the bottom edge read as one line of telemetry rather than two arrangements.
 * Right-aligned, because stacked against the right margin a ragged right edge
 * would leave the shorter line floating off the frame.
 */
interface BottomRightClusterProps {
  content: ChromeBottomRightContent;
}

export function BottomRightCluster({ content }: BottomRightClusterProps) {
  return (
    <div className="flex flex-col items-end gap-chrome-stack-gap text-right font-mono text-chrome-meta text-fg-3 text-shadow-glow-3 row:flex-row row:gap-chrome-meta-gap">
      <p>{content.server}</p>
      <p>
        {content.city} <Clock />
      </p>
    </div>
  );
}
