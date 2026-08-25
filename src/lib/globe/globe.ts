/**
 * The globe motif: a self-contained module that draws a point-cloud Earth onto
 * a canvas it is handed.
 *
 * It contains no React, imports nothing from `src/components/`, holds no colour
 * value, and reads nothing from the DOM other than the canvas itself. Everything
 * else arrives through the handle returned by `createGlobe`. See the module
 * contract in `docs/design/globe.md`.
 *
 * The sphere is static in this ticket: it holds one rotation and one tilt, and
 * every eased value sits at its idle setting. The loop still runs, because its
 * lifecycle has to be right before anything depends on it — two loops on one
 * canvas present as stutter and a slow memory climb rather than an error, and
 * that is much easier to find now than with motion on top of it.
 */

import { type GlobeColours, paint } from "@/lib/globe/draw";
import { createGlobePointSet } from "@/lib/globe/point-set";
import {
  type ClearZone,
  type GlobeStatus,
  type GlobeView,
  createGlobeFrame,
  createGlobeState,
  motifRadius,
  project,
} from "@/lib/globe/projection";

/**
 * Ceiling on the canvas backing store, as a multiple of the layout size.
 *
 * A full 3x buffer for a field of one-pixel squares costs a great deal and
 * shows nothing at these point sizes.
 */
const MAX_PIXEL_RATIO = 1.5;

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
  const state = createGlobeState();
  const frame = createGlobeFrame();
  const view: GlobeView = {
    width: 0,
    height: 0,
    centreX: 0,
    centreY: 0,
    radius: 0,
  };

  let animationFrame = 0;
  let destroyed = false;

  function measure(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

    view.width = width;
    view.height = height;
    view.centreX = width / 2;
    view.centreY = height / 2;
    view.radius = motifRadius(width, height);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    // Draw in CSS pixels; the backing store scale is the context's problem.
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function render(): void {
    project(points, state, view, frame);
    paint(context, frame, options.colours, view);
  }

  function loop(): void {
    animationFrame = requestAnimationFrame(loop);
    render();
  }

  measure();
  loop();

  return {
    setStatus(status) {
      state.status = status;
    },
    setFocused(focused) {
      state.focused = focused;
    },
    setClearZone(zone) {
      state.clearZone = zone;
    },
    resize() {
      if (destroyed) return;
      measure();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
    },
  };
}
