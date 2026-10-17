import { ApplyLauncher } from "@/components/apply/ApplyLauncher";
import type { ApplyContent, ChromeTopRightContent } from "@/content/types";
import { STAR_CLEAR_ATTRIBUTE } from "@/lib/starfield/text-clearance";

/**
 * The top-right cluster: the platform link, then APPLY NOW and the panel it
 * opens.
 *
 * Mapped under Corner chrome in `codebase-map/stage.md`. Its controls opt back
 * into the pointer events that the stage's corner region turns off.
 */
interface TopRightClusterProps {
  content: ChromeTopRightContent;
  apply: ApplyContent;
  applyOpen: boolean;
  onApplyOpenChange: (open: boolean) => void;
}

export function TopRightCluster({
  content,
  apply,
  applyOpen,
  onApplyOpenChange,
}: TopRightClusterProps) {
  return (
    // The row's height is the touch target, and both controls stretch to it,
    // so 44px below the breakpoint sizes them without padding of their own.
    // On the narrowest phones the labels' tracking and padding tighten so the
    // two controls still fit beside the wordmark.
    <div className="flex h-chrome-touch items-stretch gap-[10px] font-mono text-chrome-label narrowest:gap-1.5 narrowest:tracking-[0.08em] row:h-chrome-control row:gap-[calc(18*var(--chrome-unit))]">
      {/* A real link, not a button: it leaves the page, so it has to open in a
          new tab on a modified click, a middle click or the context menu, and
          only an anchor with an `href` gets all of that from the browser. Same
          tab by default — no `target`.

          `flex items-center` is not a design change. A `<button>` centres its
          label vertically on its own; an anchor stretched to the row's height
          puts it at the top. This keeps the label vertically centred.

          The border is `fg-2`, and the body carries a faint white lift, so the
          link reads as an object rather than as a floating word. `relative z-20`
          keeps it above the apply backdrop, so it stays usable while the panel
          is open.

          The focus ring is a `focus-visible:` treatment, so it appears for a
          keyboard and not on a click or a tap. It is deliberately outside the
          transition: a focus indicator that fades in is a focus indicator that
          is briefly not there. */}
      <a
        href={content.platformLink.href}
        {...{ [STAR_CLEAR_ATTRIBUTE]: "" }}
        className="pointer-events-auto relative z-20 flex items-center border border-fg-2 bg-control-fill px-chrome-control-pad narrowest:px-2 text-fg-0 text-shadow-glow-0 transition-[color,border-color,text-shadow] duration-hover ease-[ease] hover:border-accent-bright hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:border-accent-bright active:text-fg-0 active:text-shadow-glow-0"
      >
        {content.platformLink.label}
      </a>
      <ApplyLauncher
        content={apply}
        open={applyOpen}
        onOpenChange={onApplyOpenChange}
      />
    </div>
  );
}
