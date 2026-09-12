import type { ChromeTopLeftContent } from "@/content/types";

/**
 * The top-left cluster: the product line.
 *
 * Specified in `docs/design/chrome.md`. The server line used to sit beneath
 * this one. It is telemetry, wearing telemetry's colour, and it now sits with
 * the rest of it in the bottom-right cluster; what is left here is identity
 * alone — and, now, the two controls that identity is attached to.
 */
interface TopLeftClusterProps {
  content: ChromeTopLeftContent;
}

/**
 * `p_Q`'s treatment, value for value. The page has one control language and
 * this cluster does not get a second one three feet from the first — and this
 * is the only treatment that fits, because the sign-in toggle's bordered box is
 * a control standing on its own in a button bar, and two of those here would
 * turn a line of type into a toolbar. These read as words until a pointer
 * reaches them.
 *
 * The active state is not a duplicate of the hover state. Tailwind emits every
 * `hover:` utility inside `@media (hover: hover)`, so on a touch device the
 * hover rules never apply, and without this a tap would be acknowledged with
 * nothing at all.
 *
 * The focus ring is `focus-visible:`, so it appears for a keyboard and not on a
 * click or a tap, and it sits outside the transition on purpose: a focus
 * indicator that fades in is a focus indicator that is briefly not there.
 *
 * Below the breakpoint each button carries its own 44px hit area. There is no
 * shared row to hold it the way the top-right cluster's row holds its two, and
 * stacked, these two have nothing to disagree with. The label stays 10px — this
 * is padding, not scale. Above the breakpoint the height goes back to the
 * type's own, which is what these were as spans.
 */
const productNameBase =
  "pointer-events-auto flex h-[44px] text-fg-1 text-shadow-glow-1 transition-[color,text-shadow] duration-hover ease-[ease] hover:text-fg-0 hover:text-shadow-glow-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0 active:text-shadow-glow-0 row:block row:h-auto";

/**
 * The label is not centred in its target, and that is what lets both rules hold
 * at once. Centred, two 44px targets put their labels 44px apart, and the pair
 * stops reading as a pair. Here each target keeps its full 44px and the label
 * sits at whichever end is nearer the other name, 7px in: `CONSTELLATION`'s at
 * the bottom of its box, `NORTHSTAR`'s at the top. The two labels then span
 * exactly the 44px the sign-in toggle spans, starting and ending on its edges.
 *
 * The targets still tile at the shared centre line, so neither loses a pixel and
 * they do not overlap. Each one's slack runs outward, away from the other
 * control — the direction a mis-aimed tap goes anyway.
 *
 * Above the breakpoint the padding goes: there is one row, and the three items
 * align on their baselines.
 */
const productNameClasses = {
  first: `${productNameBase} items-end pb-[7px] row:pb-0`,
  second: `${productNameBase} items-start pt-[7px] row:pt-0`,
};

export function TopLeftCluster({ content }: TopLeftClusterProps) {
  return (
    /* A row above the breakpoint, a column below it. As a row the three items
       align on their baselines, not their box centres.

       Stacked, the gap is zero — not a second vertical rhythm but the absence
       of one, because the two 44px hit areas tile directly and there is nothing
       left for a gap to space. 7px on top of them would read as 51px rather
       than as 7px and would open a strip between two adjacent targets where a
       tap lands on neither.

       `items-start` so each button is the width of its own label and no wider,
       which leaves the rest of the corner reaching the motif beneath. */
    <p className="flex flex-col items-start font-mono text-label text-fg-1 text-shadow-glow-1 row:flex-row row:items-baseline row:gap-[14px]">
      <button
        type="button"
        aria-label={content.productOne.accessibleLabel}
        className={productNameClasses.first}
      >
        {content.productOne.label}
      </button>

      {/* A divider rather than a character in a sentence, which is why it is
          markedly dimmer than the names either side of it, and why it is
          drawn here rather than held in `src/content/`. Stacked there is no
          row left to divide, so it goes: a divider between two things sitting
          one above the other is not the same mark.

          It divides two controls now, which changes nothing about it: neither
          control carries a border, a fill or padding, so this still sits
          between two items of type rather than between two boxes.

          It is the one mark in the chrome that does not emit, and it clears
          the inherited glow to stay that way. A halo on a divider makes it
          compete with the names it is there to separate.

          It stays inert. Only the two buttons opt back into the pointer events
          the corner region turns off, so a click anywhere else in this corner
          still reaches the motif. */}
      <span
        aria-hidden="true"
        className="hidden text-separator text-shadow-none row:block"
      >
        /
      </span>

      <button
        type="button"
        aria-label={content.productTwo.accessibleLabel}
        className={productNameClasses.second}
      >
        {content.productTwo.label}
      </button>
    </p>
  );
}
