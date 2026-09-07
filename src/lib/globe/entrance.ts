/**
 * The globe's entrance: how far off its true position each point starts, when
 * it settles, and how it looks while it has not.
 *
 * Transcribed from the "Entrance" section of `docs/design/globe.md`. Like the
 * rest of `src/lib/globe/`, nothing here decides when to paint — `state.ts`
 * holds the clock, `projection.ts` reads these values per point, and `draw.ts`
 * puts them on the canvas.
 *
 * **The globe is never assembled.** It is at its final geometry from the first
 * frame it is drawn; what changes is how well it can be read. Points begin
 * scattered a few pixels off where they belong, dim and colourless, and the
 * scatter settles out. Nothing travels across the window and nothing arrives
 * from anywhere.
 *
 * That is a deliberate rejection of the obvious version. Points flying in from
 * the edges and gathering into a sphere is the most common motion effect on the
 * web, and it was built here first: it reads as a trick performed on the motif
 * rather than as the motif itself, it takes nearly three seconds to say nothing,
 * and there is no reason a globe's points would ever have been scattered across
 * a window. What is left is the part that was actually worth animating — the
 * continents resolving out of an undifferentiated haze.
 */

import { mulberry32 } from "@/lib/random";

const TAU = Math.PI * 2;

/**
 * Every number the entrance runs on. Times are milliseconds of page time — the
 * clock `performance.now()` and `requestAnimationFrame` both report — so this
 * module, the starfield's fade and the chrome's fade share one origin without
 * anything having to hand a start time around.
 */
export const ENTRANCE = {
  /** The globe's own phase. Nothing of the motif is drawn before `startMs`. */
  startMs: 250,
  endMs: 1400,

  /** Per-point delay, on top of `startMs`, and per-point settle time. */
  delayMaxMs: 200,
  durationMinMs: 800,
  durationMaxMs: 950,

  /** The rotation ramp, from stationary to the steady idle rate. */
  rotationStartMs: 250,
  rotationEndMs: 1400,

  /**
   * How far a point starts from where it belongs, as a multiple of the motif
   * radius, before a per-point share is taken of it.
   *
   * At 1440 x 900 this is 22px against roughly 7px between neighbouring land
   * points, so a point starts about three neighbours away and the coastlines
   * are genuinely unreadable rather than merely soft. That is the measure this
   * number is set by: **the continents must not be legible on the first frame**,
   * because their becoming legible is the whole of the effect.
   *
   * It is also the ceiling. Much beyond this and the sphere stops reading as a
   * sphere at all, at which point the page is assembling a globe out of dots
   * again, which is the thing this design exists to avoid.
   */
  driftSpread: 0.055,

  /** The smallest share of that spread any point gets. */
  driftFloor: 0.45,

  /**
   * Extra radius, in CSS pixels, carried while a point is unresolved.
   *
   * A point a couple of pixels across, drawn faint and slightly too large, is
   * an out-of-focus point. The extra melts away on the same curve as the
   * scatter, so a point resolves to small and crisp exactly as it stops moving
   * and there is no step at the handover to the settled pass.
   */
  bloomRadius: 0.9,

  /**
   * The share of its settle a point spends fading up out of nothing.
   *
   * Short. Points are not travelling, so there is nothing to reveal gradually;
   * this exists only so that no point is switched on between one frame and the
   * next.
   */
  appearSpan: 0.12,

  /**
   * The share of its settle a point spends colourless before it takes on land
   * green or ocean blue.
   *
   * An unresolved point has no colour to show yet, and the moment the green and
   * the blue separate out of the haze is the one moment in the sequence worth
   * watching. Measured on raw settle progress, not on the eased value: on the
   * eased value 55% arrives a quarter of the way in, and the continents would
   * be legible almost from the start.
   */
  colourHold: 0.55,

  /** Opacity runs from this multiple of the point's settled value up to it. */
  opacityFloor: 0.15,

  /**
   * Fixed seed, and not the starfield's. The sequence must be identical on
   * every load, and the two fields must not be drawn from the same stream, or
   * the globe's grain would correlate with where the stars happen to be.
   */
  seed: 0x5bf03635,
} as const;

