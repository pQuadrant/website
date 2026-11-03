import { type RefObject, useCallback, useMemo } from "react";

import {
  type CallFailure,
  type CallResult,
  getHumanPass,
} from "@/lib/apply/platform";
import { useTurnstile } from "@/lib/apply/turnstile";

/**
 * Proving to the platform that the panel's calls come from a person, once a
 * visit rather than once a call. See Apply flow in `codebase-map/apply.md`.
 *
 * The email check and code requests carry a human pass, good for 30 minutes,
 * which the platform gives for a Cloudflare Turnstile token (`turnstile.ts`).
 * A Turnstile token works once, and Cloudflare sometimes asks the visitor to
 * click for each new one (often in Safari), so a token per call could show
 * Cloudflare's box for each email they try and again for the code.
 *
 * The pass is asked for the moment Cloudflare passes the visitor, which is
 * usually as the panel opens (`prepare`), not when the first call needs it: a
 * token lasts five minutes, and the visitor may take longer over their email.
 * While a pass is held or on its way, no new Cloudflare check is started.
 *
 * The pass is kept in this page's memory only: not a cookie, not saved, and
 * gone on reload. The website does not read it or track its age; when the
 * platform refuses it, it is dropped, a new one is got, and the call is made
 * once more.
 */

type PassResult = { ok: true; pass: string } | ({ ok: false } & CallFailure);

/** Shared by every mount of the panel until the page reloads. */
let heldPass: string | null = null;
let passOnItsWay: Promise<PassResult> | null = null;

export interface HumanCheck {
  /** Starts getting a pass, unless one is held or on its way. */
  prepare: () => void;
  /**
   * Makes `call` with the pass, getting one first if needed, and again with a
   * new one if the platform refuses it. A Turnstile check that cannot
   * complete is `bot_check_failed`.
   */
  send: <T>(
    call: (humanPass: string) => Promise<CallResult<T>>,
  ) => Promise<CallResult<T>>;
  /** Whether Cloudflare's box is showing, asking the visitor to interact. */
  shown: boolean;
  /** Whether Cloudflare's box is put away after the visitor passed. */
  dismissed: boolean;
}

export function useHumanCheck(
  container: RefObject<HTMLElement | null>,
  /** Called when the box is put away while focus was in it. */
  onFocusLost?: () => void,
): HumanCheck {
  const turnstile = useTurnstile(container, onFocusLost);
  const { token } = turnstile;

  const obtain = useCallback((): Promise<PassResult> => {
    if (heldPass !== null) return Promise.resolve({ ok: true, pass: heldPass });
    passOnItsWay ??= (async (): Promise<PassResult> => {
      const turnstileToken = await token();
      if (turnstileToken === null) {
        return { ok: false, error: "bot_check_failed" };
      }
      const result = await getHumanPass(turnstileToken);
      if (!result.ok) return result;
      heldPass = result.data.humanPass;
      return { ok: true, pass: heldPass };
    })().finally(() => {
      passOnItsWay = null;
    });
    return passOnItsWay;
  }, [token]);

  // A pass that fails here is got again by the call that needs it.
  const prepare = useCallback(() => void obtain(), [obtain]);

  const send = useCallback(
    async <T>(
      call: (humanPass: string) => Promise<CallResult<T>>,
    ): Promise<CallResult<T>> => {
      for (let attempt = 1; ; attempt++) {
        const got = await obtain();
        if (!got.ok) return got;
        const result = await call(got.pass);
        if (result.ok || result.error !== "bot_check_failed" || attempt > 1) {
          return result;
        }
        // Run out, or no longer accepted. Another call may already have
        // replaced it.
        if (heldPass === got.pass) heldPass = null;
      }
    },
    [obtain],
  );

  return useMemo(
    () => ({
      prepare,
      send,
      shown: turnstile.shown,
      dismissed: turnstile.dismissed,
    }),
    [prepare, send, turnstile.shown, turnstile.dismissed],
  );
}
