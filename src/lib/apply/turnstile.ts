import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Cloudflare Turnstile, the check that a request to the platform comes from a
 * person. The platform refuses an email check or a code request without a
 * fresh token from it. See Apply flow in `codebase-map/apply.md`.
 *
 * The widget is invisible almost always. When Cloudflare wants an
 * interaction, a small box appears in the element the panel gives it, and
 * nowhere else.
 *
 * Getting a token takes Cloudflare one to two seconds, far longer than the
 * platform takes to answer, so one is got ready ahead of time (`prepare`)
 * and handed over when a call needs it (`token`). Each token works once and
 * for five minutes, so a used or expired one is dropped and the next is got
 * ready on the following `prepare`, not on a timer: a page left open does not
 * keep running Cloudflare's check.
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

/**
 * How long a ready token is handed over for. Cloudflare honours one for 300
 * seconds; the margin covers the call carrying it to the platform, which
 * checks it with Cloudflare.
 */
const TOKEN_USABLE_MS = 270_000;

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

export interface BotCheck {
  /** Starts getting a token, unless one is ready or on its way. */
  prepare: () => void;
  /**
   * A token for one call: the ready one, or the one on its way, or else a new
   * one. Null when the check could not be completed (the script did not load,
   * Cloudflare failed it, or the visitor did not finish an interactive check
   * in time).
   */
  token: () => Promise<string | null>;
}

export function useTurnstile(
  container: RefObject<HTMLElement | null>,
): BotCheck {
  const widgetId = useRef<string | null>(null);
  // The challenge under way: its result goes to `settle`. One at a time,
  // because the widget runs one challenge at a time.
  const settle = useRef<((token: string | null) => void) | null>(null);
  const underway = useRef<Promise<string | null> | null>(null);
  const ready = useRef<{ token: string; at: number } | null>(null);

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
    },
    [],
  );

  const challenge = useCallback(async (): Promise<string | null> => {
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
          // A token is renewed on `prepare`, not by the widget on its own;
          // its age is judged from `ready.at`.
          "refresh-expired": "never",
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
  }, [container]);

  const prepare = useCallback(() => {
    if (underway.current !== null) return;
    const held = ready.current;
    if (held !== null && Date.now() - held.at < TOKEN_USABLE_MS) return;
    ready.current = null;
    underway.current = challenge().then((token) => {
      underway.current = null;
      if (token !== null) ready.current = { token, at: Date.now() };
      return token;
    });
  }, [challenge]);

  const token = useCallback(async (): Promise<string | null> => {
    for (;;) {
      const held = ready.current;
      if (held !== null && Date.now() - held.at < TOKEN_USABLE_MS) {
        ready.current = null;
        return held.token;
      }
      prepare();
      // A failed challenge is reported, not retried. A successful one whose
      // token another call took first goes round again.
      if ((await underway.current) === null) return null;
    }
  }, [prepare]);

  return useMemo(() => ({ prepare, token }), [prepare, token]);
}
