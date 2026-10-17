import type { ChromeTopRightContent } from "@/content/types";
import { STAR_CLEAR_ATTRIBUTE } from "@/lib/starfield/text-clearance";

/**
 * The top-right cluster: the platform link.
 *
 * Mapped under Corner chrome in `codebase-map/stage.md`. The only interactive part of the
 * chrome, so the link opts back into the pointer events that the stage's
 * corner region turns off.
 */
interface TopRightClusterProps {
  content: ChromeTopRightContent;
}

export function TopRightCluster({ content }: TopRightClusterProps) {
  return (
    // The row's height is the touch target, and the link stretches to it, so
    // 44px below the breakpoint sizes it without it carrying padding of its
    // own.
    <div className="flex h-chrome-touch items-stretch font-mono text-chrome-label row:h-chrome-control">
      {/* A real link, not a button: it leaves the page, so it has to open in a
          new tab on a modified click, a middle click or the context menu, and
          only an anchor with an `href` gets all of that from the browser. Same
          tab by default — no `target`.

          `flex items-center` is not a design change. A `<button>` centres its
          label vertically on its own; an anchor stretched to the row's height
          puts it at the top. This keeps the label vertically centred.

          The border is `fg-2`, and the body carries a faint white lift, so the
          only action on the page reads as an object rather than as a floating
          word.

          The focus ring is a `focus-visible:` treatment, so it appears for a
          keyboard and not on a click or a tap. It is deliberately outside the
          transition: a focus indicator that fades in is a focus indicator that
          is briefly not there. */}
      <a
        href={content.platformLink.href}
        {...{ [STAR_CLEAR_ATTRIBUTE]: "" }}
        className="pointer-events-auto flex items-center border border-fg-2 bg-control-fill px-chrome-control-pad text-fg-0 text-shadow-glow-0 transition-[color,border-color,text-shadow] duration-hover ease-[ease] hover:border-accent-bright hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:border-accent-bright active:text-fg-0 active:text-shadow-glow-0"
      >
        {content.platformLink.label}
      </a>
    </div>
  );
}
