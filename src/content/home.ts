import type { HomeContent } from "@/content/types";

/**
 * Home page copy.
 *
 * Grouped by surface. Glyphs are presentation, not language, and live in the
 * components that draw them.
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
      // The one control in the chrome that leaves the page. Same tab.
      platformLink: {
        label: "PLATFORM",
        href: "https://app.pquadrant.com",
      },
    },
  },
};
