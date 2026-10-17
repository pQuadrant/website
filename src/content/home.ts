import type { HomeContent } from "@/content/types";

/**
 * Home page copy. The chrome both routes share is in `chrome.ts`.
 *
 * Glyphs are presentation, not language, and live in the components that draw
 * them.
 */

export const homeContent: HomeContent = {
  // Not final. "Operating environment" is the current choice over "software",
  // to say a whole connected suite rather than a one-off tool; "AI-powered
  // business platform" is the shorter alternative.
  tagline: {
    lead: "The AI-powered operating environment that helps businesses understand what is happening, act on it, and continuously improve.",
    emphasis: "All autonomously.",
  },

  browse: "BROWSE AI SYSTEMS",
};
