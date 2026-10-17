"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DEAD_ZONE } from "@/lib/stage/route-gesture";

/** Finger travel upward, in pixels, that opens the marketplace on release. */
const SWIPE_DISTANCE = 60;
/** A shorter swipe still counts if it is a flick at least this fast, in px/ms. */
const FLICK_SPEED = 0.5;
/** The shortest flick that counts, so a tap that slips does not navigate. */
const FLICK_DISTANCE = 24;

interface HomeSwipeProps {
  /** Listening only on home; the marketplace has its own pull. */
  active: boolean;
}

/**
 * Swipe up anywhere on home to open the marketplace.
 *
 * Nothing on the page moves with the finger. The stage is anchored, and a copy
 * that lifted with the swipe slid over the globe; the gesture is read, not
 * shown, and the route transition is the response. A long enough swipe or a
 * quick flick, released, navigates; anything else does nothing.
 *
 * Touch only. A wheel or trackpad scroll on a desktop is too easily an
 * accident, and there the HOME / MARKETPLACE switch is always in view.
 */
export function HomeSwipe({ active }: HomeSwipeProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let travel = 0;
    let tracking = false;
    let decided = false;
    let committed = false;

    const onTouchStart = (event: TouchEvent) => {
      tracking = event.touches.length === 1 && !committed;
      decided = false;
      travel = 0;
      startX = event.touches[0]?.clientX ?? 0;
      startY = event.touches[0]?.clientY ?? 0;
      startTime = event.timeStamp;
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

      // Ours: keep the browser from bouncing the page under the finger.
      event.preventDefault();
      travel = dy;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const was = tracking && decided;
      tracking = false;
      if (!was) return;

      const speed = travel / Math.max(1, event.timeStamp - startTime);
      const swiped =
        travel >= SWIPE_DISTANCE ||
        (travel >= FLICK_DISTANCE && speed >= FLICK_SPEED);
      if (swiped) {
        committed = true;
        router.push("/marketplace");
      }
    };

    const onTouchCancel = () => {
      tracking = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [active, router]);

  return null;
}
