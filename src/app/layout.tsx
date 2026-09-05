import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: "400",
  display: "block",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: "400",
  display: "block",
});

export const metadata: Metadata = {
  title: "pQuadrant",
  description:
    "AI-powered software that helps businesses understand what is happening, act on it, and continuously improve.",
};

/**
 * The parts of the page the browser draws for itself.
 *
 * The width and initial scale are not set here: Next writes the viewport meta
 * tag with both by default, and repeating them adds nothing.
 */
export const viewport: Viewport = {
  // The stage fill, so the browser tints its own surfaces to match instead of
  // framing the page in its default grey. Neither a meta tag nor a web app
  // manifest can read a CSS custom property, so this value is written out here,
  // in `manifest.ts`, and as `--color-stage` in `globals.css`. All three are the
  // same colour and have to stay that way.
  themeColor: "#020306",

  // The stage fills the display exactly, which on a notched phone means
  // reaching under the notch and the home indicator rather than being
  // letterboxed inside them. The chrome is held clear of both by the safe-area
  // padding on the corner regions in `Stage`.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full scheme-dark bg-stage antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
