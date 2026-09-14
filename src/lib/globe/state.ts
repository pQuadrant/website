/**
 * The globe's state: everything it holds between frames, and how those values
 * move over time.
 *
 * This is the half of the module that decides what a value should be.
 * `projection.ts` turns those values into rectangles and `draw.ts` turns those
 * into fills; neither of them makes a decision. Keeping the three apart is what
 * makes a later move to a graphics-card renderer a contained change — see the
 * module contract in `docs/design/globe.md`.
 *
 * Every number below is transcribed from the "Motion and states" section of that
 * file. The rates in particular are not interchangeable: they differ by
 * direction and by state, and those differences are what give each transition
 * its character.
 */

import { ENTRANCE, rotationRamp } from "@/lib/globe/entrance";

/** The tilt the sphere eases to and holds. */
export const TILT = 0.16;

/**
 * Ceiling on a frame's delta, in seconds.
 *
 * Without it, a tab returning from the background produces one enormous delta
 * and every eased value snaps instantly.
 */
const MAX_DELTA = 0.05;

/** How long the error state holds before returning to idle on its own. */
export const ERROR_HOLD_SECONDS = 0.9;

const TAU = Math.PI * 2;

export type GlobeStatus = "idle" | "loading" | "error";

/**
 * A rectangle inside which points are dimmed, in viewport CSS pixels.
 *
 * Viewport rather than canvas coordinates because that is what whoever owns the
 * panel can measure without knowing where the canvas sits. The projection
 * subtracts the canvas origin once a frame.
 */
export interface ClearZone {
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * When the panel's own appearance began, on the page clock, or null while it
   * has not yet begun.
   *
   * The zone fades in on the panel's fade, and the only reliable account of when
   * that started is the browser's: a CSS animation is held for a frame or two
   * before it starts, so a fade stamped when the zone arrived ran ahead of the
   * panel. Measured in headless Chrome it led by one to two frames.
   */
  since: number | null;
}

/** How far the zone reaches beyond the panel's footprint, on every side. */
const CLEAR_ZONE_MARGIN = 26;

/**
 * Turns a measured panel footprint into the zone.
 *
 * The margin is a property of the motif rather than of the panel, so it lives
 * here; the caller measures an element and passes the rectangle in. This is the
 * whole of the module's knowledge of the panel: four numbers and the moment it
 * began to appear, and no way back.
 */
export function expandToClearZone(
  rect: { x: number; y: number; width: number; height: number },
  since: number | null,
): ClearZone {
  return {
    x: rect.x - CLEAR_ZONE_MARGIN,
    y: rect.y - CLEAR_ZONE_MARGIN,
    width: rect.width + CLEAR_ZONE_MARGIN * 2,
    height: rect.height + CLEAR_ZONE_MARGIN * 2,
    since,
  };
}

/**
 * How long the zone takes to dim fully once it appears, in milliseconds.
 *
 * The panel's own appearance: the zone reaches 26px beyond the panel, so dimmed
 * at once it showed as a dark rectangle arriving ahead of the panel fading in
 * over it. It runs on the same duration and the same curve so the two arrive
 * together. See _Clear zone_ in `docs/design/globe.md`.
 */
export const CLEAR_ZONE_FADE_MS = 700;

/**
 * Sets the zone, arming its fade when it appears.
 *
 * Only an appearance fades. A zone that moves — a resize, a scroll — keeps its
 * strength, and a zone that is cleared goes at once, because the panel it
 * belongs to is removed at once rather than fading out.
 */
export function applyClearZone(
  state: GlobeState,
  zone: ClearZone | null,
): void {
  if (zone === null || state.clearZone === null) state.clearZoneFade = 0;
  state.clearZone = zone;
}

/** What each status eases toward. `dotGlow` is not here; it follows focus. */
interface StatusTargets {
  /** Radians per second. */
  spin: number;
  contract: number;
  dim: number;
  glow: number;
}

/**
 * The state table. Held as one frozen record rather than built per frame: at
 * sixty frames a second an object literal per frame is garbage for nothing.
 */
const TARGETS: Record<GlobeStatus, StatusTargets> = {
  idle: { spin: 0.055, contract: 1, dim: 1, glow: 0 },
  loading: { spin: 0.19, contract: 0.93, dim: 1.06, glow: 1 },
  error: { spin: 0.055, contract: 0.965, dim: 0.5, glow: 0 },
};

const SPIN_RATE_PROCESSING = 6;
const SPIN_RATE = 3;

/**
 * The error contract rate is an order of magnitude faster than every other
 * transition in the design, and it is what makes a rejection read as a flinch
 * rather than a fade. It is not a typo; do not normalise it.
 */
const CONTRACT_RATE_ERROR = 30;
const CONTRACT_RATE = 6;

const DIM_RATE = 8;
const GLOW_RATE_RISING = 5;
const GLOW_RATE_FALLING = 2.6;
const DOT_GLOW_RATE_RISING = 6;
const DOT_GLOW_RATE_FALLING = 3;
const TILT_RATE = 3.2;

