import type { HomeContent } from "@/content/types";

/**
 * Home page copy.
 *
 * Grouped by surface, mirroring the design specification,
 * `docs/design/chrome.md`. Every string below is quoted from that file. If a
 * string here disagrees with the spec, the spec wins.
 *
 * Glyphs are presentation, not language, and live in the components that draw
 * them.
 */

export const homeContent: HomeContent = {
  chrome: {
    topLeft: {
      // Two product names, held apart rather than joined, because each is its
      // own control. Neither surface exists yet, so neither button does
      // anything — but a button still has to say what it will do, and the
      // product name alone does not say it.
      productOne: {
        label: "CONSTELLATION",
        accessibleLabel: "Open Constellation",
      },
      productTwo: {
        label: "NORTHSTAR",
        accessibleLabel: "Open Northstar",
      },
    },

    topRight: {
      // Typed characters in the mono typeface, not the drawn wordmark.
      entryPoint: { label: "p_Q" },

      // The one control in the chrome that leaves the page. Same tab.
      platformLink: {
        label: "PLATFORM",
        href: "https://app.pquadrant.com",
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
      // STATIC DISPLAY VALUE — not live system state. This identifier does not
      // correspond to infrastructure and nothing resolves it.
      server: "SERVER EG-CAI-1",

      // The clock's time is resolved at runtime through the `Africa/Cairo`
      // zone. Only the city name is content.
      city: "CAIRO",
    },
  },
};
