import type { ApplicationField } from "@/lib/apply/application";

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

/** Top-right cluster: the platform link. APPLY NOW's copy is in `ApplyContent`. */
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

/** One question on the apply form. */
export interface ApplyFieldContent {
  label: string;
  placeholder?: string;
  /** Shown under the field when a required answer is left blank. */
  missing?: string;
  /** Shown under the field when the answer cannot be right as typed. */
  invalid?: string;
}

/** The apply button, its panel, the form inside it and what follows. */
export interface ApplyContent {
  /** The button in the top-right corner. */
  trigger: string;
  title: string;
  /** One line under the title per step, about that step's questions. */
  intros: readonly string[];
  /** Step progress, shown to the eye and read to assistive technology. */
  progress: {
    shown: (step: number, steps: number) => string;
    spoken: (step: number, steps: number) => string;
  };
  /** Set beside the label of a question that may be left blank. */
  optional: string;
  /**
   * Read to assistive technology on a touch screen when a step cannot go on,
   * where focus stays put rather than opening the keyboard on a field.
   */
  problems: (count: number) => string;
  /** The empty first choice of a list. */
  choose: string;
  fields: Record<ApplicationField, ApplyFieldContent>;
  companySizes: readonly string[];
  consent: {
    /** The sentence around the link, split where the link sits. */
    before: string;
    link: string;
    after: string;
    href: string;
    missing: string;
    /** Read with the link: it opens in a new tab so the form is kept. */
    opensInNewTab: string;
  };
  actions: {
    continue: string;
    back: string;
    submit: string;
  };
  success: {
    title: string;
    body: (firstName: string) => string;
    marketplace: string;
    custom: string;
  };
}

/** A block of the privacy policy: a paragraph, or a bulleted list. */
export type PrivacyBlock = string | { list: readonly string[] };

export interface PrivacySection {
  heading: string;
  blocks: readonly PrivacyBlock[];
}

/** The privacy policy page. */
export interface PrivacyContent {
  title: string;
  /** Shown under the title. */
  updated: string;
  intro: readonly PrivacyBlock[];
  sections: readonly PrivacySection[];
  /** Linked wherever it appears in the text. */
  contactEmail: string;
  /** The accessible name of the contents list beside the policy. */
  contentsLabel: string;
}
