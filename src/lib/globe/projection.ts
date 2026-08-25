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

/** Cursor scatter: `max(70, min(width, height) x 0.13)`. */
const SCATTER_RADIUS_FLOOR = 70;
const SCATTER_RADIUS_FACTOR = 0.13;

/** How the disturbance falls away from the cursor, and how hard it pushes. */
const SCATTER_FALLOFF = 1.7;
const SCATTER_PUSH = 0.34;

/**
 * The rotary drift: a slow individual wander, at `angle`, so the disturbed
 * region shimmers rather than moving as a rigid blob.
 *
 * The turn is the specification's own rounding of a full circle. It is a phase
 * spread over points that share a jitter value, not a rotation, so the fourth
 * decimal buys nothing.
 */
const SCATTER_DRIFT = 9;
const SCATTER_DRIFT_RATE = 0.0016;
const SCATTER_JITTER_TURN = 6.283;
const SCATTER_INDEX_PHASE = 0.7;

/** Displaced points are brightened by this much of their falloff. */
const SCATTER_BRIGHTNESS = 1.5;

/**
 * Below this influence the furthest a point could move is a fiftieth of a
 * pixel, so the whole pass is skipped and a settled globe pays one comparison a
 * frame for it.
 */
const INFLUENCE_FLOOR = 0.0005;

/** The canvas as the projection sees it, in CSS pixels. */
export interface GlobeView {
  width: number;
  height: number;
  centreX: number;
  centreY: number;
  radius: number;
  /**
   * Where the canvas's top left corner sits in the viewport.
   *
   * The cursor and the clear zone both arrive in viewport coordinates, because
   * that is what the page outside can measure. This is what converts them, and
   * it is the only reason the module knows where its canvas is.
   */
  originX: number;
  originY: number;
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
  const { scatter, jitter } = field;

  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const cosTilt = Math.cos(state.tilt);
  const sinTilt = Math.sin(state.tilt);

  const radius = view.radius * state.contract;
  const sizeGlow = 1 + 0.3 * state.glow + 0.22 * state.dotGlow;
  const alphaGlow = 1 + 0.5 * state.glow + 0.55 * state.dotGlow;
  const arrival = 0.35 + 0.65 * state.assemble;

  // The zone and the cursor arrive in viewport coordinates and are compared
  // against canvas ones, so both are converted here rather than per point.
  const zone = state.clearZone;
  const zoneLeft = zone === null ? 0 : zone.x - view.originX;
  const zoneTop = zone === null ? 0 : zone.y - view.originY;
  const zoneRight = zoneLeft + (zone === null ? 0 : zone.width);
  const zoneBottom = zoneTop + (zone === null ? 0 : zone.height);

  const scattering = state.influence > INFLUENCE_FLOOR;
  const scatterRadius = Math.max(
    SCATTER_RADIUS_FLOOR,
    Math.min(view.width, view.height) * SCATTER_RADIUS_FACTOR,
  );
  // Compared against the squared distance, so the square root is taken only for
  // the few hundred points that are actually within reach.
  const scatterReach = scatterRadius * scatterRadius;
  const pointerX = state.pointerX - view.originX;
  const pointerY = state.pointerY - view.originY;
  const drift = state.elapsed * SCATTER_DRIFT_RATE;

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

    let x = view.centreX + (-ax * sinYaw + ay * cosYaw) * radius;
    let y =
      view.centreY -
      (-ax * sinTilt * cosYaw - ay * sinTilt * sinYaw + az * cosTilt) * radius;

    if (scattering) {
      const dx = x - pointerX;
      const dy = y - pointerY;
      const reach = dx * dx + dy * dy;

      // The point sitting exactly under the cursor has no direction to be
      // pushed in, and dividing by its distance would produce one.
      if (reach < scatterReach && reach > 0) {
        const distance = Math.sqrt(reach);
        const falloff =
          (1 - distance / scatterRadius) ** SCATTER_FALLOFF * state.influence;
        const push = falloff * scatterRadius * SCATTER_PUSH;
        const angle =
          jitter[index] * SCATTER_JITTER_TURN +
          drift +
          index * SCATTER_INDEX_PHASE;

        x += (dx / distance) * push + Math.cos(angle) * falloff * SCATTER_DRIFT;
        y += (dy / distance) * push + Math.sin(angle) * falloff * SCATTER_DRIFT;
        alpha *= 1 + falloff * SCATTER_BRIGHTNESS;
      }
    }

    // Tested where the point is drawn rather than where it started, so one
    // pushed across the boundary dims with the rest of the rectangle.
    if (
      zone !== null &&
      x >= zoneLeft &&
      x <= zoneRight &&
      y >= zoneTop &&
      y <= zoneBottom
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
