/**
 * The globe's state and maths. Nothing here touches a canvas.
 *
 * This half owns point positions, the view, the eased state values and the
 * projection. It turns the point set into flat arrays of rectangles grouped by
 * opacity bucket, and `draw.ts` turns those into fills. Keeping the two apart is
 * what makes a later move to a graphics-card renderer a contained change rather
 * than a rebuild — see the module contract in `docs/design/globe.md`.
 */

import { COMPONENTS_PER_POINT } from "@/lib/globe/fibonacci-sphere";
import type { GlobePointSet } from "@/lib/globe/point-set";

/** Opacity buckets per pass. Ten is enough that the banding is invisible. */
export const BUCKET_COUNT = 10;

/** The tilt the sphere eases to and holds. */
export const TILT = 0.16;

/** Radius is this share of the smaller window dimension... */
const RADIUS_FACTOR = 0.44;

/** ...capped here, the radius the factor produces at 1440 x 900. */
const RADIUS_CAP = 396;

/** Below this depth a point is drawn only if its index is even. */
const CULL_DEPTH = -0.05;

/** Points at or below this opacity are not drawn at all. */
const ALPHA_FLOOR = 0.02;

const OCEAN_ALPHA = 0.95;
const CLEAR_ZONE_ALPHA = 0.13;
const LAND_SIZE = 1.1;
const OCEAN_SIZE = 0.85;

/** A rectangle inside which points are dimmed, in CSS pixels. */
export interface ClearZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GlobeStatus = "idle" | "loading" | "error";

/**
 * Everything that varies between frames.
 *
 * The values below the rotation are all pinned at their idle settings while the
 * sphere is static. They are read by the projection regardless, so the motion
 * ticket animates them rather than reworking the formulas.
 */
export interface GlobeState {
  yaw: number;
  tilt: number;
  /** Scales the radius. */
  contract: number;
  /** Scales opacity globally. */
  dim: number;
  /** Drives the halo and point bloom. */
  glow: number;
  /** Drives point bloom only. */
  dotGlow: number;
  /** Assemble easing, 0 scattered to 1 settled. */
  assemble: number;
  clearZone: ClearZone | null;
  status: GlobeStatus;
  focused: boolean;
}

export function createGlobeState(): GlobeState {
  return {
    yaw: 0,
    tilt: TILT,
    contract: 1,
    dim: 1,
    glow: 0,
    dotGlow: 0,
    assemble: 1,
    clearZone: null,
    status: "idle",
    focused: false,
  };
}

/** The canvas as the projection sees it, in CSS pixels. */
export interface GlobeView {
  width: number;
  height: number;
  centreX: number;
  centreY: number;
  radius: number;
}

/**
 * One frame's worth of rectangles, grouped by opacity bucket.
 *
 * Each bucket is a flat run of x, y, size triples holding the rectangle's top
 * left corner. Flat number arrays rather than objects: at fifteen thousand
 * points a per-point object per frame is a garbage collection pause you can see.
 */
export interface GlobeFrame {
  land: number[][];
  ocean: number[][];
}

export function createGlobeFrame(): GlobeFrame {
  const buckets = () =>
    Array.from({ length: BUCKET_COUNT }, (): number[] => []);
  return { land: buckets(), ocean: buckets() };
}

/** Radius rule and cap, from `docs/design/home.md`. */
export function motifRadius(width: number, height: number): number {
  return Math.min(Math.min(width, height) * RADIUS_FACTOR, RADIUS_CAP);
}

/**
 * Projects every point into `frame`.
 *
 * Orthographic: the sphere is rotated, then depth is discarded for position but
 * kept for size and opacity. There is no perspective divide.
 */
export function project(
  points: GlobePointSet,
  state: GlobeState,
  view: GlobeView,
  frame: GlobeFrame,
): void {
  clear(frame.land);
  clear(frame.ocean);

  projectRange(
    points,
    0,
    points.landCount,
    LAND_SIZE,
    1,
    state,
    view,
    frame.land,
  );
  projectRange(
    points,
    points.landCount,
    points.count,
    OCEAN_SIZE,
    OCEAN_ALPHA,
    state,
    view,
    frame.ocean,
  );
}

function clear(buckets: number[][]): void {
  // Reset length rather than reallocating, so the arrays reach their working
  // size once and stay there.
  for (const bucket of buckets) bucket.length = 0;
}

function projectRange(
  points: GlobePointSet,
  from: number,
  to: number,
  sizeScale: number,
  alphaScale: number,
  state: GlobeState,
  view: GlobeView,
  buckets: number[][],
): void {
  const { positions } = points;

  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const cosTilt = Math.cos(state.tilt);
  const sinTilt = Math.sin(state.tilt);

  const radius = view.radius * state.contract;
  const sizeGlow = 1 + 0.3 * state.glow + 0.22 * state.dotGlow;
  const alphaGlow = 1 + 0.5 * state.glow + 0.55 * state.dotGlow;
  const arrival = 0.35 + 0.65 * state.assemble;
  const zone = state.clearZone;

  for (let index = from; index < to; index += 1) {
    const offset = index * COMPONENTS_PER_POINT;
    const ax = positions[offset];
    const ay = positions[offset + 1];
    const az = positions[offset + 2];

    const z = ax * cosTilt * cosYaw + ay * cosTilt * sinYaw + az * sinTilt;

    // Far-side culling: half the hidden hemisphere, where points are dim and
    // overlapping anyway.
    if (z < CULL_DEPTH && (index & 1) === 1) continue;

    const depth = z < -1 ? 0 : z > 1 ? 1 : (z + 1) / 2;

    let alpha =
      (0.17 + 0.83 * depth ** 1.6) *
      arrival *
      state.dim *
      alphaGlow *
      alphaScale;

    const x = view.centreX + (-ax * sinYaw + ay * cosYaw) * radius;
    const y =
      view.centreY -
      (-ax * sinTilt * cosYaw - ay * sinTilt * sinYaw + az * cosTilt) * radius;

    if (
      zone !== null &&
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    ) {
      alpha *= CLEAR_ZONE_ALPHA;
    }

    if (alpha <= ALPHA_FLOOR) continue;

    const size = Math.max(0.7, (0.55 + 1.15 * depth) * sizeGlow) * sizeScale;
    const bucket = Math.min(BUCKET_COUNT - 1, Math.floor(alpha * BUCKET_COUNT));
    const half = size / 2;

    // Stored as the top left corner, so the drawing half has no maths to do.
    buckets[bucket].push(x - half, y - half, size);
  }
}
