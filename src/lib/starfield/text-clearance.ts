/**
 * Where the type is, for the starfield to keep clear of — see Text clearance in
 * `codebase-map/starfield.md`.
 *
 * Measured from the page rather than written down here, for the same reason
 * `chrome-clearance.ts` measures the corners: the type's position lives in CSS
 * and tiers with the window, and a second copy of it in script would be wrong
 * the first time the design moved. A new piece of type is cleared by carrying
 * the attribute below, and needs nothing else.
 */

import type { ClearRect, StageMode } from "@/lib/starfield/starfield-points";

/**
 * Marks an element as type the stars stay off.
 *
 * The value is the route the type is shown on — `home` or `market` — or empty
 * for type that is on both. The field has one sky per route, and each is
 * cleared only of the type that route shows: the marketplace heading, invisible
 * at home, has no business emptying home's sky.
 */
export const STAR_CLEAR_ATTRIBUTE = "data-star-clear";

/** Every marked element on the page, whichever route it belongs to. */
export function clearElements(): Element[] {
  return Array.from(document.querySelectorAll(`[${STAR_CLEAR_ATTRIBUTE}]`));
}

/**
 * The lines of type one route shows, in viewport coordinates — which are the
 * starfield canvas's coordinates, since it is `fixed` at the viewport's top
 * left.
 *
 * Each line of text is measured, not the element holding it. An element's box
 * is as wide as its layout makes it, and a heading block that runs to the right
 * margin would clear a band of sky with nothing in it. The text nodes are
 * walked one by one rather than the element's contents taken as one range,
 * because a range over an element's contents reports the full box of every
 * block inside it — the same band again.
 *
 * Type on the other route is measured too, while it is hidden: it still has
 * its layout, and its route's sky has to be ready before it fades in.
 */
export function measureClearRects(mode: StageMode): ClearRect[] {
  const rects: ClearRect[] = [];
  const range = document.createRange();

  for (const element of clearElements()) {
    const shownOn = element.getAttribute(STAR_CLEAR_ATTRIBUTE);
    if (shownOn !== "" && shownOn !== mode) continue;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (
      let node = walker.nextNode();
      node !== null;
      node = walker.nextNode()
    ) {
      if (node.textContent?.trim() === "") continue;

      // Text kept for a screen reader only sits in a clipped 1px box, but its
      // words are still laid out, one per line, in a column running down the
      // page from it. The clip hides them; their boxes would still clear sky.
      const holder = node.parentElement?.getBoundingClientRect();
      if (holder === undefined || holder.width < 2 || holder.height < 2) {
        continue;
      }

      range.selectNodeContents(node);

      for (const box of range.getClientRects()) {
        // Not displayed at this window size.
        if (box.width < 2 || box.height < 2) continue;
        rects.push({
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
        });
      }
    }
  }

  return rects;
}
