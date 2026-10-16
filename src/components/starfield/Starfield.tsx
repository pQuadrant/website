"use client";

import { useEffect, useRef } from "react";

import { motifRadius } from "@/lib/globe/projection";
import { chromeClearance } from "@/lib/stage/chrome-clearance";
import { drawAmbient, drawStars } from "@/lib/starfield/draw";
import {
  createPointerResponse,
  type PointerResponseHandle,
} from "@/lib/starfield/pointer-response";
import { ROUTE_MIX_MS, routeEase } from "@/lib/starfield/route-mix";
import {
  createStarfield,
  type FieldLayout,
  type StageMode,
} from "@/lib/starfield/starfield-points";
import {
  clearElements,
  measureClearRects,
} from "@/lib/starfield/text-clearance";
import { stageCentreY } from "@/lib/stage/centre";

/**
 * Owns the canvas the starfield is drawn on, and nothing else.
 *
 * The field is specified in `docs/design/starfield.md`; where it sits in the
 * layer stack is in `docs/design/home.md`. Generation and the pointer response
 * are pure modules in `src/lib/starfield/`, and this component's whole job is
 * to give them an element, a size, the globe and type each route keeps clear
 * of, a regenerated field when any of those changes, and the crossfade between
 * the routes' skies.
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

/**
 * Where the small globe sits in the marketplace, and its radius.
 *
 * CSS decides it — `--mk-globe-x`, `--mk-globe-y` and `--mk-r` in
 * `globals.css` — and the motif is moved there by a transform, so it is read
 * from the same properties rather than from the motif's canvas, whose box the
 * transform would distort.
 */
function marketGlobe(): Omit<FieldLayout, "clear"> {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) =>
    Number.parseFloat(style.getPropertyValue(name)) || 0;
  return {
    centreX: read("--mk-globe-x"),
    centreY: read("--mk-globe-y"),
    radius: read("--mk-r"),
  };
}

interface StarfieldProps {
  mode: StageMode;
}

export function Starfield({ mode }: StarfieldProps) {
  const homeAmbientRef = useRef<HTMLCanvasElement>(null);
  const marketAmbientRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const responseRef = useRef<PointerResponseHandle | null>(null);
  /** Where the crossfade stands: 0 is home's sky, 1 the marketplace's. */
  const mixRef = useRef(mode === "market" ? 1 : 0);

  useEffect(() => {
    const homeAmbientCanvas = homeAmbientRef.current;
    const marketAmbientCanvas = marketAmbientRef.current;
    const starsCanvas = starsRef.current;
    if (
      homeAmbientCanvas === null ||
      marketAmbientCanvas === null ||
      starsCanvas === null
    ) {
      return;
    }

    const homeAmbient = homeAmbientCanvas.getContext("2d");
    const marketAmbient = marketAmbientCanvas.getContext("2d");
    const field = starsCanvas.getContext("2d");
    if (homeAmbient === null || marketAmbient === null || field === null) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let drawnWidth = 0;
    let drawnHeight = 0;
    let drawnClear = "";

    // Created before the first draw, so no pointer event can arrive while the
    // canvas has a field on it that nothing is holding the homes of.
    const response = createPointerResponse(starsCanvas, field);
    responseRef.current = response;

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

      const homeClear = measureClearRects("home");
      const marketClear = measureClearRects("market");
      const small = marketGlobe();
      const clearKey = JSON.stringify([homeClear, marketClear, small]);

      // The ResizeObserver fires once when it starts observing, and a mobile
      // browser retracting its address bar can fire it again at an unchanged
      // size. Neither is a reason to redraw.
      if (
        width === drawnWidth &&
        height === drawnHeight &&
        clearKey === drawnClear
      ) {
        return;
      }

      drawnWidth = width;
      drawnHeight = height;
      drawnClear = clearKey;

      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      for (const canvas of [
        homeAmbientCanvas,
        marketAmbientCanvas,
        starsCanvas,
      ]) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }

      // Draw in CSS pixels; the backing store scale is the context's problem.
      homeAmbient.setTransform(ratio, 0, 0, ratio, 0, 0);
      marketAmbient.setTransform(ratio, 0, 0, ratio, 0, 0);
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
        chromeClearance(width / 2, centreY),
      );
      const stars = createStarfield(
        width,
        height,
        { centreX: width / 2, centreY, radius, clear: homeClear },
        { ...small, clear: marketClear },
      );

      drawAmbient(homeAmbient, width, height, radius, width / 2, centreY);
      drawAmbient(
        marketAmbient,
        width,
        height,
        small.radius,
        small.centreX,
        small.centreY,
      );
      drawStars(field, stars, width, height, mixRef.current);

      // Handed the field as generated, which is to say at rest: these positions
      // are the homes every star is drifted back to and snapped to.
      response.setField(stars, width, height);
      response.setMix(mixRef.current);
    };

    draw();

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(starsCanvas);
    // The type can change size without the stage doing so — most often when the
    // web font arrives and every line rewraps — and the field has to follow it
    // or the clearance is left around where the fallback font was.
    for (const element of clearElements()) observer.observe(element);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      // Both halves matter: a fast refresh in development runs this cleanup and
      // then the effect again, and a response that outlived it would leave a
      // second loop and a second pointer listener on the same canvas.
      response.destroy();
      responseRef.current = null;
    };
  }, []);

  // The crossfade. Runs on the motif's clock and curve, so the stars filling
  // the ground the big globe leaves arrive as it leaves it. From wherever the
  // last one stood, so reversing part way does not jump.
  useEffect(() => {
    const target = mode === "market" ? 1 : 0;
    const from = mixRef.current;
    if (from === target) return;

    const apply = (mix: number) => {
      mixRef.current = mix;
      responseRef.current?.setMix(mix);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(target);
      return;
    }

    const duration = ROUTE_MIX_MS * Math.abs(target - from);
    const start = performance.now();
    let frame = requestAnimationFrame(function step(time) {
      const t = Math.min((time - start) / duration, 1);
      apply(from + (target - from) * routeEase(t));
      if (t < 1) frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [mode]);

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
      {/* One ambient canvas per route, each with its dark hole under that
          route's globe, crossfaded on the motif's own curve. Each is still drawn
          once per size and never moves; only its opacity changes. */}
      <div
        data-mode={mode}
        className="transition-opacity duration-800 ease-[cubic-bezier(0.4,0,0.2,1)] data-[mode=market]:opacity-0 motion-reduce:transition-none"
      >
        <canvas
          ref={homeAmbientRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 h-lvh w-full animate-stars-in motion-reduce:animate-none"
        />
      </div>
      <div
        data-mode={mode}
        className="opacity-0 transition-opacity duration-800 ease-[cubic-bezier(0.4,0,0.2,1)] data-[mode=market]:opacity-100 motion-reduce:transition-none"
      >
        <canvas
          ref={marketAmbientRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 h-lvh w-full animate-stars-in motion-reduce:animate-none"
        />
      </div>
      <canvas
        ref={starsRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-lvh w-full animate-stars-in motion-reduce:animate-none"
      />
    </>
  );
}
