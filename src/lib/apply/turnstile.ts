import { type RefObject, useCallback, useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, the check that a request to the platform comes from a
 * person. The platform refuses an email check or a code request without a
 * fresh token from it. See Apply flow in `codebase-map/apply.md`.
 *
 * The widget is invisible almost always. When Cloudflare wants an
 * interaction, a small box appears in the element the panel gives it, and
 * nowhere else. Each token works once, so every call asks for a new one, one
 * at a time.
 *
 * Cloudflare's script loads only once the panel is first opened, so a visitor
 * who never applies never loads it. Cloudflare is named in the Privacy Policy.
 */

/** Public by design: Turnstile's site key identifies the widget, not a secret. */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFvyma0vww1r5GBB";

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** The longest a visitor is given to complete an interactive check. */
const TOKEN_TIMEOUT_MS = 120_000;

interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi | null> | null = null;

/** Loads Cloudflare's script once; resolves to null if it cannot load. */
export function loadTurnstile(): Promise<TurnstileApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.turnstile ?? null);
    script.onerror = () => {
      loading = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Returns a function that gets a fresh token, or null when the check could
 * not be completed (the script did not load, Cloudflare failed it, or the
 * visitor did not finish an interactive check in time).
 */
export function useTurnstile(
  container: RefObject<HTMLElement | null>,
): () => Promise<string | null> {
  const widgetId = useRef<string | null>(null);
  const settle = useRef<((token: string | null) => void) | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
    },
    [],
  );

  return useCallback(() => {
    const next = queue.current.then(async () => {
      const turnstile = await loadTurnstile();
      const element = container.current;
      if (turnstile === null || element === null) return null;

      return new Promise<string | null>((resolve) => {
        const timer = setTimeout(() => finish(null), TOKEN_TIMEOUT_MS);
        function finish(token: string | null) {
          clearTimeout(timer);
          settle.current = null;
          resolve(token);
        }
        settle.current = finish;

        if (widgetId.current === null) {
          widgetId.current = turnstile.render(element, {
            sitekey: TURNSTILE_SITE_KEY,
            execution: "execute",
            appearance: "interaction-only",
            callback: (token: string) => settle.current?.(token),
            "error-callback": () => {
              settle.current?.(null);
              // Handled here; Cloudflare need not log it to the console.
              return true;
            },
            "timeout-callback": () => settle.current?.(null),
          });
        } else {
          turnstile.reset(widgetId.current);
        }
        turnstile.execute(widgetId.current);
      });
    });
    queue.current = next.catch(() => undefined);
    return next;
  }, [container]);
}
