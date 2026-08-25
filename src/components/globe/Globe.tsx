"use client";

import { useEffect, useRef } from "react";

import { createGlobe } from "@/lib/globe/globe";

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
 * of that may reach the render loop.
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
      },
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
    /* Decorative: it carries nothing a screen reader can use. */
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 size-full"
    />
  );
}
