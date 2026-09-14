/**
 * SCAFFOLDING — DELETE THIS FILE.
 *
 * A stand-in for the authentication backend, so the panel's processing, granted
 * and invalid-credentials states can be reviewed before a backend exists. It
 * sends nothing anywhere.
 *
 * Off unless the build is made with `NEXT_PUBLIC_SIGN_IN_PREVIEW=1`, which is set
 * in a developer's own `.env.local` and must never be set on a deployment: the
 * rejection it produces tells the visitor their session is logged and their
 * attempts are limited, and neither is true. See _Submission_ in
 * `docs/design/sign-in-panel.md`.
 *
 *   password `pquadrant`  granted, after 1.5s
 *   anything else         rejected, after 1.5s
 *
 * Removing it is: delete this file, then delete the import and the one prop in
 * `src/app/page.tsx` that mention `previewAuthenticate`. Nothing else refers to
 * it. When a backend lands, it is supplied through that same prop.
 */

import type { Authenticate } from "@/components/sign-in-panel/SignInPanel";

const PREVIEW_PASSWORD = "pquadrant";
const PREVIEW_DELAY_MS = 1500;

export const previewAuthenticate: Authenticate | undefined =
  process.env.NEXT_PUBLIC_SIGN_IN_PREVIEW === "1"
    ? ({ password }) =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(password === PREVIEW_PASSWORD ? "granted" : "rejected"),
            PREVIEW_DELAY_MS,
          ),
        )
    : undefined;
