/**
 * Content types for the site's page copy.
 *
 * Every user-facing string on the site is described here and supplied from a
 * file in `src/content/`. Components receive these objects; they never hold a
 * sentence of their own.
 */

/** A control whose visible label does not, on its own, describe its action. */
export interface LabelledControl {
  label: string;
  accessibleLabel: string;
}

/**
 * Top-left cluster: the product line. Both names are controls, so each carries
 * an accessible name as well as a visible one — a product name on its own does
 * not say what its button does. The separator between them is decorative and
 * belongs to the component.
 */
export interface ChromeTopLeftContent {
  productOne: LabelledControl;
  productTwo: LabelledControl;
}

/** A link that leaves the page: its visible label and where it goes. */
export interface ExternalLink {
  label: string;
  href: string;
}

/** Top-right cluster: the platform link. */
export interface ChromeTopRightContent {
  platformLink: ExternalLink;
}

/** The text clusters pinned at the top corners of the stage. */
export interface ChromeContent {
  topLeft: ChromeTopLeftContent;
  topRight: ChromeTopRightContent;
}

/** Everything the home page says. */
export interface HomeContent {
  chrome: ChromeContent;
}
