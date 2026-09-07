/**
 * The globe's maths. Nothing here touches a canvas, and nothing here decides
 * what a value should be — `state.ts` owns that.
 *
 * It turns the point set into flat arrays of rectangles grouped by opacity
 * bucket, and `draw.ts` turns those into fills.
 */

import {
  ENTRANCE,
  FORMING_COLOUR_STEPS,
  type GlobeEntranceField,
  entranceEase,
} from "@/lib/globe/entrance";
import { COMPONENTS_PER_POINT } from "@/lib/globe/fibonacci-sphere";
import type { GlobePointSet } from "@/lib/globe/point-set";
import type { GlobeMotionField, GlobeState } from "@/lib/globe/state";

/** Opacity buckets per pass. Ten is enough that the banding is invisible. */
export const BUCKET_COUNT = 10;

/**
 * The highlight: a white core drawn inside the nearest points.
 *
 * Land tops out at luminance 186 and ocean lower still, so at the top bucket's
 * 0.95 the motif cannot exceed 176 whatever its alphas do. The ceiling is the
 * paint, not the opacity, and the only way past it is a second colour.
 *
 * Depth is the source: the points facing the viewer are lit, as they would be
 * under a light behind the shoulder. It is the one candidate that varies
 * smoothly as the sphere turns, so a point entering the highlight enters it at
 * zero strength — see the exponent below.
 */
const HIGHLIGHT_DEPTH = 0.86;

/**
 * How the highlight grows past its threshold, over `1 - HIGHLIGHT_DEPTH`.
 *
 * Above one, so strength leaves the threshold with zero gradient. A linear ramp
 * would still be continuous, but points would visibly wink on at the boundary
 * as they rotate through it; this is what keeps the population small and the
 * arrival invisible.
 */
const HIGHLIGHT_EXPONENT = 2.5;

/**
 * The core's size as a share of the point's, and its floor.
 *
 * The core sits inside the point rather than replacing it, which is what leaves
 * the green and the blue intact around a white centre. The floor is a pixel:
 * below that the rectangle is pure antialiasing and the highlight dims instead
 * of shrinking.
 */
const HIGHLIGHT_CORE = 0.6;
const HIGHLIGHT_CORE_FLOOR = 1;

/**
 * Buckets for the highlight pass. Four, against the ten the point passes use.
 *
 * The population is a few hundred points across a narrow range, so the banding
 * ten buckets exist to hide is not there to hide, and each bucket is a fill.
 */
export const HIGHLIGHT_BUCKET_COUNT = 4;

/** Below this strength the core is dimmer than the point under it. */
const HIGHLIGHT_FLOOR = 0.05;

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
  /**
   * The white cores, from both passes at once.
   *
   * One set rather than one per pass: the core is the same colour whichever
   * point it sits in, so splitting it would double the fills to draw the same
   * pixels.
   */
  highlight: number[][];
  /**
   * Entrance only: the points still travelling, as filled circles.
   *
   * Bucketed by colour step and then by opacity, `step x BUCKET_COUNT +
   * bucket`. Step 0 is the starfield white both classes hold until 65% of the
   * journey; the last step is the point's own land or ocean colour.
   *
   * Held as centre x, centre y, radius, because an arc is drawn from its centre
   * where a rectangle is drawn from its corner.
   */
  formingLand: number[][];
  formingOcean: number[][];
}

