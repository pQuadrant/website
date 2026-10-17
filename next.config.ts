import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      // Keep prefetched routes for as long as the page is open. By default they
      // expire after 5 minutes, and a later click on MARKETPLACE or HOME then
      // waits on the server before the stage moves. Safe while every page is
      // prerendered at build time: the stage routes render nothing of their
      // own, and `/privacy` is static text that changes only with a deploy,
      // which Next turns into a full page load. Revisit if a page starts
      // rendering content that changes between deploys.
      static: Infinity,
    },
  },
};

export default nextConfig;
