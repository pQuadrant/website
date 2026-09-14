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
 * On the four fixed corner regions in `Stage.tsx`, not on the clusters inside
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
 * The largest radius, centred on `centreX`/`centreY` in `canvas`'s own
 * coordinates, that clears every corner region by `CHROME_CLEARANCE`.
 *
 * Returns `Infinity` when there is nothing to clear, which makes the term inert
 * rather than collapsing the motif to its floor. A globe rendered without the
 * chrome around it is a legitimate thing to do and is not a reason to shrink.
 *
 * The corner regions are `fixed`, so their boxes are in viewport coordinates
 * and the centre arrives in canvas ones. The canvas's own box is what converts
 * between them; it is read here so that both call sites pass the same two
 * numbers they already hold.
 */
export function chromeClearance(
  canvas: Element,
  centreX: number,
  centreY: number,
): number {
  const regions = document.querySelectorAll(`[${CHROME_CORNER_ATTRIBUTE}]`);
  if (regions.length === 0) return Number.POSITIVE_INFINITY;

  const origin = canvas.getBoundingClientRect();
  const x = origin.left + centreX;
  const y = origin.top + centreY;

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

/**
 * Whether `panel` comes within `CHROME_CLEARANCE` of any corner region, at any
 * scroll position.
 *
 * The regions are fixed and the panel is in the document, so on a window short
 * enough to scroll the panel travels past them. Its reach is therefore taken
 * across the whole scroll — from where it sits at the bottom of the scroll to
 * where it sits at the top — which makes the answer a property of the window's
 * size rather than of the current scroll, and stops the chrome flickering in
 * and out as the page moves.
 *
 * Decides whether the chrome recedes while the panel is open. See _The chrome
 * while the panel is open_ in `docs/design/sign-in-panel.md`.
 */
export function panelMeetsChrome(panel: Element): boolean {
  const regions = document.querySelectorAll(`[${CHROME_CORNER_ATTRIBUTE}]`);
  if (regions.length === 0) return false;

  const box = panel.getBoundingClientRect();
  const root = document.documentElement;
  const travel = Math.max(0, root.scrollHeight - root.clientHeight);

  // In viewport terms: lowest with the page at the top, highest at the bottom.
  const top = box.top + window.scrollY - travel - CHROME_CLEARANCE;
  const bottom = box.bottom + window.scrollY + CHROME_CLEARANCE;
  const left = box.left - CHROME_CLEARANCE;
  const right = box.right + CHROME_CLEARANCE;

  for (const region of regions) {
    const corner = region.getBoundingClientRect();
    if (corner.width === 0 || corner.height === 0) continue;

    if (
      corner.left < right &&
      corner.right > left &&
      corner.top < bottom &&
      corner.bottom > top
    ) {
      return true;
    }
  }

  return false;
}
