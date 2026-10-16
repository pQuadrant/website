"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { spikeContent } from "@/spike/content";
import { COMMIT_AT, DEAD_ZONE, RESISTANCE } from "@/spike/pull";

interface MarketplacePanelProps {
  mode: "home" | "market";
}

/**
 * SPIKE. The marketplace panel, with the pull-down-to-go-home gesture.
 *
 * The panel is a fixed box holding its own scroller, so the document never
 * scrolls and every layer stays pinned. A pull that starts with the scroller
 * already at its top drags the panel down with some resistance; past the commit
 * distance it navigates home, and the route transition plays in reverse.
 *
 * Only a *fresh* gesture counts: a flick that carries momentum up to the top
 * began while the scroller was not at the top, so it never becomes a pull.
 *
 * Part of the persistent stage, so it is mounted on home too, faded out and
 * inert. Entering, it rises in 350ms after the globe starts to move; leaving,
 * it clears in 100ms so the growing globe never passes under it. The pull
 * listens only in the marketplace and starts from rest on every visit.
 */

/** Wheel quiet time that starts a new gesture. */
const WHEEL_GAP_MS = 150;
/** Wheel quiet time after which an unfinished pull springs back. */
const WHEEL_REST_MS = 220;

export function MarketplacePanel({ mode }: MarketplacePanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const scroller = scrollerRef.current;
    if (panel === null || scroller === null || mode !== "market") return;

    let committed = false;

    const setPull = (pixels: number, settling: boolean) => {
      panel.dataset.settling = settling ? "true" : "false";
      panel.style.setProperty("--pull", `${pixels}px`);
    };

    // A pull that went home last time left the panel where the finger let go.
    setPull(0, false);

    const release = (pull: number) => {
      if (pull >= COMMIT_AT && !committed) {
        committed = true;
        router.push("/");
      } else if (!committed) {
        setPull(0, true);
      }
    };

    // Touch
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false;
    let touchPull = 0;

    const onTouchStart = (event: TouchEvent) => {
      tracking = event.touches.length === 1 && scroller.scrollTop <= 0;
      decided = false;
      touchPull = 0;
      startX = event.touches[0]?.clientX ?? 0;
      startY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || committed) return;
      const touch = event.touches[0];
      if (touch === undefined) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!decided) {
        if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
        // Sideways (a row), upward (ordinary scrolling) or already scrolled:
        // not ours, and the browser keeps the gesture.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0 || scroller.scrollTop > 0) {
          tracking = false;
          return;
        }
        decided = true;
      }

      event.preventDefault();
      touchPull = Math.max(0, dy) * RESISTANCE;
      setPull(touchPull, false);
    };

    const onTouchEnd = () => {
      const was = tracking && decided;
      tracking = false;
      if (was) release(touchPull);
    };

    // Wheel and trackpad
    let lastWheel = 0;
    let fresh = false;
    let travel = 0;
    let rest: ReturnType<typeof setTimeout> | undefined;

    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel > WHEEL_GAP_MS) {
        fresh = scroller.scrollTop <= 0;
        travel = 0;
      }
      lastWheel = now;

      if (
        !fresh ||
        committed ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      if (scroller.scrollTop > 0) {
        fresh = false;
        return;
      }
      if (event.deltaY >= 0) {
        if (travel > 0) {
          travel = 0;
          setPull(0, true);
        }
        return;
      }

      event.preventDefault();
      travel += -event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      const pull = travel * RESISTANCE;
      setPull(pull, false);

      clearTimeout(rest);
      if (pull >= COMMIT_AT) {
        release(pull);
        return;
      }
      rest = setTimeout(() => {
        travel = 0;
        setPull(0, true);
      }, WHEEL_REST_MS);
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", onTouchEnd, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      clearTimeout(rest);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [mode, router]);

  const { panel } = spikeContent;

  return (
    <div
      data-mode={mode}
      inert={mode === "home"}
      className="fixed right-0 bottom-0 left-[var(--mk-panel-left)] top-[var(--mk-content-top)] [transition:opacity_800ms_cubic-bezier(0.2,0.7,0.2,1)_350ms,transform_800ms_cubic-bezier(0.2,0.7,0.2,1)_350ms,visibility_0s_linear_350ms] data-[mode=home]:invisible data-[mode=home]:[transform:translateY(24px)] data-[mode=home]:opacity-0 data-[mode=home]:[transition:opacity_100ms_ease-out,transform_100ms_ease-out,visibility_0s_linear_100ms] motion-reduce:transition-none!"
    >
      <div
        ref={panelRef}
        data-settling="false"
        className="h-full translate-y-[var(--pull,0px)] data-[settling=true]:transition-transform data-[settling=true]:duration-300 data-[settling=true]:ease-[cubic-bezier(0.2,0.7,0.2,1)]"
      >
        {/* Its own scroller. No scrollbar, and the top 28px fades so rows
          disappear softly under the globe. `overscroll-contain` keeps a pull
          from chaining to the document, which is what would otherwise start the
          browser's pull-to-refresh at the same moment as ours. */}
        <div
          ref={scrollerRef}
          role="region"
          aria-label={panel.regionLabel}
          tabIndex={0}
          className="h-full overflow-y-auto overscroll-contain pt-7 pr-[var(--mk-inset-right)] pb-[calc(48px+env(safe-area-inset-bottom))] pl-[var(--mk-panel-pad)] [mask-image:linear-gradient(to_bottom,transparent,black_28px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <input
            type="search"
            placeholder={panel.searchPlaceholder}
            className="h-chrome-touch w-full max-w-[360px] border border-fg-2 bg-control-fill px-chrome-control-pad font-mono text-chrome-label text-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden pointer-coarse:text-[16px]"
          />
          {panel.rows.map((row) => (
            <section key={row} className="mt-8">
              <h3 className="font-mono text-chrome-label text-fg-1 text-shadow-glow-1">
                {row}
              </h3>
              <div className="mt-3 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="flex h-[calc(120*var(--chrome-unit))] w-[calc(200*var(--chrome-unit))] shrink-0 items-end border border-fg-2 bg-control-fill p-3 font-mono text-chrome-label text-fg-1"
                  >
                    {panel.cardLabel} {index + 1}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
