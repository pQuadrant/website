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
    /* A row above the breakpoint, a column below it, on the same 7px rhythm the
       top-left cluster stacks to. */
    <div className="flex flex-col gap-[7px] font-mono text-meta text-fg-3 row:flex-row row:gap-[40px]">
      <p>{content.coreVersion}</p>
      <p>{content.transport}</p>
    </div>
  );
}
