/**
 * The apply flow's buttons and links, shared by APPLY NOW, the panel's screens
 * and their actions. Height is left to each use: APPLY NOW stretches to the
 * chrome row, the rest set their own.
 *
 * Each `hover:` state has a matching `active:` one, because Tailwind emits
 * `hover:` only for devices that hover. The focus ring sits outside the
 * transition so it never fades in.
 */

/** The accent action: APPLY NOW, CONTINUE, SUBMIT, CONFIRM, the marketplace. */
export const PRIMARY_ACTION =
  "flex items-center justify-center border border-accent-bright bg-accent-fill px-chrome-control-pad font-mono text-chrome-label text-fg-0 text-shadow-glow-0 shadow-glow-accent transition-[background-color,box-shadow] duration-hover ease-[ease] hover:bg-accent-fill-hover hover:shadow-glow-accent-hover active:bg-accent-fill-active active:shadow-glow-accent-hover focus-visible:shadow-glow-focus focus-visible:outline-hidden";

/** The quiet action, styled like the PLATFORM link. */
export const SECONDARY_ACTION =
  "flex items-center justify-center border border-fg-2 bg-control-fill px-chrome-control-pad font-mono text-chrome-label text-fg-0 text-shadow-glow-0 transition-[border-color] duration-hover ease-[ease] hover:border-accent-bright active:border-accent-bright focus-visible:shadow-glow-focus focus-visible:outline-hidden";

/** The height of every action inside the panel, matching the chrome row. */
export const ACTION_HEIGHT = "h-chrome-touch row:h-chrome-control";

/** A step back, in plain text beside the primary action: BACK. */
export const TEXT_ACTION =
  "font-mono text-chrome-label text-fg-1 transition-colors duration-hover hover:text-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0";

/** A link inside a sentence: the Privacy Policy, opening an application,
 * sending a new code. */
export const INLINE_LINK =
  "text-fg-0 underline decoration-fg-2 underline-offset-2 transition-[text-decoration-color] duration-hover hover:decoration-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:decoration-fg-0";
