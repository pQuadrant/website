import type { HomeContent } from "@/content/types";

/**
 * Home page copy.
 *
 * Grouped by surface, mirroring the design specifications:
 * `docs/design/chrome.md` and `docs/design/sign-in-panel.md`. Every string
 * below is quoted from one of those two files. If a string here disagrees with
 * the spec, the spec wins.
 *
 * Glyphs and the passphrase field's bullet mask are presentation, not
 * language, and live in the components that draw them.
 */

/**
 * The number of sign-in attempts allowed before the account is locked out.
 *
 * Named once because the error copy asserts it to the visitor and the rate
 * limiter will have to enforce the same number. The copy is only true while
 * those two agree.
 */
export const MAX_SIGN_IN_ATTEMPTS = 5;

export const homeContent: HomeContent = {
  chrome: {
    topLeft: {
      // Two product names, held apart rather than joined, because they become
      // independently clickable later.
      productOne: "CONSTELLATION",
      productTwo: "NORTHSTAR",

      // STATIC DISPLAY VALUE — not live system state. This identifier does not
      // correspond to infrastructure and nothing resolves it.
      server: "SERVER EG-CAI-1",
    },

    topRight: {
      // Typed characters in the mono typeface, not the drawn wordmark.
      entryPoint: { label: "p_Q" },

      signInToggle: {
        closed: {
          label: "SIGN IN",
          accessibleLabel: "Open sign-in panel",
        },
        open: {
          label: "CLOSE",
          accessibleLabel: "Close sign-in panel",
        },
      },
    },

    bottomLeft: {
      // STATIC DISPLAY VALUES — not live system state. `PQ-CORE 4.2.118` names
      // no service and the version is not derived from `package.json`, a build
      // variable, or anything else. The transport string describes how the site
      // is served but is written rather than measured; do not read the live
      // connection to populate it. Its separator is a middle dot (U+00B7).
      coreVersion: "PQ-CORE 4.2.118",
      transport: "TLS 1.3 · AES-256-GCM",
    },

    bottomRight: {
      // The clock's time is resolved at runtime through the `Africa/Cairo`
      // zone. Only the city name is content.
      city: "CAIRO",
    },
  },

  panel: {
    // `ESC` alone does not describe the action to a screen reader.
    escape: {
      label: "ESC",
      accessibleLabel: "Close sign-in panel",
    },

    wordmarkLabel: "pQuadrant",
    subhead: "AUTHENTICATED ACCESS ONLY",

    fields: {
      email: {
        label: "EMAIL",
        placeholder: "name@company.com",
      },
      passphrase: {
        // The placeholder is a bullet mask, which is presentation and belongs
        // to the component.
        label: "PASSPHRASE",
      },
    },

    error: {
      headline: "CREDENTIALS NOT RECOGNISED",

      // One-based, counting attempts already made: the first failure reads
      // `ATTEMPT 1 OF 5`. The separator is a middle dot (U+00B7).
      attemptLine: (attempt: number) =>
        `ATTEMPT ${attempt} OF ${MAX_SIGN_IN_ATTEMPTS} · SESSION LOGGED`,
    },

    submit: {
      resting: "SIGN IN",
      processing: "AUTHENTICATING",
      granted: "ACCESS GRANTED",
    },

    footer: {
      // Labels only. Neither destination has been decided, and the trailing
      // arrow on `REQUEST ACCESS` is a glyph the component draws.
      forgotPassphrase: "FORGOT PASSPHRASE",
      requestAccess: "REQUEST ACCESS",
    },
  },
};
