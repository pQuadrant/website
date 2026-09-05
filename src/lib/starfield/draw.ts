/**
 * Painting for the starfield layer.
 *
 * It holds no values of its own: every number it draws with arrives on the
 * `Star` objects `starfield-points.ts` produced. The one thing it decides is
 * how a star is put on the canvas.
 *
 * The halo is drawn here as a canvas gradient fill, not as a `box-shadow` and
 * not as a blur filter. `docs/design/home.md` prohibits both of those on the
 * stage and that prohibition still stands.
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

  for (const star of stars) {
    const [red, green, blue] = star.colour;
    const fill = `rgba(${red}, ${green}, ${blue}, ${star.opacity})`;

    if (star.haloRadius !== null) {
      const halo = context.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        star.haloRadius,
      );
      halo.addColorStop(0, fill);
      halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

      context.fillStyle = halo;
      context.beginPath();
      context.arc(star.x, star.y, star.haloRadius, 0, TAU);
      context.fill();
    }

    context.fillStyle = fill;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, TAU);
    context.fill();
  }
}
