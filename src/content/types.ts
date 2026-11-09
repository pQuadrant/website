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

/** Top-left cluster: the wordmark, which leads home, and the marketplace. */
export interface ChromeTopLeftContent {
  wordmark: {
    /** The logo's accessible name. It is drawn, not typed, and is the link home. */
    accessibleLabel: string;
  };
  marketplace: string;
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
  /**
   * The link into the marketplace where the top-left MARKETPLACE link is not
   * shown.
   */
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

/** The apply button, its panel and every screen inside it. */
export interface ApplyContent {
  /** The button in the top-right corner. */
  trigger: string;
  /**
   * The same button while an application is open on this device: `long`
   * where the chrome is a row, `short` on a narrow or short window, where the
   * long label runs into the wordmark.
   */
  yourApplication: { long: string; short: string };
  /** The primary action's label while the platform is answering. */
  working: string;
  /** Shown above the actions when a call to the platform fails. */
  errors: {
    network: string;
    server: string;
    /** Cloudflare's check that the visitor is a person did not pass. */
    botCheck: string;
    tooManyRequests: (minutes: number) => string;
    emailFailed: string;
    /** The platform did not accept an answer the browser accepted. */
    invalidAnswers: string;
  };
  /** Under the email field when that address has already applied. */
  emailApplied: { message: string; action: string };
  title: string;
  /** One line under the title per step, about that step's questions. */
  intros: readonly string[];
  /**
   * Which step this is, read to assistive technology only. Nothing is shown:
   * the title, the line under it and CONTINUE or SUBMIT already tell the eye.
   */
  progress: (step: number, steps: number) => string;
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
  /** The optional checkbox under the consent one, asking for marketing emails. */
  marketing: string;
  actions: {
    continue: string;
    back: string;
    submit: string;
  };
  /** Beside CONTINUE on step one, for someone who has applied before. */
  alreadyApplied: {
    question: string;
    action: string;
  };
  /** Opening an application again: an email, and a code sent to it. */
  open: {
    title: string;
    intro: string;
    submit: string;
    /** Under the email field when that address has not applied. */
    notApplied: string;
  };
  /** The email code, after applying or opening an application. */
  code: {
    title: string;
    intro: (email: string) => string;
    field: ApplyFieldContent;
    submit: string;
    resendQuestion: string;
    resend: string;
    /** Shown once a new code has been asked for. */
    resent: string;
    /** Under the code field when the platform does not accept it. */
    wrong: string;
    expired: string;
    tooManyTries: string;
    noCode: string;
    /** The resend link while the platform says to wait. */
    resendIn: (seconds: number) => string;
    tooManyCodes: (minutes: number) => string;
  };
  /** Once the code is confirmed: after applying, or on returning. */
  next: {
    applied: { title: string; body: (firstName: string) => string };
    returning: { title: (firstName: string) => string; body: string };
    /** Under the choices: closes the application on this device. */
    notYou: { question: string; action: string };
    marketplace: string;
    custom: string;
  };
}

/**
 * A block of the privacy policy: a paragraph, a bulleted list, or a paragraph
 * with one link in it, split where the link sits.
 */
export type PrivacyBlock =
  | string
  | { list: readonly string[] }
  | { before: string; link: { label: string; href: string }; after: string };

export interface PrivacySection {
  heading: string;
  blocks: readonly PrivacyBlock[];
}

/** The privacy policy page. */
export interface PrivacyContent {
  title: string;
  /** Shown under the title. */
  updated: string;
  /**
   * The same date as YYYY-MM-DD. Sent with each application as the version of
   * the policy the applicant agreed to; change it with `updated`.
   */
  version: string;
  intro: readonly PrivacyBlock[];
  sections: readonly PrivacySection[];
  /** Linked wherever it appears in the text. */
  contactEmail: string;
  /** The accessible name of the contents list beside the policy. */
  contentsLabel: string;
}
