/**
 * Where focus lands when the apply panel opens, moves to a new step, or finds
 * answers that need attention. See Behaviour in `codebase-map/apply.md`.
 *
 * With a mouse or a keyboard it goes to the field, ready to type. On a touch
 * screen, focusing a field opens the keyboard or, for a list, the phone's
 * picker, which covers the step before the visitor has read it. There the form
 * never opens either by itself: focus goes to the step's title instead, which
 * opens nothing and still tells a screen reader where it is.
 */

const CONTROLS = "input, select, textarea, a[href], button";
const FIELDS = "input, select, textarea";

/** Marks the heading that takes focus in place of a field on touch screens. */
export const STEP_TITLE_ATTRIBUTE = "data-step-title";

export function isTouchScreen(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** The first thing to use in `root`: a field, or a button or link. */
export function focusStart(root: HTMLElement): void {
  const first = root.querySelector<HTMLElement>(CONTROLS);
  if (first !== null && first.matches(FIELDS) && isTouchScreen()) {
    root.querySelector<HTMLElement>(`[${STEP_TITLE_ATTRIBUTE}]`)?.focus();
    return;
  }
  first?.focus();
}

/**
 * The first field marked invalid. On a touch screen focus stays where it is;
 * the messages are on screen, and the form announces them instead.
 */
export function focusProblem(root: HTMLElement): void {
  if (isTouchScreen()) return;
  root.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
}
