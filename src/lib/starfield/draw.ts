/**
 * Painting for the starfield layer.
 *
 * It holds no values of its own: every number it draws with arrives on the
 * `Star` objects `starfield-points.ts` produced. The one thing it decides is
 * how a star is put on the canvas.
 *
 * Halos are drawn here as canvas gradients, not as a `box-shadow` and not as a
 * blur filter. `docs/design/home.md` prohibits both of those on the stage and
 * that prohibition still stands.
 */

import type { Star } from "@/lib/starfield/starfield-points";

const TAU = Math.PI * 2;

/**
 * Ambient light: the field-wide glow that gives the page its tonal range.
 *
 * Expressed in multiples of the motif radius, which is why it lives on this
 * canvas rather than in a CSS gradient. A gradient's stops are relative to the
 * stage, but the motif's radius is `min(width, height) x 0.44` capped at 396 —
 * a different function of the window. The two drift apart as the window
 * changes, so a gradient tuned to clear the globe at one size lands its ramp on
 * the globe's rim at another, which reads as a halo welded to the sphere.
 *
 * Anchoring the light to the motif instead makes the relationship hold at every
 * size by construction. It is the same radius the density falloff uses.
 */
const AMBIENT = {
  /** Nothing at all inside this many motif radii. */
  hole: 1.35,
  /**
   * Peak alpha, reached at the far corner of the stage.
   *
   * The light belongs outside the motif, not behind it. The globe is a
   * transparent point cloud: light behind it passes between its points and
   * lifts the gaps, which is what collapses the contrast that makes the
   * continents read at all.
   */
  peak: 0.038,
  colour: [226, 236, 250],
} as const;

/**
 * Clears the canvas and paints the field once.
 *
 * Called on mount and after a resize, and never on a timer or an animation
 * frame — the field does not move, so nothing runs once this returns.
 *
 * `width` and `height` are in CSS pixels; the context is expected to already
 * carry the device-pixel-ratio transform.
 */
export function drawStarfield(
  context: CanvasRenderingContext2D,
  stars: readonly Star[],
  width: number,
  height: number,
  motifRadius: number,
): void {
  context.clearRect(0, 0, width, height);
  paintAmbient(context, width, height, motifRadius);
  paintStars(context, stars);
}

/**
 * Paints the ambient glow, before the stars so they sit in front of it.
 *
 * Monotonic from the hole outward: it only ever gets brighter toward the
 * corners, never turning over. A gradient with a peak somewhere in the middle
 * of the stage would put a visible ring on the page at whichever window size
 * moved that peak inside the frame.
 */
function paintAmbient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  motifRadius: number,
): void {
  if (motifRadius <= 0) return;

  const centreX = width / 2;
  const centreY = height / 2;
  const corner = Math.hypot(centreX, centreY);
  const inner = AMBIENT.hole * motifRadius;
  if (corner <= inner) return;

  const [red, green, blue] = AMBIENT.colour;
  const glow = context.createRadialGradient(
    centreX,
    centreY,
    inner,
    centreX,
    centreY,
    corner,
  );

  // Sampled rather than left to the browser's linear interpolation: the ramp is
  // a smoothstep, so it leaves the hole and arrives at the corner with no slope
  // in it. A ramp still moving when it lands shows an edge at its own boundary,
  // which on a dark surface is visible even though no value steps.
  const STEPS = 12;
  for (let step = 0; step <= STEPS; step += 1) {
    const t = step / STEPS;
    const eased = t * t * (3 - 2 * t);
    glow.addColorStop(
      t,
      `rgba(${red}, ${green}, ${blue}, ${(AMBIENT.peak * eased).toFixed(5)})`,
    );
  }

  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
}

/**
 * Paints the field additively.
 *
 * Light adds to what is beneath it rather than covering it, which is the
 * difference between a star that emits and a dot of paint sitting on the
 * background. Where two halos overlap they sum, as two real sources would.
 *
 * The composite mode is set here and restored on the way out rather than being
 * set once by whoever owns the canvas. The cursor response draws its trail with
 * `destination-out` immediately before this runs, and a mode left set by either
 * stage would silently break the other.
 */
function paintStars(
  context: CanvasRenderingContext2D,
  stars: readonly Star[],
): void {
  const previous = context.globalCompositeOperation;
  context.globalCompositeOperation = "lighter";

  for (const star of stars) {
    if (star.haloRadius !== null) {
      const [red, green, blue] = star.haloColour;
      const halo = context.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        star.haloRadius,
      );
      halo.addColorStop(
        0,
        `rgba(${red}, ${green}, ${blue}, ${star.haloAlpha})`,
      );
      halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

      context.fillStyle = halo;
      context.beginPath();
      context.arc(star.x, star.y, star.haloRadius, 0, TAU);
      context.fill();
    }

    // The core last, so it sits on top of its own halo. Hard-edged: the only
    // softness on a star is the halo around it.
    const [red, green, blue] = star.coreColour;
    context.fillStyle = `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${star.coreAlpha})`;
    context.beginPath();
    context.arc(star.x, star.y, star.coreRadius, 0, TAU);
    context.fill();
  }

  context.globalCompositeOperation = previous;
}
