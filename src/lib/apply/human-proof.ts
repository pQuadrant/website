import { type RefObject, useCallback, useMemo } from "react";

import type { CallResult, HumanProof } from "@/lib/apply/platform";
import { useTurnstile } from "@/lib/apply/turnstile";

/**
 * Proving to the platform that the panel's calls come from a person, once a
 * visit rather than once a call. See Apply flow in `codebase-map/apply.md`.
 *
 * The email check and code requests need proof. The first is a Cloudflare
 * Turnstile token (`turnstile.ts`); the platform answers it with a human pass,
 * good for 30 minutes, which later calls send instead. A Turnstile token works
 * once, and Cloudflare sometimes asks the visitor to click for each new one
 * (often in Safari), so without the pass the visitor could see Cloudflare's
 * box for each email they try and again for the code.
 *
 * The pass is kept in this page's memory only: not a cookie, not saved, and
 * gone on reload. The website does not read it or track its age; when the
 * platform refuses it, it is dropped and the call is made once more with a
 * Turnstile token.
 */

/** Shared by every mount of the panel until the page reloads. */
let heldPass: string | null = null;

export interface HumanCheck {
  /** Gets a Turnstile token ready, unless a pass makes one unnecessary. */
  prepare: () => void;
  /**
   * Makes `call` with the pass, or with a Turnstile token when there is no
   * pass or the platform refused it, and keeps the pass the answer returns.
   * A Turnstile check that cannot complete is `bot_check_failed`.
   */
  send: <T extends { humanPass?: string }>(
    call: (proof: HumanProof) => Promise<CallResult<T>>,
  ) => Promise<CallResult<T>>;
  /** Whether Cloudflare's box is showing, asking the visitor to interact. */
  shown: boolean;
}

export function useHumanCheck(
  container: RefObject<HTMLElement | null>,
): HumanCheck {
  const turnstile = useTurnstile(container);
  const { prepare: prepareToken, token } = turnstile;

  const prepare = useCallback(() => {
    if (heldPass === null) prepareToken();
  }, [prepareToken]);

  const send = useCallback(
    async <T extends { humanPass?: string }>(
      call: (proof: HumanProof) => Promise<CallResult<T>>,
    ): Promise<CallResult<T>> => {
      const keep = (result: CallResult<T>) => {
        if (result.ok && typeof result.data.humanPass === "string") {
          heldPass = result.data.humanPass;
        }
        return result;
      };

      const pass = heldPass;
      if (pass !== null) {
        const result = await call({ humanPass: pass });
        if (result.ok || result.error !== "bot_check_failed")
          return keep(result);
        // Run out, or no longer accepted. Another call may already have
        // replaced it.
        if (heldPass === pass) heldPass = null;
      }

      const turnstileToken = await token();
      if (turnstileToken === null)
        return { ok: false, error: "bot_check_failed" };
      return keep(await call({ turnstileToken }));
    },
    [token],
  );

  return useMemo(
    () => ({ prepare, send, shown: turnstile.shown }),
    [prepare, send, turnstile.shown],
  );
}
