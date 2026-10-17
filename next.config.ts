import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      // Keep prefetched routes for as long as the page is open. By default they
      // expire after 5 minutes, and a later click on MARKETPLACE or HOME then
      // waits on the server before the stage moves. Safe while the route pages
      // render nothing: everything visible lives in the persistent stage
      // layout, so a cached copy cannot go out of date. Revisit if a route
      // starts rendering server content.
      static: Infinity,
    },
  },
};

export default nextConfig;
