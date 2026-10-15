"use client";

import { useEffect, useRef } from "react";

import { createGlobe } from "@/lib/globe/globe";
import { stageCentreY } from "@/lib/stage/centre";

/**
 * Owns the canvas the motif is drawn on, and nothing else.
 *
 * The globe itself is a plain module in `src/lib/`. This component's whole job
 * is to give it an element, tell it when that element's size changes, and shut
 * it down on unmount. It reads the point colours from the design tokens and
 * passes them in, because the module holds no colour values of its own.
 *
 * Nothing here re-renders the globe. It takes no props, so nothing else on the
 * page that re-renders can reach the render loop.
 */
export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const observer = new ResizeObserver(() => globe.resize());
    observer.observe(canvas);

    // Both halves matter: a fast refresh in development runs this cleanup and
    // then the effect again, and a globe that outlived it would leave a second
    // loop drawing to the same canvas.
    return () => {
      observer.disconnect();
      globe.destroy();
    };
  }, []);

  return (
    /* Decorative: it carries nothing a screen reader can use.

       Sized to the large viewport rather than to 100%. A fixed element sized to
       the layout viewport is resized by a mobile browser retracting its address
       bar, which fires the ResizeObserver above and re-measures the globe every
       time the toolbar moves. The large viewport is the one height that does
       not move during that transition, and being the largest it also covers
       the stage in both positions.

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
