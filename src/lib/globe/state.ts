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

import { COMPONENTS_PER_POINT } from "@/lib/globe/fibonacci-sphere";

/** The tilt the sphere eases to and holds. */
export const TILT = 0.16;

/**
 * Ceiling on a frame's delta, in seconds.
 *
 * Without it, a tab returning from the background produces one enormous delta
 * and every eased value snaps instantly.
 */
const MAX_DELTA = 0.05;

/** How long the opening assemble takes, in seconds. */
const ASSEMBLE_SECONDS = 1.5;

/** Scattered start positions span this much on each axis, before jitter. */
const SCATTER_REACH = 2.7;

/** Per-point jitter factor: `JITTER_FLOOR + random × JITTER_RANGE`. */
const JITTER_FLOOR = 0.55;
const JITTER_RANGE = 0.45;

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
}

/** How far the zone reaches beyond the panel's footprint, on every side. */
const CLEAR_ZONE_MARGIN = 26;

/**
 * Turns a measured panel footprint into the zone.
 *
 * The margin is a property of the motif rather than of the panel, so it lives
 * here; the caller measures an element and passes the rectangle in. This is the
 * whole of the module's knowledge of the panel: four numbers, and no way back.
 */
export function expandToClearZone(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): ClearZone {
  return {
    x: rect.x - CLEAR_ZONE_MARGIN,
    y: rect.y - CLEAR_ZONE_MARGIN,
    width: rect.width + CLEAR_ZONE_MARGIN * 2,
    height: rect.height + CLEAR_ZONE_MARGIN * 2,
  };
}

/**
 * Whether a viewport point falls inside the zone.
 *
 * Used once a frame, for the cursor. The projection tests the same rectangle
 * against fifteen thousand points and hoists its edges into locals rather than
 * calling this.
 */
function insideClearZone(
  zone: ClearZone | null,
  x: number,
  y: number,
): boolean {
  return (
    zone !== null &&
    x >= zone.x &&
    x <= zone.x + zone.width &&
    y >= zone.y &&
    y <= zone.y + zone.height
  );
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
const INFLUENCE_RATE_RISING = 7;
const INFLUENCE_RATE_FALLING = 3.4;
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
  /** Assemble easing, 0 scattered to 1 settled. */
  assemble: number;
  /** Seconds the assemble has been running. Never reset; it runs once. */
  assembleElapsed: number;
  /** Seconds left on the error state's self-clearing hold. */
  errorHold: number;
  /**
   * Milliseconds the globe has been running, accumulated from clamped frame
   * deltas rather than read from the clock.
   *
   * It drives the cursor scatter's rotary drift and nothing else, so a tab that
   * spent ten minutes in the background resuming ten minutes behind the wall
   * clock is not a defect: what matters is that the phase advances smoothly.
   */
  elapsed: number;
  /** Cursor position, in viewport CSS pixels. Meaningless while inactive. */
  pointerX: number;
  pointerY: number;
  /** Whether the cursor is over the canvas at all. */
  pointerActive: boolean;
  /** How strongly the cursor disturbs the points, 0 to 1. Eases. */
  influence: number;
  clearZone: ClearZone | null;
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
    assemble: 0,
    assembleElapsed: 0,
    errorHold: 0,
    elapsed: 0,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    influence: 0,
    clearZone: null,
    status: "idle",
    focused: false,
  };
}

/**
 * Where each point starts the assemble, and its share of the per-point
 * randomness.
 *
 * Allocated once, for the lifetime of the globe. The jitter is baked into the
 * scattered positions so the projection has no multiply to do, and kept
 * separately because the cursor scatter uses the same per-point value.
 */
export interface GlobeMotionField {
  /** Scattered start position per point: x, y, z. */
  scatter: Float32Array;
  /** Per-point jitter factor, in `[0.55, 1]`. */
  jitter: Float32Array;
}

export function createMotionField(count: number): GlobeMotionField {
  const scatter = new Float32Array(count * COMPONENTS_PER_POINT);
  const jitter = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const factor = JITTER_FLOOR + Math.random() * JITTER_RANGE;
    const offset = index * COMPONENTS_PER_POINT;

    jitter[index] = factor;
    scatter[offset] = scatterAxis(factor);
    scatter[offset + 1] = scatterAxis(factor);
    scatter[offset + 2] = scatterAxis(factor);
  }

  return { scatter, jitter };
}

function scatterAxis(jitter: number): number {
  return (Math.random() * 2 - 1) * SCATTER_REACH * jitter;
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

/** Records where the cursor is. The listener is `globe.ts`'s business. */
export function setPointer(state: GlobeState, x: number, y: number): void {
  state.pointerX = x;
  state.pointerY = y;
  state.pointerActive = true;
}

/** The cursor has left the canvas; the disturbance eases away rather than cutting. */
export function clearPointer(state: GlobeState): void {
  state.pointerActive = false;
}

/**
 * The cursor disturbs the points only while it is over the canvas and outside
 * the zone. The globe does not react to the cursor while the visitor is filling
 * in the form.
 */
function influenceTarget(state: GlobeState): number {
  const reacting =
    state.pointerActive &&
    !insideClearZone(state.clearZone, state.pointerX, state.pointerY);
  return reacting ? 1 : 0;
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
export function advance(state: GlobeState, delta: number): void {
  const step = Math.min(delta, MAX_DELTA);

  // Ticked before the targets are read, so the frame the hold expires on is
  // already easing back toward idle.
  if (state.errorHold > 0) {
    state.errorHold -= step;
    if (state.errorHold <= 0) applyStatus(state, "idle");
  }

  if (state.assemble < 1) {
    state.assembleElapsed += step;
    const t = Math.min(1, state.assembleElapsed / ASSEMBLE_SECONDS);
    state.assemble = 1 - (1 - t) ** 3;
  }

  state.elapsed += step * 1000;

  const target = TARGETS[state.status];
  const processing = state.status === "loading";
  const dotGlow = dotGlowTarget(state);
  const influence = influenceTarget(state);

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
  state.influence = ease(
    state.influence,
    influence,
    influence > state.influence
      ? INFLUENCE_RATE_RISING
      : INFLUENCE_RATE_FALLING,
    step,
  );
  state.tilt = ease(state.tilt, TILT, TILT_RATE, step);

  // Rotation is damped while the sphere is still forming, so it spins up as it
  // arrives rather than tumbling while scattered.
  state.yaw += state.spin * (0.6 + 0.4 * state.assemble) * step;

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
 * Puts every value straight onto its target, with the sphere fully assembled.
 *
 * This is the reduced-motion path: the state changes still apply their visual
 * values, they are simply painted rather than eased toward.
 */
export function snap(state: GlobeState): void {
  const target = TARGETS[state.status];

  state.assemble = 1;
  state.assembleElapsed = ASSEMBLE_SECONDS;
  state.tilt = TILT;
  state.spin = target.spin;
  state.contract = target.contract;
  state.dim = target.dim;
  state.glow = target.glow;
  state.dotGlow = dotGlowTarget(state);
  // Reduced motion has no scatter to settle: there is no pointer listener.
  state.influence = 0;
}
