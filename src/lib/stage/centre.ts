/**
 * Where the stage centres what it draws.
 *
 * One definition, read by every layer that needs it: the motif, the starfield's
 * density falloff and the starfield's ambient light. The rule itself lives in
 * CSS, as `--stage-centre-y` in `globals.css`, because the only thing that
 * actually knows how tall the visible viewport is — and how that differs from
 * the canvas, which is `lvh` — is the browser's own viewport units.
 *
 * This module does not decide the value. It resolves the one CSS already holds.
 * See the Motif centring section of `docs/design/home.md`.
 */

const CENTRE_PROPERTY = "--stage-centre-y";

/**
 * The vertical centre, in CSS pixels, for a stage of `stageHeight`.
 *
 * `element` is read rather than the document root because the property
 * inherits: whatever element a layer owns already carries the value, so a
 * caller does not have to reach for `documentElement` and does not have to know
 * where the declaration lives.
 *
 * Falls back to half the stage. The property resolves to a length on every
 * browser that supports `@property`, but a zero would put the motif at the top
 * of the window rather than merely a few pixels out, and that is not a failure
 * worth shipping over a feature query.
 */
export function stageCentreY(element: Element, stageHeight: number): number {
  const raw = getComputedStyle(element).getPropertyValue(CENTRE_PROPERTY);
  const pixels = Number.parseFloat(raw);

  return Number.isFinite(pixels) && pixels > 0 ? pixels : stageHeight / 2;
}
