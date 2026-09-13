"use client";

import { useEffect, useRef } from "react";

import { motifRadius } from "@/lib/globe/projection";
import { chromeClearance } from "@/lib/stage/chrome-clearance";
import { drawAmbient, drawStars } from "@/lib/starfield/draw";
import { createPointerResponse } from "@/lib/starfield/pointer-response";
import { createStarfield } from "@/lib/starfield/starfield-points";
import { stageCentreY } from "@/lib/stage/centre";

/**
 * Owns the canvas the starfield is drawn on, and nothing else.
 *
 * The field is specified in `docs/design/starfield.md`; where it sits in the
 * layer stack is in `docs/design/home.md`. Generation and the pointer response
 * are pure modules in `src/lib/starfield/`, and this component's whole job is
 * to give them an element, a size, and a regenerated field when that size
 * changes.
 *
 * **Nothing runs until the pointer moves.** The field is static: the only
 * motion on this page is the drag, and its loop is started by a pointer event
 * and cancelled again once the field has settled — see `pointer-response.ts`,
 * which owns it. A page nobody is touching runs nothing, which is a requirement
 * of the specification rather than an optimisation, and it is the thing to
 * preserve if this file is edited.
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
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ambientCanvas = ambientRef.current;
    const starsCanvas = starsRef.current;
    if (ambientCanvas === null || starsCanvas === null) return;

    const ambient = ambientCanvas.getContext("2d");
    const field = starsCanvas.getContext("2d");
    if (ambient === null || field === null) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let drawnWidth = 0;
    let drawnHeight = 0;

    // Created before the first draw, so no pointer event can arrive while the
    // canvas has a field on it that nothing is holding the homes of.
    const response = createPointerResponse(starsCanvas, field);

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
      const width = starsCanvas.clientWidth;
      const height = starsCanvas.clientHeight;

      if (width === 0 || height === 0) return;
      // The ResizeObserver fires once when it starts observing, and a mobile
      // browser retracting its address bar can fire it again at an unchanged
      // size. Neither is a reason to redraw.
      if (width === drawnWidth && height === drawnHeight) return;

      drawnWidth = width;
      drawnHeight = height;

      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      for (const canvas of [ambientCanvas, starsCanvas]) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }

      // Draw in CSS pixels; the backing store scale is the context's problem.
      ambient.setTransform(ratio, 0, 0, ratio, 0, 0);
      field.setTransform(ratio, 0, 0, ratio, 0, 0);

      // The same centre the motif draws on, from the same declaration. If these
      // two ever diverge the ambient hole stops sitting over the sphere and its
      // ramp lands on the rim as a halo — see the Motif centring section of
      // `docs/design/home.md`.
      const centreY = stageCentreY(starsCanvas, height);

      // The falloff is defined against the motif radius, so it is read from the
      // motif's own module rather than a second copy of the formula living here.
      //
      // Every argument has to match what the motif passes, not just the
      // function. The radius rule reads the *visible* height and the room the
      // corner chrome leaves, and this canvas is `lvh` like the motif's — so
      // `height` is the wrong number here for exactly the reason it is the wrong
      // number there. Hand it the same two terms and the ambient hole keeps
      // sitting over the sphere; hand it `height` and the ramp lands on the rim
      // as a halo welded to it, which is the failure the tonal-range work was
      // done to remove.
      const radius = motifRadius(
        width,
        centreY * 2,
        chromeClearance(starsCanvas, width / 2, centreY),
      );
      const stars = createStarfield(width, height, radius, centreY);

      drawAmbient(ambient, width, height, radius, centreY);
      drawStars(field, stars, width, height);

      // Handed the field as generated, which is to say at rest: these positions
      // are the homes every star is drifted back to and snapped to.
      response.setField(stars, width, height);
    };

    draw();

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(starsCanvas);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      // Both halves matter: a fast refresh in development runs this cleanup and
      // then the effect again, and a response that outlived it would leave a
      // second loop and a second pointer listener on the same canvas.
      response.destroy();
    };
  }, []);

  return (
    /* Two canvases, not one, and the order of them is the layer order: the
       ambient light is the still dark space, the stars move in front of it.

       They are split because only one of them animates. The pointer response
       erases part of its canvas every frame to leave a smear behind a moving
       star, and the ambient light must be nowhere near that — it is the
       background, it never moves, and a background repainted sixty times a
       second is both wasted work and a whole surface exposed to rounding. Kept
       apart, it is drawn once per size and then physically cannot move.

       Both are decorative: they carry nothing a screen reader can use, and
       neither may take a click meant for the motif or the chrome below.

       Sized like the motif canvas, and for the same reasons: the large viewport
       height, so a mobile browser retracting its address bar does not resize it
       part way through a scroll, and an explicit width, because a canvas is a
       replaced element whose `auto` width resolves to its own backing store.

       Both fade up over the first 400ms of the page, together, as one layer:
       the ambient light is the space the stars are in, and a field arriving
       before the space it sits in reads as two things rather than one. That
       fade is the first phase of the page's entrance — see the Entrance section
       of `docs/design/globe.md`, which owns the whole sequence. Under reduced
       motion there is no fade and the field is simply there. */
    <>
      <canvas
        ref={ambientRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-lvh w-full animate-stars-in motion-reduce:animate-none"
      />
      <canvas
        ref={starsRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-lvh w-full animate-stars-in motion-reduce:animate-none"
      />
    </>
  );
}
