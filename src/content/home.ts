import type { HomeContent } from "@/content/types";

/**
 * Home page copy.
 *
 * Grouped by surface. Glyphs are presentation, not language, and live in the
 * components that draw them.
 */

export const homeContent: HomeContent = {
  chrome: {
    topRight: {
      // The one control in the chrome that leaves the page. Same tab.
      platformLink: {
        label: "PLATFORM",
        href: "https://app.pquadrant.com",
      },
    },
  },
};
