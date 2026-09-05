"use client";

import { useEffect, useRef } from "react";

import { motifRadius } from "@/lib/globe/projection";
import { drawStarfield } from "@/lib/starfield/draw";
import { createStarfield } from "@/lib/starfield/starfield-points";

/**
 * Owns the canvas the starfield is drawn on, and nothing else.
 *
 * The field is specified in `docs/design/starfield.md`; where it sits in the
 * layer stack is in `docs/design/home.md`. Generation is a pure module in
 * `src/lib/starfield/`, and this component's whole job is to give it an
 * element, a size, and a redraw when that size changes.
 *
 * **Nothing runs once the draw returns.** There is no animation frame loop, no
 * timer and no per-frame listener: the field does not move, and the page is
 * expected to sit open on a second monitor for hours. That is a requirement of
 * the specification, not an optimisation, and it is the one thing to preserve
 * if this file is edited.
 */

/**
 * Ceiling on the canvas backing store, as a multiple of the layout size.
 *
 * Without any scaling the stars render as fuzzy squares on a retina display.
 * Above 2 the extra pixels are not visible on a dot this small and the memory
 * is spent for nothing.
 */
const MAX_PIXEL_RATIO = 2;

/**
 * How long the stage has to hold still before the field is rebuilt.
 *
 * A drag of a window edge fires continuously, and regenerating a field of up to
 * 900 stars on every one of those would be work nobody sees.
 */
const RESIZE_DEBOUNCE_MS = 150;

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const context = canvas.getContext("2d");
    if (context === null) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let drawnWidth = 0;
    let drawnHeight = 0;

    /**
     * Regenerates the field at the canvas's current size and paints it.
     *
     * The field is rebuilt rather than the existing canvas being scaled: a
     * scaled starfield has visibly oval stars. It jumping to a new arrangement
     * on resize is expected, and is not animated between.
     */
    // An arrow function rather than a declaration: a function declaration is
    // hoisted above the null checks above, so TypeScript discards their
    // narrowing inside it and `canvas` and `context` read as nullable again.
    const draw = (): void => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) return;
      // The ResizeObserver fires once when it starts observing, and a mobile
      // browser retracting its address bar can fire it again at an unchanged
      // size. Neither is a reason to redraw.
      if (width === drawnWidth && height === drawnHeight) return;

      drawnWidth = width;
      drawnHeight = height;

      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      // Draw in CSS pixels; the backing store scale is the context's problem.
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // The falloff is defined against the motif radius, so it is read from the
      // motif's own module rather than a second copy of the formula living here.
      const stars = createStarfield(width, height, motifRadius(width, height));
      drawStarfield(context, stars, width, height);
    };

    draw();

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    /* Decorative: it carries nothing a screen reader can use, and it must never
       take a click meant for the motif or the chrome below it.

       Sized like the motif canvas, and for the same reasons: the large viewport
       height, so a mobile browser retracting its address bar does not resize it
       part way through a scroll, and an explicit width, because a canvas is a
       replaced element whose `auto` width resolves to its own backing store. */
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 h-lvh w-full"
    />
  );
}
