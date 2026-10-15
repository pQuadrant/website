/**
 * How much room the corner chrome leaves the motif.
 *
 * One of the four terms in the radius rule — see the Motif sizing section of
 * `docs/design/home.md`, which is where the rule lives. This module answers
 * only "how close does the chrome come to this point", and the caller decides
 * what to do with the answer.
 *
 * It measures the chrome where the chrome actually is rather than recomputing
 * the margins and offsets in script. Those live in CSS, they tier with the
 * window, and two of them moved in the last two tickets; a second copy of them
 * here would be a second thing to keep in step and would be wrong the first
 * time it was not.
 */

/**
 * Marks a corner region as something the motif has to clear.
 *
 * On the fixed corner regions in `Stage.tsx`, not on the clusters inside
 * them: the region carries the margin, and the margin is the part the motif has
 * to stay out of.
 */
export const CHROME_CORNER_ATTRIBUTE = "data-chrome-corner";

/**
 * How far the sphere's edge is held back from the type.
 *
 * The same number the visible viewport's top and bottom are held back by, so
 * this page has one clearance and not two. See `docs/design/home.md`.
 */
export const CHROME_CLEARANCE = 24;

/**
 * The largest radius, centred on `x`/`y` in viewport coordinates, that clears
 * every corner region by `CHROME_CLEARANCE`.
 *
 * Returns `Infinity` when there is nothing to clear, which makes the term inert
 * rather than collapsing the motif to its floor. A globe rendered without the
 * chrome around it is a legitimate thing to do and is not a reason to shrink.
 *
 * Viewport coordinates, and the callers' canvas coordinates are the same
 * numbers: every canvas on the stage is `fixed` at the viewport's top left. The
 * canvas's own box is deliberately not read to convert between them. When the
 * marketplace shrinks the motif, its canvas is transformed, and a transformed
 * box would hand this a centre and a scale that are not the globe's.
 */
export function chromeClearance(x: number, y: number): number {
  const regions = document.querySelectorAll(`[${CHROME_CORNER_ATTRIBUTE}]`);
  if (regions.length === 0) return Number.POSITIVE_INFINITY;

  let nearest = Number.POSITIVE_INFINITY;

  for (const region of regions) {
    const box = region.getBoundingClientRect();

    // The point of the box closest to the centre. Clamping the centre into the
    // box's own range gives it for all nine cases at once — beside the box, above
    // or below it, or diagonally off one of its corners — without branching on
    // which corner of the stage this region sits in.
    const nearestX = Math.max(box.left, Math.min(x, box.right));
    const nearestY = Math.max(box.top, Math.min(y, box.bottom));

    const distance = Math.hypot(nearestX - x, nearestY - y);
    if (distance < nearest) nearest = distance;
  }

  return nearest - CHROME_CLEARANCE;
}
