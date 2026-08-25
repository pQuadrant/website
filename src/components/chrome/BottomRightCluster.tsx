import { Clock } from "@/components/chrome/Clock";
import type { ChromeBottomRightContent } from "@/content/types";

/**
 * The bottom-right cluster: the city, then the time there.
 *
 * Specified in `docs/design/chrome.md`. Only the city name is content; the time
 * is resolved at runtime by `Clock`. Non-interactive.
 */
interface BottomRightClusterProps {
  content: ChromeBottomRightContent;
}

export function BottomRightCluster({ content }: BottomRightClusterProps) {
  return (
    <p className="font-mono text-meta text-fg-3">
      {content.city} <Clock />
    </p>
  );
}