/** The starfield's cool white, which every point wears until `colourHold`. */
export const ENTRANCE_WHITE: readonly [number, number, number] = [
  226, 234, 246,
];

/**
 * Colour steps the white-to-class ramp is quantised into.
 *
 * Exists for the same reason the opacity buckets do: canvas cannot vary a fill
 * within one path, and per-point state changes at fifteen thousand points are
 * the cost this design has always refused to pay. Six is below the level where
 * the quantisation is visible on a dot two pixels across.
 */
export const FORMING_COLOUR_STEPS = 6;

/**
 * How far off its position each point starts, when it begins settling, and how
 * long it takes.
 *
 * Allocated once, for the lifetime of the globe. The drift is held in motif
 * radii rather than pixels, so a window resized part way through the sequence
 * rescales it instead of leaving points scattered by a distance that belonged
 * to the old stage.
 */
export interface GlobeEntranceField {
  /** Drift from the point's true screen position, in motif radii: x, then y. */
  driftX: Float32Array;
  driftY: Float32Array;
  /** Page time, in ms, the point begins settling. */
  start: Float32Array;
  /** Reciprocal of the point's settle time, in inverse ms. */
  rate: Float32Array;
}

/**
 * Draws the whole field from one seeded stream.
 *
 * **No value here is derived from the point's position.** Not by distance from
 * the centre, not by latitude, not by anything geometric. A spatial pattern
 * reads as a wipe or a sweep, and the sphere has to resolve evenly across its
 * whole face at once. The point set's index order runs pole to pole, so
 * deriving a delay from the index is the same mistake wearing a different hat.
 */
export function createEntranceField(count: number): GlobeEntranceField {
  const random = mulberry32(ENTRANCE.seed);

  const driftX = new Float32Array(count);
  const driftY = new Float32Array(count);
  const start = new Float32Array(count);
  const rate = new Float32Array(count);

  const share = 1 - ENTRANCE.driftFloor;
  const span = ENTRANCE.durationMaxMs - ENTRANCE.durationMinMs;

  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    // Uniform in radius rather than in area, which puts more points at a middle
    // distance than a disc would. The grain wants an even thickness, not a
    // cloud that is densest at its rim.
    const reach =
      (ENTRANCE.driftFloor + random() * share) * ENTRANCE.driftSpread;

    driftX[index] = Math.cos(angle) * reach;
    driftY[index] = Math.sin(angle) * reach;
    start[index] = ENTRANCE.startMs + random() * ENTRANCE.delayMaxMs;
    rate[index] = 1 / (ENTRANCE.durationMinMs + random() * span);
  }

  return { driftX, driftY, start, rate };
}

/**
 * Cubic ease-out, and the only easing the entrance uses.
 *
 * Every animated property rides this one curve. It is an ease-out rather than
 * anything with an ease-in half because nothing here departs from anywhere: a
 * point is already where it belongs, give or take, and what it is doing is
 * settling. Nothing overshoots — no bounce, no back, no elastic. A point that
 * travelled past its position and came back would be a flourish, and a
 * flourish is what this design has none of.
 */
export function entranceEase(t: number): number {
  const remaining = 1 - t;
  return 1 - remaining * remaining * remaining;
}

/**
 * How much of the steady rotation rate is in effect at `now`.
 *
 * The sphere turns as it resolves rather than starting to turn once it has,
 * which is what keeps the ramp from reading as a separate event. It is a ramp
 * and not a constant because a globe already at speed while its own points are
 * still settling looks busy.
 */
export function rotationRamp(now: number): number {
  if (now <= ENTRANCE.rotationStartMs) return 0;
  if (now >= ENTRANCE.rotationEndMs) return 1;

  return entranceEase(
    (now - ENTRANCE.rotationStartMs) /
      (ENTRANCE.rotationEndMs - ENTRANCE.rotationStartMs),
  );
}
