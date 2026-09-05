import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pQuadrant",
    short_name: "pQuadrant",
    description:
      "AI-powered software that helps businesses understand what is happening, act on it, and continuously improve.",
    start_url: "/",
    display: "standalone",
    // Both are the stage fill. `background_color` is what the platform paints
    // while a launch from the home screen is starting, so a white one flashes
    // white before the dark page arrives. See the note in `layout.tsx`: this
    // value is `--color-stage`, written out because a manifest cannot read a
    // CSS custom property.
    background_color: "#020306",
    theme_color: "#020306",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
