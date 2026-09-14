"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

import { panelMeetsChrome } from "@/lib/stage/chrome-clearance";

/**
 * Whether the corner chrome should recede: the panel is open and would come
 * within 24px of a corner cluster.
 *
 * Measured before paint, so the first frame of the panel already has the
 * chrome on its way out rather than a frame of the two overlapping. Re-measured
 * when the window resizes — which is also what a rotation is — and when the
 * panel's own box changes, since its footer can wrap. Not on scroll: the
 * measurement already covers every scroll position.
 *
 * Closing answers false on the same render, so the toggle is visible again by
 * the time focus is returned to it.
 */
export function useChromeRecede(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
): boolean {
  const [meets, setMeets] = useState(false);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!open || panel === null) return;

    const measure = (): void => setMeets(panelMeetsChrome(panel));

    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(panel);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
      setMeets(false);
    };
  }, [ref, open]);

  return open && meets;
}
