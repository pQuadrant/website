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
): void {
  context.clearRect(0, 0, width, height);
  paintStars(context, stars);
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