export function createGlobeFrame(): GlobeFrame {
  const buckets = (count: number) =>
    Array.from({ length: count }, (): number[] => []);
  return {
    land: buckets(BUCKET_COUNT),
    ocean: buckets(BUCKET_COUNT),
    highlight: buckets(HIGHLIGHT_BUCKET_COUNT),
    formingLand: buckets(FORMING_COLOUR_STEPS * BUCKET_COUNT),
    formingOcean: buckets(FORMING_COLOUR_STEPS * BUCKET_COUNT),
  };
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
  entrance: GlobeEntranceField | null,
  state: GlobeState,
  view: GlobeView,
  frame: GlobeFrame,
): void {
  clear(frame.land);
  clear(frame.ocean);
  clear(frame.highlight);
  clear(frame.formingLand);
  clear(frame.formingOcean);

  // The page opens on empty space: the starfield has four hundred milliseconds
  // to itself, and the motif's own phase has not started yet.
  if (state.entranceRunning && state.now < ENTRANCE.startMs) return;

  // Null once the sequence is over, so the per-point branch below drops out for
  // the rest of the session and a settled globe costs exactly what it did
  // before the entrance existed.
  const forming = entrance !== null && state.entranceRunning ? entrance : null;

  projectRange(
    points,
    field,
    forming,
    0,
    points.landCount,
    LAND_SIZE,
    1,
    state,
    view,
    frame.land,
    frame.highlight,
    frame.formingLand,
  );
  projectRange(
    points,
    field,
    forming,
    points.landCount,
    points.count,
    OCEAN_SIZE,
    OCEAN_ALPHA,
    state,
    view,
    frame.ocean,
    frame.highlight,
    frame.formingOcean,
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
  entrance: GlobeEntranceField | null,
  from: number,
  to: number,
  sizeScale: number,
  alphaScale: number,
  state: GlobeState,
  view: GlobeView,
  buckets: number[][],
  highlights: number[][],
  forming: number[][],
): void {
  const { positions } = points;
  const { jitter } = field;

  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const cosTilt = Math.cos(state.tilt);
  const sinTilt = Math.sin(state.tilt);

  const radius = view.radius * state.contract;
  const sizeGlow = 1 + 0.3 * state.glow + 0.22 * state.dotGlow;
  const alphaGlow = 1 + 0.5 * state.glow + 0.55 * state.dotGlow;

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

  // Hoisted so the per-point branch below reads one array each rather than one
  // object property each, and so a settled globe pays a single null check.
  const now = state.now;
  const driftScale = view.radius;
  const opacityRange = 1 - ENTRANCE.opacityFloor;
  const colourRange = 1 - ENTRANCE.colourHold;

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

    // How far through its own settle this point is: 0 before it starts, 1 once
    // it has resolved, and 1 for every point once the sequence is over.
    let settle = 1;
    let eased = 1;
    let appear = 1;
    let driftX = 0;
    let driftY = 0;

    if (entrance !== null) {
      const t = (now - entrance.start[index]) * entrance.rate[index];
      settle = t <= 0 ? 0 : t >= 1 ? 1 : t;

      if (settle < 1) {
        eased = entranceEase(settle);
        appear =
          settle >= ENTRANCE.appearSpan ? 1 : settle / ENTRANCE.appearSpan;

        // Scaled from the motif radius every frame rather than stored in
        // pixels, so a window resized part way through the sequence rescales
        // the grain instead of leaving it sized for the old stage.
        const remaining = (1 - eased) * driftScale;
        driftX = entrance.driftX[index] * remaining;
        driftY = entrance.driftY[index] * remaining;
      }
    }

    let alpha =
      (0.17 + 0.83 * depth ** 1.6) * state.dim * alphaGlow * alphaScale;

    // Two ramps, not one: `appear` keeps a point from being switched on between
    // one frame and the next, and the eased term carries it the rest of the way
    // to full brightness.
    if (settle < 1) {
      alpha *= appear * (ENTRANCE.opacityFloor + opacityRange * eased);
    }

    let x = view.centreX + (-ax * sinYaw + ay * cosYaw) * radius;
    let y =
      view.centreY -
      (-ax * sinTilt * cosYaw - ay * sinTilt * sinYaw + az * cosTilt) * radius;

    // Added to the position the point holds *this frame*, not to a frozen one.
    // The point is offset from where it belongs in the rotating frame, so the
    // grain turns with the sphere rather than sitting still on the glass while
    // the globe moves underneath it.
    if (settle < 1) {
      x += driftX;
      y += driftY;
    }

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

    if (settle < 1) {
      // An unresolved point is slightly too large as well as slightly out of
      // place, and sheds the excess exactly as it settles. Drawn faint at a
      // couple of pixels across, that is what reads as out of focus — and it is
      // gone by the frame the point hands over to the settled pass, so there is
      // no step at the handover.
      const radius =
        (size / 2 + ENTRANCE.bloomRadius * (1 - eased)) * Math.sqrt(appear);

      // The colour is held and then crossed over on raw settle progress: an
      // early or linear crossfade and the continents are legible from the first
      // frame, which is the one thing there is to watch.
      const mix = (settle - ENTRANCE.colourHold) / colourRange;
      const step = Math.round(
        entranceEase(mix < 0 ? 0 : mix) * (FORMING_COLOUR_STEPS - 1),
      );

      forming[step * BUCKET_COUNT + bucket].push(x, y, radius);
      continue;
    }

    const half = size / 2;

    // Stored as the top left corner, so the drawing half has no maths to do.
    buckets[bucket].push(x - half, y - half, size);

    // The white core, for the points near enough the front to be lit. Carried
    // on the point's own alpha, so it dims behind the panel, fades in with the
    // assemble and brightens under the cursor along with everything else.
    if (depth <= HIGHLIGHT_DEPTH) continue;

    const strength =
      ((depth - HIGHLIGHT_DEPTH) / (1 - HIGHLIGHT_DEPTH)) ** HIGHLIGHT_EXPONENT;
    const core = alpha * strength;
    if (core <= HIGHLIGHT_FLOOR) continue;

    const coreSize = Math.max(HIGHLIGHT_CORE_FLOOR, size * HIGHLIGHT_CORE);
    const coreBucket = Math.min(
      HIGHLIGHT_BUCKET_COUNT - 1,
      Math.floor(core * HIGHLIGHT_BUCKET_COUNT),
    );

    // Centred on the point rather than sharing its corner, so the colour
    // survives as a ring around the core instead of an L down two sides.
    const coreHalf = coreSize / 2;
    highlights[coreBucket].push(x - coreHalf, y - coreHalf, coreSize);
  }
}
