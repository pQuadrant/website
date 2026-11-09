import type { ChromeContent } from "@/content/types";

/**
 * Copy for the chrome pinned to the top corners, shown on both routes.
 *
 * Glyphs are presentation, not language, and live in the components that draw
 * them.
 */

export const chromeContent: ChromeContent = {
  topLeft: {
    wordmark: { accessibleLabel: "pQuadrant home" },
    marketplace: "MARKETPLACE",
  },

  topRight: {
    // The one control in the chrome that leaves the page. Same tab.
    platformLink: {
      label: "PLATFORM",
      href: "https://app.pquadrant.com",
    },
  },
};
