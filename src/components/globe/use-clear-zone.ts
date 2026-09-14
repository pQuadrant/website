"use client";

import { type RefObject, useEffect, useState } from "react";

import { type ClearZone, expandToClearZone } from "@/lib/globe/state";

/**
 * Measures the panel and reports the rectangle the globe should dim behind it.
 *
 * This is the whole of the boundary between the two: whoever renders the panel
 * measures it and hands over four numbers, plus the moment the panel's fade
 * began. The globe does not look the panel up by id, does not query the
 * document for it, and imports nothing from it — see the module contract in
 * `docs/design/globe.md`.
 *
 * The zone is produced on open, cleared on close, and re-measured whenever the
 * panel can have moved: on resize, where it moves because it is centred; on
 * scroll, where the page carries it past the fixed canvas on a window too short
 * to hold it; and when its own box changes, as it does when it swaps
 * composition or its footer wraps. A new object is returned only when one of
 * the numbers actually changes, so a resize drag does not push a fresh zone on
 * every frame.
 *
 * The start time is the panel's appearance animation's own, read from the
 * browser once the animation is ready. A CSS animation is held for a frame or
 * two before it starts, so stamping the fade when the zone arrived ran it ahead
 * of the panel. With no animation — reduced motion — the panel is already fully
 * there, so the start is now and the globe paints the zone at full strength.
 */
export function useClearZone(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
): ClearZone | null {
  const [zone, setZone] = useState<ClearZone | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!open || element === null) {
      setZone(null);
      return;
    }

    let since: number | null = null;
    let cancelled = false;

    // An arrow rather than a declaration: a hoisted function would be read as
    // callable before the null check above and lose the narrowing.
    const measure = (): void => {
      const next = expandToClearZone(element.getBoundingClientRect(), since);
      setZone((current) => (matches(current, next) ? current : next));
    };

    const appearance = element.getAnimations()[0];
    if (appearance === undefined) {
      since = performance.now();
    } else {
      appearance.ready
        .then((animation) => {
          if (cancelled) return;
          since =
            typeof animation.startTime === "number"
              ? animation.startTime
              : performance.now();
          measure();
        })
        // Cancelled by the panel closing first; there is nothing to fade.
        .catch(() => {});
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [ref, open]);

  return zone;
}

function matches(current: ClearZone | null, next: ClearZone): boolean {
  return (
    current !== null &&
    current.x === next.x &&
    current.y === next.y &&
    current.width === next.width &&
    current.height === next.height &&
    current.since === next.since
  );
}
