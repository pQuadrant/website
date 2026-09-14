"use client";

import { type RefObject, useEffect, useRef } from "react";

/** Everything Tab can land on inside the panel. */
const FOCUSABLE =
  "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

/**
 * Contains keyboard focus within the panel while it is open, and closes it on
 * Escape.
 *
 * Both listen on the document rather than on the panel. Focus can leave the
 * panel without the keyboard — a click on the globe sends it to the document —
 * and from there Escape should still close and Tab should come back in, not
 * walk into the chrome. See _Keyboard, focus and the on-screen keyboard_ in
 * `docs/design/sign-in-panel.md`.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  // Held in a ref so a new callback does not re-subscribe the listener.
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const panel = ref.current;
      if (panel === null) return;

      if (event.key === "Escape") {
        // An input method uses Escape to cancel a composition.
        if (event.isComposing) return;
        event.preventDefault();
        escape.current();
        return;
      }

      if (event.key !== "Tab") return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // The panel itself takes focus on a coarse pointer, and counts as outside
      // its own controls: the next Tab goes to the first of them.
      const within =
        active !== null && active !== panel && panel.contains(active);

      if (!within) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ref]);
}
