"use client";

import { type RefObject, useEffect, useState } from "react";

import { type ClearZone, expandToClearZone } from "@/lib/globe/state";

/**
 * Measures the panel and reports the rectangle the globe should dim behind it.
 *
 * This is the whole of the boundary between the two: whoever renders the panel
 * measures it and hands over four numbers. The globe does not look the panel up
 * by id, does not query the document for it, and imports nothing from it — see
 * the module contract in `docs/design/globe.md`.
 *
 * The zone is produced on open, cleared on close, and re-measured on resize,
 * where the panel moves because it is centred rather than because it changed
 * size. A new object is returned only when one of the four numbers actually
 * changes, so a resize drag does not push a fresh zone on every frame.
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

    // An arrow rather than a declaration: a hoisted function would be read as
    // callable before the null check above and lose the narrowing.
    const measure = (): void => {
      const next = expandToClearZone(element.getBoundingClientRect());
      setZone((current) => (matches(current, next) ? current : next));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref, open]);

  return zone;
}

function matches(current: ClearZone | null, next: ClearZone): boolean {
  return (
    current !== null &&
    current.x === next.x &&
    current.y === next.y &&
    current.width === next.width &&
    current.height === next.height
  );
}
