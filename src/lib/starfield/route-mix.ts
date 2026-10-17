/**
 * The timing of the sky's crossfade between routes — see Route transition
 * timing in `codebase-map/routes.md`.
 *
 * The globe's move between the routes is a CSS transition on the motif in
 * `StageShell.tsx`. The stars cannot be a CSS transition, because each one
 * fades by its own share and they are all on one canvas, so the same curve is
 * written out here and the two have to be kept in step by hand.
 */

/** Matches the motif's `duration-800`. */
export const ROUTE_MIX_MS = 800;

/** Matches the motif's `cubic-bezier(0.4, 0, 0.2, 1)`. */
const X1 = 0.4;
const Y1 = 0;
const X2 = 0.2;
const Y2 = 1;

/**
 * The motif's easing curve at `t`, 0 to 1.
 *
 * A cubic Bézier is given as y against a parameter, not against time, so the
 * parameter for this time is found first — by bisection, which on a curve this
 * well-behaved settles well inside a thousandth in twenty steps.
 */
export function routeEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let low = 0;
  let high = 1;
  let s = t;
  for (let step = 0; step < 20; step += 1) {
    s = (low + high) / 2;
    if (bezier(s, X1, X2) < t) low = s;
    else high = s;
  }

  return bezier(s, Y1, Y2);
}

/** One axis of the curve, with its ends fixed at 0 and 1. */
function bezier(s: number, p1: number, p2: number): number {
  const inverse = 1 - s;
  return 3 * inverse * inverse * s * p1 + 3 * inverse * s * s * p2 + s * s * s;
}
