/**
 * The globe motif: a self-contained module that draws a point-cloud Earth onto
 * a canvas it is handed.
 *
 * It contains no React, imports nothing from `src/components/`, holds no colour
 * value, and reads nothing from the DOM other than the canvas itself and the
 * visitor's motion preference. Everything else arrives through the handle
 * returned by `createGlobe`. See the module contract in `docs/design/globe.md`.
 *
 * This file owns the lifecycle only: the frame clock, the motion preference,
 * and shutdown. What the values are is `state.ts`, where they land on screen is
 * `projection.ts`, and how they are painted is `draw.ts`.
 */

import {
  type GlobeColours,
  type PaintColours,
  paint,
  resolveColours,
} from "@/lib/globe/draw";
import {
  ENTRANCE,
  type GlobeEntranceField,
  createEntranceField,
} from "@/lib/globe/entrance";
import { createGlobePointSet } from "@/lib/globe/point-set";
import {
  type GlobeView,
  createGlobeFrame,
  motifRadius,
  project,
} from "@/lib/globe/projection";
import {
  type ClearZone,
  ERROR_HOLD_SECONDS,
  type GlobeStatus,
  advance,
  applyStatus,
  createGlobeState,
  snap,
} from "@/lib/globe/state";

/**
 * Ceiling on the canvas backing store, as a multiple of the layout size.
 *
 * A full 3x buffer for a field of one-pixel squares costs a great deal and
 * shows nothing at these point sizes.
 */
const MAX_PIXEL_RATIO = 1.5;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export interface GlobeOptions {
  /** Point colours, read from the design tokens by whoever mounts the globe. */
  colours: GlobeColours;
  /**
   * The stage's vertical centre, in CSS pixels, given the canvas height.
   *
   * A function rather than a number because it is re-read on every resize, and
   * it arrives from outside rather than being computed here for the same reason
   * the colours do: the answer lives in CSS, and this module reads nothing from
   * the DOM but its own canvas. It is not `height / 2` — see the Motif centring
   * section of `docs/design/home.md`.
   */
  centreY: (stageHeight: number) => number;
}

export interface GlobeHandle {
  setStatus(status: GlobeStatus): void;
  setFocused(focused: boolean): void;
  setClearZone(zone: ClearZone | null): void;
  /** Recompute dimensions and backing store. Geometry is not rebuilt. */
  resize(): void;
  /** Cancel the loop and release everything. Safe to call more than once. */
  destroy(): void;
}

/** Narrows the context once, so the draw path is not littered with null checks. */
function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("globe: canvas 2d context unavailable");
  }
  return context;
}

export function createGlobe(
  canvas: HTMLCanvasElement,
  options: GlobeOptions,
): GlobeHandle {
  const context = context2d(canvas);

  // Allocated once, for the lifetime of the globe.
  const points = createGlobePointSet();
  const state = createGlobeState();
  const frame = createGlobeFrame();
  const colours: PaintColours = resolveColours(context, options.colours);
  const view: GlobeView = {
    width: 0,
    height: 0,
    centreX: 0,
    centreY: 0,
    radius: 0,
    originX: 0,
    originY: 0,
  };

  const reducedMotion = window.matchMedia(REDUCED_MOTION);

  /**
   * The entrance, or nothing at all.
   *
   * Under reduced motion there is no sequence: no field is drawn and the globe
   * paints its settled frame directly. The second condition covers a page that
   * took longer to reach this line than the sequence takes to run — a slow
   * hydration, or a development fast refresh — where the honest answer is that
   * the entrance has already been and gone.
   */
  const entrance: GlobeEntranceField | null =
    !reducedMotion.matches && performance.now() < ENTRANCE.endMs
      ? createEntranceField(points.count)
      : null;

  let animationFrame = 0;
  let running = false;
  let lastFrameTime = 0;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  function measure(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    // Where the canvas sits in the viewport, for the clear zone: the panel's
    // footprint arrives in viewport coordinates and the projection converts it.
    // Read here rather than per frame, which would be a layout read per frame.
    const bounds = canvas.getBoundingClientRect();

    view.width = width;
    view.height = height;
    view.originX = bounds.left;
    view.originY = bounds.top;
    view.centreX = width / 2;
    // Not `height / 2`: the canvas is the large viewport and the visitor sees
    // less than that. The panel, the density falloff and the ambient light all
    // centre on this same number.
    view.centreY = options.centreY(height);
    view.radius = motifRadius(width, height);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    // Draw in CSS pixels; the backing store scale is the context's problem.
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function render(): void {
    project(points, entrance, state, view, frame);
    paint(context, frame, colours, view, state);
  }

  function loop(time: number): void {
    animationFrame = requestAnimationFrame(loop);

    // The first frame has nothing to measure against, so it advances nothing.
    const delta = lastFrameTime === 0 ? 0 : (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    // `time` is milliseconds since the page's time origin, which is the clock
    // the entrance is written against and the same one the starfield's and the
    // chrome's CSS fades run on. Passed through rather than accumulated: three
    // layers on one timeline, with nothing handing a start time around.
    advance(state, delta, time);
    render();
  }

  function startLoop(): void {
    if (running || destroyed) return;
    running = true;
    lastFrameTime = 0;
    animationFrame = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
  }

  function clearErrorTimer(): void {
    if (errorTimer === undefined) return;
    clearTimeout(errorTimer);
    errorTimer = undefined;
  }

  /**
   * Applies a state change when no loop is running.
   *
   * Under reduced motion the values still change; they are painted immediately
   * rather than eased toward, and the error hold runs off a timer because there
   * are no frames to count it down.
   */
  function settle(): void {
    if (!reducedMotion.matches) return;

    clearErrorTimer();
    if (state.status === "error") {
      errorTimer = setTimeout(() => {
        errorTimer = undefined;
        applyStatus(state, "idle");
        settle();
      }, ERROR_HOLD_SECONDS * 1000);
    }

    snap(state);
    render();
  }

  /**
   * Switches between the running loop and a single static frame.
   *
   * Re-read on every change rather than once at start-up, so turning the
   * preference on or off while the page is open takes effect without a reload.
   */
  function applyMotionPreference(): void {
    if (reducedMotion.matches) {
      stopLoop();
      settle();
    } else {
      clearErrorTimer();
      startLoop();
    }
  }

  reducedMotion.addEventListener("change", applyMotionPreference);

  measure();
  applyMotionPreference();

  return {
    setStatus(status) {
      if (destroyed) return;
      applyStatus(state, status);
      settle();
    },
    setFocused(focused) {
      if (destroyed) return;
      state.focused = focused;
      settle();
    },
    setClearZone(zone) {
      if (destroyed) return;
      state.clearZone = zone;
      settle();
    },
    resize() {
      if (destroyed) return;
      measure();
      // The loop repaints on its own; the static frame has to be asked.
      if (!running) render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      clearErrorTimer();
      reducedMotion.removeEventListener("change", applyMotionPreference);
    },
  };
}
