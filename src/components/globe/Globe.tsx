"use client";

import { useEffect, useRef } from "react";

import { type GlobeHandle, createGlobe } from "@/lib/globe/globe";
import type { ClearZone, GlobeStatus } from "@/lib/globe/state";
import { stageCentreY } from "@/lib/stage/centre";

/**
 * Owns the canvas the motif is drawn on, and nothing else.
 *
 * The globe itself is a plain module in `src/lib/`. This component's whole job
 * is to give it an element, tell it when that element's size changes, and shut
 * it down on unmount. It reads the point colours from the design tokens and
 * passes them in, because the module holds no colour values of its own.
 *
 * Nothing here re-renders the globe. Other elements on the page update on their
 * own schedules — the clock every second, the form on every keystroke — and none
 * of that may reach the render loop. A new clear zone re-renders this component
 * and calls one method; the canvas is not recreated and the loop never learns
 * that React ran.
 */
interface GlobeProps {
  /**
   * Where the panel sits and when it began to appear, or null when it is
   * closed. Four numbers and a time: the globe is told nothing else about it.
   */
  clearZone?: ClearZone | null;
  /**
   * The sign-in form's status. `error` is handed over once and the module
   * clears it by itself after its hold, so this prop can still read `error`
   * long after the motif has returned to idle. That is harmless: the next
   * attempt passes through `loading`, so a second failure is still a change.
   */
  status?: GlobeStatus;
  /** Whether a form field has focus. */
  focused?: boolean;
}

export function Globe({
  clearZone = null,
  status = "idle",
  focused = false,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<GlobeHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const styles = getComputedStyle(canvas);
    const globe = createGlobe(canvas, {
      colours: {
        land: styles.getPropertyValue("--color-land").trim(),
        ocean: styles.getPropertyValue("--color-ocean").trim(),
        highlight: styles.getPropertyValue("--color-highlight").trim(),
      },
      // Resolved per measure rather than captured here: the value is a viewport
      // unit, so it changes with the window and a number read once at mount
      // would be stale after the first rotation.
      centreY: (stageHeight) => stageCentreY(canvas, stageHeight),
    });

    globeRef.current = globe;

    const observer = new ResizeObserver(() => globe.resize());
    observer.observe(canvas);

    // Both halves matter: a fast refresh in development runs this cleanup and
    // then the effect again, and a globe that outlived it would leave a second
    // loop drawing to the same canvas.
    return () => {
      observer.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  // These run after the effect above on mount, so the handle is always there.
  useEffect(() => {
    globeRef.current?.setClearZone(clearZone);
  }, [clearZone]);

  useEffect(() => {
    globeRef.current?.setStatus(status);
  }, [status]);

  useEffect(() => {
    globeRef.current?.setFocused(focused);
  }, [focused]);

  return (
    /* Decorative: it carries nothing a screen reader can use.

       Sized to the large viewport rather than to 100%. A fixed element sized to
       the layout viewport is resized by a mobile browser retracting its address
       bar, which fires the ResizeObserver above and re-measures the globe part
       way through a scroll — and on a short window the page does scroll, by
       design. The large viewport is the one height that does not move during
       that transition, and being the largest it also covers the stage in both
       positions.

       The width is set rather than inferred from left and right offsets. A
       canvas is a replaced element, so an `auto` width resolves to its intrinsic
       size — the backing store — and the backing store is computed from the
       layout size, which is a loop that settles on the wrong number. */
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed top-0 left-0 h-lvh w-full"
    />
  );
}
