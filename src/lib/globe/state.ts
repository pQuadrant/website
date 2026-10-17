/**
 * The globe's state: everything it holds between frames, and how those values
 * move over time.
 *
 * This is the half of the module that decides what a value should be.
 * `projection.ts` turns those values into rectangles and `draw.ts` turns those
 * into fills; neither of them makes a decision. Keeping the three apart is what
 * makes a later move to a graphics-card renderer a contained change — see Engine
 * modules in `codebase-map/globe.md`.
 *
 * The globe has one state: idle. It spins up and tilts into place as it forms,
 * and then turns at a steady rate.
 */

import { ENTRANCE, rotationRamp } from "@/lib/globe/entrance";

/** The tilt the sphere eases to and holds. */
const TILT = 0.16;

/** The steady rotation rate, in radians per second. */
const SPIN = 0.055;

/**
 * Ceiling on a frame's delta, in seconds.
 *
 * Without it, a tab returning from the background produces one enormous delta
 * and every eased value snaps instantly.
 */
const MAX_DELTA = 0.05;

const TAU = Math.PI * 2;

const SPIN_RATE = 3;
const TILT_RATE = 3.2;

/** Everything that varies between frames. */
export interface GlobeState {
  yaw: number;
  tilt: number;
  /** Current rotation rate, in radians per second. Eases like the rest. */
  spin: number;
  /**
   * Page time, in milliseconds, as of this frame.
   *
   * Read straight from the frame clock rather than accumulated, because the
   * entrance is anchored to when the page loaded and not to how many frames
   * the globe has managed since. It is the same origin the starfield's and the
   * chrome's CSS fades run on, which is what keeps one sequence out of three
   * timelines.
   */
  now: number;
  /** Whether the entrance is still running. False for the rest of the session. */
  entranceRunning: boolean;
  /** How much of the steady rotation rate is in effect, 0 to 1. */
  rotationRamp: number;
}

export function createGlobeState(): GlobeState {
  return {
    yaw: 0,
    // Both start away from their targets, so the sphere tilts and spins up as
    // it forms rather than arriving already settled.
    tilt: 0,
    spin: 0,
    now: 0,
    entranceRunning: true,
    rotationRamp: 0,
  };
}

/**
 * Moves every value one frame forward. `delta` is in seconds.
 *
 * Each eased value approaches its target exponentially, at a rate per second
 * multiplied by the frame's delta and clamped to 1. Clamping is what keeps a
 * long frame from overshooting past the target and oscillating.
 */
export function advance(state: GlobeState, delta: number, now: number): void {
  const step = Math.min(delta, MAX_DELTA);

  // Anchored to the page clock rather than counted in frames, so a slow first
  // paint shortens the sequence instead of pushing its end past 2.8 seconds.
  state.now = now;
  if (state.entranceRunning) {
    state.entranceRunning = now < ENTRANCE.endMs;
    state.rotationRamp = state.entranceRunning ? rotationRamp(now) : 1;
  }

  state.spin = ease(state.spin, SPIN, SPIN_RATE, step);
  state.tilt = ease(state.tilt, TILT, TILT_RATE, step);

  // Held at zero until the ramp opens, so the sphere is barely turning while it
  // resolves and is at its steady rate as the last points settle.
  state.yaw += state.spin * state.rotationRamp * step;

  // Wrapped so the angle stays small over a long session; the projection only
  // ever takes its sine and cosine.
  if (state.yaw > TAU) state.yaw -= TAU;
}

function ease(
  current: number,
  target: number,
  rate: number,
  delta: number,
): number {
  return current + (target - current) * Math.min(1, rate * delta);
}

/**
 * Puts every value straight onto its target, with the sphere fully formed.
 *
 * This is the reduced-motion path: one static frame, painted rather than eased
 * toward. The entrance is marked finished rather than fast-forwarded — there is
 * no sequence to run, which is why nothing here starts a clock.
 */
export function snap(state: GlobeState): void {
  state.entranceRunning = false;
  state.rotationRamp = 1;
  state.tilt = TILT;
  state.spin = SPIN;
}