/** Everything that varies between frames. */
export interface GlobeState {
  yaw: number;
  tilt: number;
  /** Current rotation rate, in radians per second. Eases like the rest. */
  spin: number;
  /** Scales the radius. */
  contract: number;
  /** Scales opacity globally. */
  dim: number;
  /** Drives the halo and point bloom. */
  glow: number;
  /** Drives point bloom only. */
  dotGlow: number;
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
  /** Seconds left on the error state's self-clearing hold. */
  errorHold: number;
  clearZone: ClearZone | null;
  /** How far the zone's dimming has arrived, 0 to 1. */
  clearZoneFade: number;
  status: GlobeStatus;
  focused: boolean;
}

export function createGlobeState(): GlobeState {
  return {
    yaw: 0,
    // Both start away from their targets, so the sphere tilts and spins up as
    // it forms rather than arriving already settled.
    tilt: 0,
    spin: 0,
    contract: 1,
    dim: 1,
    glow: 0,
    dotGlow: 0,
    now: 0,
    entranceRunning: true,
    rotationRamp: 0,
    errorHold: 0,
    clearZone: null,
    clearZoneFade: 0,
    status: "idle",
    focused: false,
  };
}

/**
 * Sets the status, arming the error hold when it is entered.
 *
 * The hold is the module's own: the error state returns to idle by itself and
 * is never cleared by the form.
 */
export function applyStatus(state: GlobeState, status: GlobeStatus): void {
  state.status = status;
  state.errorHold = status === "error" ? ERROR_HOLD_SECONDS : 0;
}

/** Point bloom follows focus, and is suppressed while processing. */
function dotGlowTarget(state: GlobeState): number {
  return state.focused && state.status !== "loading" ? 1 : 0;
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

  // Timed from the panel's own start on the page clock, not eased by delta and
  // not from when the zone arrived. The panel's CSS fade runs on this clock, and
  // a frame's timestamp is the time its animations are sampled at, so the two
  // reach the same progress on the same frame. Held at nothing until the panel's
  // fade has a start time.
  const zone = state.clearZone;
  if (zone !== null && state.clearZoneFade < 1) {
    const elapsed = zone.since === null ? 0 : now - zone.since;
    state.clearZoneFade = cssEase(
      Math.min(1, Math.max(0, elapsed / CLEAR_ZONE_FADE_MS)),
    );
  }

  // Ticked before the targets are read, so the frame the hold expires on is
  // already easing back toward idle.
  if (state.errorHold > 0) {
    state.errorHold -= step;
    if (state.errorHold <= 0) applyStatus(state, "idle");
  }

  const target = TARGETS[state.status];
  const processing = state.status === "loading";
  const dotGlow = dotGlowTarget(state);

  state.spin = ease(
    state.spin,
    target.spin,
    processing ? SPIN_RATE_PROCESSING : SPIN_RATE,
    step,
  );
  state.contract = ease(
    state.contract,
    target.contract,
    state.status === "error" ? CONTRACT_RATE_ERROR : CONTRACT_RATE,
    step,
  );
  state.dim = ease(state.dim, target.dim, DIM_RATE, step);
  state.glow = ease(
    state.glow,
    target.glow,
    target.glow > state.glow ? GLOW_RATE_RISING : GLOW_RATE_FALLING,
    step,
  );
  state.dotGlow = ease(
    state.dotGlow,
    dotGlow,
    dotGlow > state.dotGlow ? DOT_GLOW_RATE_RISING : DOT_GLOW_RATE_FALLING,
    step,
  );
  state.tilt = ease(state.tilt, TILT, TILT_RATE, step);

  // Held at zero until the ramp opens, so the sphere is barely turning while it
  // resolves and is at its steady rate as the last points settle.
  state.yaw += state.spin * state.rotationRamp * step;

  // Wrapped so the angle stays small over a long session; the projection only
  // ever takes its sine and cosine.
  if (state.yaw > TAU) state.yaw -= TAU;
}

/**
 * CSS's `ease` timing function, `cubic-bezier(0.25, 0.1, 0.25, 1)`, at `t`.
 *
 * The panel fades in on this curve, so the zone's fade uses it too; an
 * exponential ease would reach the panel's opacity at different moments along
 * the way. Solved for x by Newton's method, which converges in a few steps on
 * this curve.
 */
function cssEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const cx = 0.75;
  const bx = -0.75;
  const ax = 1;
  const cy = 0.3;
  const by = 2.4;
  const ay = -1.7;

  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * u + bx) * u + cx) * u - t;
    if (Math.abs(x) < 1e-6) break;
    const slope = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(slope) < 1e-6) break;
    u -= x / slope;
  }

  return ((ay * u + by) * u + cy) * u;
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
 * This is the reduced-motion path: the state changes still apply their visual
 * values, they are simply painted rather than eased toward. The entrance is
 * marked finished rather than fast-forwarded — there is no sequence to run,
 * which is why nothing here starts a clock.
 */
export function snap(state: GlobeState): void {
  const target = TARGETS[state.status];

  state.entranceRunning = false;
  state.rotationRamp = 1;
  state.tilt = TILT;
  state.spin = target.spin;
  state.contract = target.contract;
  state.dim = target.dim;
  state.glow = target.glow;
  state.dotGlow = dotGlowTarget(state);
  state.clearZoneFade = state.clearZone === null ? 0 : 1;
}
