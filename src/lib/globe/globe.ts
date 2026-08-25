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
  clearPointer,
  createGlobeState,
  createMotionField,
  setPointer,
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
  const field = createMotionField(points.count);
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

  let animationFrame = 0;
  let running = false;
  let lastFrameTime = 0;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerAttached = false;
  let destroyed = false;

  function measure(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    // Read once here rather than on every pointer event, which would be a
    // layout read per mouse move.
    const bounds = canvas.getBoundingClientRect();

    view.width = width;
    view.height = height;
    view.originX = bounds.left;
    view.originY = bounds.top;
    view.centreX = width / 2;
    view.centreY = height / 2;
    view.radius = motifRadius(width, height);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    // Draw in CSS pixels; the backing store scale is the context's problem.
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function render(): void {
    project(points, field, state, view, frame);
    paint(context, frame, colours, view, state);
  }

  function loop(time: number): void {
    animationFrame = requestAnimationFrame(loop);

    // The first frame has nothing to measure against, so it advances nothing.
    const delta = lastFrameTime === 0 ? 0 : (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    advance(state, delta);
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

  function onPointerMove(event: PointerEvent): void {
    setPointer(state, event.clientX, event.clientY);
  }

  function onPointerLeave(): void {
    clearPointer(state);
  }

  /**
   * The cursor scatter's listener, attached only while motion is allowed.
   *
   * Under reduced motion there is no listener at all, rather than a listener
   * feeding a disturbance that is never drawn.
   */
  function attachPointer(): void {
    if (pointerAttached || destroyed) return;
    pointerAttached = true;
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
  }

  function detachPointer(): void {
    if (!pointerAttached) return;
    pointerAttached = false;
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    clearPointer(state);
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
      detachPointer();
      settle();
    } else {
      clearErrorTimer();
      attachPointer();
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
      detachPointer();
      clearErrorTimer();
      reducedMotion.removeEventListener("change", applyMotionPreference);
    },
  };
}
