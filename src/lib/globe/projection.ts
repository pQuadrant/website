/**
 * The globe's maths. Nothing here touches a canvas, and nothing here decides
 * what a value should be — `state.ts` owns that.
 *
 * It turns the point set into flat arrays of rectangles grouped by opacity
 * bucket, and `draw.ts` turns those into fills.
 */

import { COMPONENTS_PER_POINT } from "@/lib/globe/fibonacci-sphere";
import type { GlobePointSet } from "@/lib/globe/point-set";
import type { GlobeMotionField, GlobeState } from "@/lib/globe/state";

/** Opacity buckets per pass. Ten is enough that the banding is invisible. */
export const BUCKET_COUNT = 10;

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
  field: GlobeMotionField,
  state: GlobeState,
  view: GlobeView,
  frame: GlobeFrame,
): void {
  clear(frame.land);
  clear(frame.ocean);

  projectRange(
    points,
    field,
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
    field,
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
  field: GlobeMotionField,
  from: number,
  to: number,
  sizeScale: number,
  alphaScale: number,
  state: GlobeState,
  view: GlobeView,
  buckets: number[][],
): void {
  const { positions } = points;
  const { scatter } = field;

  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const cosTilt = Math.cos(state.tilt);
  const sinTilt = Math.sin(state.tilt);

  const radius = view.radius * state.contract;
  const sizeGlow = 1 + 0.3 * state.glow + 0.22 * state.dotGlow;
  const alphaGlow = 1 + 0.5 * state.glow + 0.55 * state.dotGlow;
  const arrival = 0.35 + 0.65 * state.assemble;
  const zone = state.clearZone;

  // Once the sphere has settled the blend below is the identity, so the whole
  // branch drops out for the rest of the globe's life.
  const settling = state.assemble < 1;
  const settled = state.assemble;

  for (let index = from; index < to; index += 1) {
    const offset = index * COMPONENTS_PER_POINT;
    let ax = positions[offset];
    let ay = positions[offset + 1];
    let az = positions[offset + 2];

    if (settling) {
      // A linear blend from the scattered position to the sphere, on the eased
      // value, so the deceleration is carried by the easing rather than here.
      ax = scatter[offset] + (ax - scatter[offset]) * settled;
      ay = scatter[offset + 1] + (ay - scatter[offset + 1]) * settled;
      az = scatter[offset + 2] + (az - scatter[offset + 2]) * settled;
    }

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
