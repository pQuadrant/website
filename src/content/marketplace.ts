import type { MarketplaceContent } from "@/content/types";

/**
 * Marketplace copy. The chrome both routes share is in `chrome.ts`.
 *
 * Placeholder, and live on production; none of it is final. The catalogue's
 * rows, cards and search field stand in for real offerings and do nothing yet.
 * See Marketplace copy and platform data in `codebase-map/content.md`.
 */

export const marketplaceContent: MarketplaceContent = {
  heading: "AI Systems",
  subline: "Pick the job you need done.",

  catalogue: {
    regionLabel: "AI systems catalogue",
    searchPlaceholder: "Search (focus test)",
    rows: [
      "Popular",
      "Automations",
      "Agents",
      "Artificial Employees",
      "More",
      "Even more",
    ],
    cardLabel: "System",
  },
};
