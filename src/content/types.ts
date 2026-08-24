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

/** Top-left cluster: the product line and the server line. */
export interface ChromeTopLeftContent {
  productOne: string;
  productTwo: string;
  server: string;
}

/** Top-right cluster: the entry point button and the sign-in toggle. */
export interface ChromeTopRightContent {
  entryPoint: { label: string };
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
 * Bottom-right cluster: the city the clock reports. The time itself is
 * generated at runtime and is not content.
 */
export interface ChromeBottomRightContent {
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

/** The submit button's label in each of its three states. */
export interface SignInSubmitContent {
  resting: string;
  processing: string;
  granted: string;
}

/** The two footer links. Destinations are undecided; these are labels only. */
export interface SignInFooterContent {
  forgotPassphrase: string;
  requestAccess: string;
}

/** The sign-in panel. */
export interface SignInPanelContent {
  escape: LabelledControl;
  /** The drawn wordmark is an SVG; this is its accessible label. */
  wordmarkLabel: string;
  subhead: string;
  fields: {
    email: FieldContent;
    passphrase: FieldContent;
  };
  error: SignInErrorContent;
  submit: SignInSubmitContent;
  footer: SignInFooterContent;
}

/** Everything the home page says. */
export interface HomeContent {
  chrome: ChromeContent;
  panel: SignInPanelContent;
}
