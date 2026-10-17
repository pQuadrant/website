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

/** Top-left cluster: the wordmark, and the switch between the two routes. */
export interface ChromeTopLeftContent {
  wordmark: {
    label: string;
    /** Read in place of the label: the wordmark is the link home. */
    accessibleLabel: string;
  };
  switch: {
    home: string;
    marketplace: string;
  };
}

/** Top-right cluster: the platform link. */
export interface ChromeTopRightContent {
  platformLink: ExternalLink;
}

/** The text clusters pinned at the corners of the stage, on both routes. */
export interface ChromeContent {
  topLeft: ChromeTopLeftContent;
  topRight: ChromeTopRightContent;
}

/**
 * The home page's tagline. Held in two parts because the last words are set
 * apart — brighter, later, and underlined — and that split is a decision about
 * the copy, not about the component.
 */
export interface TaglineContent {
  lead: string;
  emphasis: string;
}

/** Everything the home page says, beyond the chrome both routes share. */
export interface HomeContent {
  tagline: TaglineContent;
  /** The link into the marketplace where the route switch is not shown. */
  browse: string;
}

/** Everything the marketplace says, beyond the chrome both routes share. */
export interface MarketplaceContent {
  heading: string;
  subline: string;
  catalogue: {
    /** The accessible name of the catalogue's scrolling region. */
    regionLabel: string;
    searchPlaceholder: string;
    rows: readonly string[];
    /** Each card reads as this label followed by its number. */
    cardLabel: string;
  };
}
