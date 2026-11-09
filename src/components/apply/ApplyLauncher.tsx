"use client";

import { useEffect, useRef, useState } from "react";

import { PRIMARY_ACTION } from "@/components/apply/action-styles";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import type { ApplyContent } from "@/content/types";
import { focusStart } from "@/lib/apply/focus";
import { currentApplication, type OpenApplication } from "@/lib/apply/platform";
import { loadTurnstile } from "@/lib/apply/turnstile";
import {
  STAR_CLEAR_ATTRIBUTE,
  STAR_CLEAR_BOX_ATTRIBUTE,
} from "@/lib/starfield/text-clearance";

/**
 * APPLY NOW, and the panel it opens, mapped under Apply flow in
 * `codebase-map/apply.md`.
 *
 * The panel drops from under the top-right corner rather than taking over the
 * page: the page stays visible behind a light backdrop, and nothing navigates
 * when it opens or closes. It closes on a backdrop click, on APPLY NOW again
 * and on Esc (handled with the route's Esc in `StageShell`, which owns `open`).
 *
 * Everything here renders inside the top-right corner region. The backdrop and
 * the panel are `fixed`, so they leave the region's box — which the globe
 * measures — exactly as it was, and they share the region's place at the top
 * of the stage. The two controls in the corner are lifted above the backdrop so
 * they stay usable while it is open; everything else on the stage is made
 * `inert` by `StageShell`, so a keyboard cannot wander behind the panel.
 *
 * Both stay mounted while closed, faded out, invisible and inert, so the form
 * keeps what was typed. Opening and closing are transitions, so a click part
 * way through reverses from wherever the panel is.
 *
 * On load it asks the platform whether this device has an application open.
 * If so, the button reads YOUR APPLICATION and the panel opens on it; the
 * button reads APPLY NOW until the answer arrives, and if none comes.
 */

interface ApplyLauncherProps {
  content: ApplyContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PANEL_ID = "apply-panel";

export function ApplyLauncher({
  content,
  open,
  onOpenChange,
}: ApplyLauncherProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [applicant, setApplicant] = useState<OpenApplication | null>(null);

  useEffect(() => {
    let current = true;
    void currentApplication().then((result) => {
      if (current && result.ok) setApplicant(result.data);
    });
    return () => {
      current = false;
    };
  }, []);

  // Opening puts focus on the first thing to fill in, or on a touch screen on
  // the title, so no keyboard opens by itself (`focusStart`). Closing hands it back to
  // APPLY NOW when it was in the panel, or nowhere after a backdrop click, so
  // the keyboard picks up where the visitor left off.
  useEffect(() => {
    const panel = panelRef.current;
    if (panel === null) return;
    if (open) {
      // Cloudflare's script loads the first time the panel opens, ready for
      // the first check.
      void loadTurnstile();
      focusStart(panel);
    } else if (wasOpen.current) {
      const focused = document.activeElement;
      if (focused === document.body || panel.contains(focused)) {
        triggerRef.current?.focus();
      }
    }
    wasOpen.current = open;
  }, [open]);

  const close = () => onOpenChange(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-haspopup="dialog"
        onClick={() => onOpenChange(!open)}
        {...{ [STAR_CLEAR_ATTRIBUTE]: "", [STAR_CLEAR_BOX_ATTRIBUTE]: "" }}
        className={`${PRIMARY_ACTION} pointer-events-auto relative z-20 narrowest:px-2 narrowest:tracking-[0.08em]`}
      >
        {applicant === null ? (
          content.trigger
        ) : (
          <>
            {/* The long label runs into the wordmark on a phone held upright
                (measured: 27px of overlap at 390 wide), so the corner uses the
                short one until the chrome is a row. Its tracking tightens below
                380 wide, where the other controls tighten too, which keeps it
                at least 10px clear of the wordmark at 320. */}
            <span className="tracking-[0.08em] narrowest:tracking-normal row:hidden">
              {content.yourApplication.short}
            </span>
            <span className="hidden row:inline">
              {content.yourApplication.long}
            </span>
          </>
        )}
      </button>

      <div
        aria-hidden="true"
        data-open={open ? "" : undefined}
        onClick={close}
        className="pointer-events-auto invisible fixed inset-0 z-0 bg-backdrop opacity-0 [transition:opacity_280ms_ease-in,visibility_0s_linear_280ms] data-open:visible data-open:opacity-100 data-open:[transition:opacity_280ms_ease-out,visibility_0s] motion-reduce:transition-none!"
      />

      {/* Under the bar, on the same right margin as the buttons, and no wider
          than the window allows. It scrolls only when a short window leaves it
          no room; the scrollbar stays hidden. The type is reset because the
          corner's row is set in the chrome's mono label style, and so is the
          unit: the corner is on the nav's scale, and the panel is page content
          on the page's. Its width and padding follow the nav instead
          (`--apply-panel-width` in `globals.css`). */}
      <div
        ref={panelRef}
        id={PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        data-open={open ? "" : undefined}
        inert={!open}
        className="pointer-events-auto invisible fixed top-[calc(var(--chrome-bar-bottom)+14px)] [--chrome-unit:var(--content-unit)] cramped:top-[calc(var(--chrome-bar-bottom)+10px)] right-[var(--stage-inset-right)] z-10 max-h-[calc(100svh-var(--chrome-bar-bottom)-28px)] cramped:max-h-[calc(100svh-var(--chrome-bar-bottom)-20px)] w-[min(var(--apply-panel-width),calc(100vw-var(--stage-inset-left)-var(--stage-inset-right)))] origin-top-right -translate-y-2.5 scale-[0.98] overflow-y-auto overscroll-contain border border-hairline bg-panel p-4 font-sans tracking-normal opacity-0 [scrollbar-width:none] [transition:opacity_260ms_cubic-bezier(0.4,0,1,1),translate_260ms_cubic-bezier(0.4,0,1,1),scale_260ms_cubic-bezier(0.4,0,1,1),visibility_0s_linear_260ms] stage-narrow:p-(--apply-panel-pad) cramped:py-3 data-open:visible data-open:translate-y-0 data-open:scale-100 data-open:opacity-100 data-open:[transition:opacity_320ms_cubic-bezier(0.2,0.7,0.2,1),translate_320ms_cubic-bezier(0.2,0.7,0.2,1),scale_320ms_cubic-bezier(0.2,0.7,0.2,1),visibility_0s] motion-reduce:transition-none! [&::-webkit-scrollbar]:hidden"
      >
        <ApplyFlow
          content={content}
          onClose={close}
          applicant={applicant}
          onApplicantChange={setApplicant}
        />
      </div>
    </>
  );
}
