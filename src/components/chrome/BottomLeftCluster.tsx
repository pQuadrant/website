import type { ChromeBottomLeftContent } from "@/content/types";

/**
 * The bottom-left cluster: the core version and the transport line.
 *
 * Specified in `docs/design/chrome.md`. Both values are written rather than
 * measured, and nothing resolves them. Non-interactive.
 */
interface BottomLeftClusterProps {
  content: ChromeBottomLeftContent;
}

export function BottomLeftCluster({ content }: BottomLeftClusterProps) {
  return (
    <div className="flex gap-[40px] font-mono text-meta text-fg-3">
      <p>{content.coreVersion}</p>
      <p>{content.transport}</p>
    </div>
  );
}
