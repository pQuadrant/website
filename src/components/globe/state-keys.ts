/**
 * SCAFFOLDING — DELETE THIS FILE.
 *
 * A keyboard stand-in for the sign-in form, so the globe's three states can be
 * checked before anything exists to drive them:
 *
 *   F  toggle focused    P  processing    E  error    I  idle
 *
 * The states belong to the form. When the sign-in panel is built it calls
 * `setStatus` and `setFocused` for real, and this file has no reason to exist.
 * Removing it is: delete this file, then delete the two lines in `Globe.tsx`
 * that mention `attachStateKeys`. Nothing else refers to it, and nothing in
 * `src/lib/globe/` knows it is here.
 */

import type { GlobeHandle } from "@/lib/globe/globe";

export function attachStateKeys(globe: GlobeHandle): () => void {
  let focused = false;

  function onKeyDown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch (event.code) {
      case "KeyF":
        focused = !focused;
        globe.setFocused(focused);
        break;
      case "KeyP":
        globe.setStatus("loading");
        break;
      case "KeyE":
        globe.setStatus("error");
        break;
      case "KeyI":
        globe.setStatus("idle");
        break;
      default:
        return;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
