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

/** Top-right cluster: the entry point button and the platform link. */
export interface ChromeTopRightContent {
  entryPoint: { label: string };
  platformLink: ExternalLink;
  signInToggle: {
    closed: LabelledControl;
    open: LabelledControl;
  };
}

/** Bottom-left cluster: the core version and the transport line. */
export interface ChromeBottomLeftContent {
  coreVersion: string;
  transport: string;
}

/**
 * Bottom-right cluster: the server line, then the city the clock reports. The
 * time itself is generated at runtime and is not content.
 */
export interface ChromeBottomRightContent {
  server: string;
  city: string;
}

/** The four text clusters pinned at the corners of the stage. */
export interface ChromeContent {
  topLeft: ChromeTopLeftContent;
  topRight: ChromeTopRightContent;
  bottomLeft: ChromeBottomLeftContent;
  bottomRight: ChromeBottomRightContent;
}

/** A form field's visible label and, where one is specified, its placeholder. */
export interface FieldContent {
  label: string;
  placeholder?: string;
}

/** The invalid-credentials message. */
export interface SignInErrorContent {
  /** Line one, shown whenever the message is showing. */
  headline: string;
  /**
   * Line two. Takes the number of attempts already made and returns the whole
   * sentence, so the string is never assembled outside this file.
   */
  attemptLine: (attempt: number) => string;
}

/**
 * The one-line messages shown when a field is submitted empty. Deliberately not
 * the credentials error: nothing was sent and no attempt was counted.
 */
export interface SignInMissingContent {
  email: string;
  password: string;
}

/** The submit button's label in each of its three states. */
export interface SignInSubmitContent {
  resting: string;
  processing: string;
  granted: string;
}

/** The two footer links. Destinations are undecided; these are labels only. */
export interface SignInFooterContent {
  forgotPassword: string;
  requestAccess: string;
}

/** The sign-in panel. */
export interface SignInPanelContent {
  /** The dialog's accessible name. */
  dialogLabel: string;
  escape: LabelledControl;
  /**
   * The wordmark's accessible label — and, until the drawn mark is supplied,
   * the typed stand-in's visible text.
   */
  wordmarkLabel: string;
  subhead: string;
  fields: {
    email: FieldContent;
    password: FieldContent;
  };
  error: SignInErrorContent;
  missing: SignInMissingContent;
  submit: SignInSubmitContent;
  footer: SignInFooterContent;
}

/** Everything the home page says. */
export interface HomeContent {
  chrome: ChromeContent;
  panel: SignInPanelContent;
}
