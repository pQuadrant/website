import Link from "next/link";

import type { ChromeTopLeftContent } from "@/content/types";
import type { StageMode } from "@/lib/stage/mode";
import { STAR_CLEAR_ATTRIBUTE } from "@/lib/starfield/text-clearance";

/**
 * The top-left cluster: the wordmark, which is the way home, and from the row
 * breakpoint up a MARKETPLACE link beside it, lit while on the marketplace.
 * There is no HOME link: visitors expect the wordmark to lead home. Both are
 * real links, so the routes carry the state and the browser's Back button
 * works.
 *
 * Mapped under Corner chrome in `codebase-map/stage.md`.
 */
interface TopLeftClusterProps {
  content: ChromeTopLeftContent;
  mode: StageMode;
}

const LINK =
  "pointer-events-auto transition-[color,text-shadow] duration-hover hover:text-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0";

export function TopLeftCluster({ content, mode }: TopLeftClusterProps) {
  const { wordmark, marketplace } = content;

  return (
    <div className="flex h-chrome-touch items-center gap-chrome-product-gap font-mono text-chrome-label row:h-chrome-control">
      <Link
        href="/"
        aria-label={wordmark.accessibleLabel}
        {...{ [STAR_CLEAR_ATTRIBUTE]: "" }}
        className={`${LINK} font-sans text-[calc(17*var(--chrome-unit))] text-fg-0 text-shadow-glow-0`}
      >
        {wordmark.label}
      </Link>
      <span
        aria-hidden="true"
        className="hidden h-[60%] w-px bg-separator row:block"
      />
      <nav
        {...{ [STAR_CLEAR_ATTRIBUTE]: "" }}
        className="hidden items-center gap-chrome-product-gap row:flex"
      >
        <Link
          href="/marketplace"
          aria-current={mode === "market" ? "page" : undefined}
          className={`${LINK} ${mode === "market" ? "text-fg-0 text-shadow-glow-0" : "text-fg-1 text-shadow-glow-1"}`}
        >
          {marketplace}
        </Link>
      </nav>
    </div>
  );
}
