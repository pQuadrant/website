"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { COMMIT_AT, DEAD_ZONE, RESISTANCE } from "@/spike/pull";

/**
 * SPIKE. Swipe up anywhere on home to open the marketplace: the mirror of the
 * pull down that closes it, with the same resistance and commit distance.
 *
 * Touch only. A wheel or trackpad scroll on a desktop is too easily an
 * accident, and there the HOME / MARKETPLACE switch is always in view.
 *
 * The document never scrolls; this reads the finger and moves the home copy
 * itself. It writes the travel to `--home-pull` on the root, and the Browse
 * hint and the tagline lift by it. `data-home-pull` on the root is `drag`
 * while the finger is down, so they track it without easing, and `settle`
 * while they spring back.
 */
export function HomeSwipe() {
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false;
    let pull = 0;
    let committed = false;

    const setPull = (pixels: number, phase: "drag" | "settle") => {
      root.dataset.homePull = phase;
      root.style.setProperty("--home-pull", `${pixels}px`);
    };

    const onTouchStart = (event: TouchEvent) => {
      tracking = event.touches.length === 1 && !committed;
      decided = false;
      pull = 0;
      startX = event.touches[0]?.clientX ?? 0;
      startY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      if (touch === undefined) return;
      const dx = touch.clientX - startX;
      const dy = startY - touch.clientY;

      if (!decided) {
        if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
        // Sideways or downward: not ours.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          tracking = false;
          return;
        }
        decided = true;
      }

      event.preventDefault();
      pull = Math.max(0, dy) * RESISTANCE;
      setPull(pull, "drag");
    };

    const onTouchEnd = () => {
      const was = tracking && decided;
      tracking = false;
      if (!was) return;
      if (pull >= COMMIT_AT) {
        committed = true;
        router.push("/marketplace");
      }
      // Either way the copy settles back: on a commit it is fading out as the
      // marketplace arrives, and it must be in place when the visitor returns.
      setPull(0, "settle");
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      // The pull is left as it is: already settling to zero, and the copy is
      // still on screen fading out, so removing it would snap it back.
    };
  }, [router]);

  return null;
}
