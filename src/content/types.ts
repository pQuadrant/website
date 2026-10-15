/**
 * Content types for the site's page copy.
 *
 * Every user-facing string on the site is described here and supplied from a
 * file in `src/content/`. Components receive these objects; they never hold a
 * sentence of their own.
 */

/** A link that leaves the page: its visible label and where it goes. */
export interface ExternalLink {
  label: string;
  href: string;
}

/** Top-right cluster: the platform link. */
export interface ChromeTopRightContent {
  platformLink: ExternalLink;
}

/** The text clusters pinned at the corners of the stage. */
export interface ChromeContent {
  topRight: ChromeTopRightContent;
}

/** Everything the home page says. */
export interface HomeContent {
  chrome: ChromeContent;
}
