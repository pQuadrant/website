import { useEffect, useRef } from "react";

/**
 * Where focus lands when the apply panel opens, moves to a new screen or step,
 * or finds answers that need attention. See Behaviour in
 * `codebase-map/apply.md`.
 *
 * With a mouse or a keyboard it goes to the field, ready to type. On a touch
 * screen, focusing a field opens the keyboard or, for a list, the phone's
 * picker, which covers the step before the visitor has read it. There the form
 * never opens either by itself: focus goes to the step's title instead, which
 * opens nothing and still tells a screen reader where it is.
 *
 * The panel keeps screens it is not showing mounted but `hidden`, so their
 * answers survive; everything here skips them.
 */

const CONTROLS = "input, select, textarea, a[href], button";
const FIELDS = "input, select, textarea";

/** Marks the heading that takes focus in place of a field on touch screens. */
export const STEP_TITLE_ATTRIBUTE = "data-step-title";

export function isTouchScreen(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** The first match in `root` that is not inside a hidden screen. */
function firstShown(root: HTMLElement, selector: string): HTMLElement | null {
  for (const element of root.querySelectorAll<HTMLElement>(selector)) {
    if (element.closest("[hidden]") === null) return element;
  }
  return null;
}

/** The first thing to use in `root`: a field, or a button or link. */
export function focusStart(root: HTMLElement): void {
  const first = firstShown(root, CONTROLS);
  if (first !== null && first.matches(FIELDS) && isTouchScreen()) {
    firstShown(root, `[${STEP_TITLE_ATTRIBUTE}]`)?.focus();
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
  firstShown(root, "[aria-invalid='true']")?.focus();
}

/** What to focus once the next render is on screen. */
export type FocusTarget = "start" | "problem";

/**
 * Asks for focus after the next render, when the step, screen or message being
 * focused exists. `root` is read then, so it can name whichever part is shown.
 */
export function usePendingFocus(
  root: () => HTMLElement | null,
): (target: FocusTarget) => void {
  const pending = useRef<FocusTarget | null>(null);

  useEffect(() => {
    const target = pending.current;
    const element = root();
    if (target === null || element === null) return;
    pending.current = null;
    if (target === "problem") focusProblem(element);
    else focusStart(element);
  });

  return (target) => {
    pending.current = target;
  };
}
