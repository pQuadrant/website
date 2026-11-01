/**
 * The apply panel's calls to the pQuadrant platform's API. Every request and
 * answer the panel exchanges with the platform passes through here, so the
 * contract lives in one place. The platform's side, with every refusal code,
 * is under Apply endpoints in the platform repository's `apps/api/README.md`.
 * See Apply flow in `codebase-map/apply.md`.
 *
 * Calls send `credentials: "include"`, so the cookie that keeps an application
 * open on this device is stored and sent back. The cookie belongs to
 * api.pquadrant.com and is only kept when the site is served from
 * pquadrant.com: from `localhost`, applying works but the site does not
 * remember the applicant after a reload.
 */

/**
 * The platform's API. Public: it is in every visitor's browser. Overridden
 * by `NEXT_PUBLIC_PLATFORM_API_URL`, for a platform API running elsewhere.
 */
export const PLATFORM_API_URL =
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ?? "https://api.pquadrant.com";

/** What a refused or failed call says, for the panel to word. */
export interface CallFailure {
  /**
   * The platform's refusal code, such as `wrong_code`, or `network` when the
   * platform could not be reached, or `server` for an unexpected answer.
   */
  error: string;
  /** Seconds until trying again will work, where the platform says. */
  retryAfterSeconds?: number;
}

export type CallResult<T> =
  { ok: true; data: T } | ({ ok: false } & CallFailure);

async function call<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
): Promise<CallResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${PLATFORM_API_URL}${path}`, {
      method,
      credentials: "include",
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "network" };
  }

  const answer: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) return { ok: true, data: answer as T };

  const refusal = (answer ?? {}) as Partial<CallFailure>;
  return {
    ok: false,
    error: typeof refusal.error === "string" ? refusal.error : "server",
    retryAfterSeconds:
      typeof refusal.retryAfterSeconds === "number"
        ? refusal.retryAfterSeconds
        : undefined,
  };
}

/** What the platform says back once an application is open on this device. */
export interface OpenApplication {
  firstName: string;
}

export type CodePurpose = "apply" | "open";

/** Has this email applied? Needs a Turnstile token. */
export function checkEmail(email: string, turnstileToken: string) {
  return call<{ applied: boolean }>("/email-checks", "POST", {
    email,
    turnstileToken,
  });
}

/** Emails a code, to apply or to open an application. Needs a Turnstile token. */
export function sendCode(
  email: string,
  purpose: CodePurpose,
  turnstileToken: string,
) {
  return call<{ sentTo: string }>("/email-codes", "POST", {
    email,
    purpose,
    turnstileToken,
  });
}

export interface NewApplication {
  email: string;
  code: string;
  answers: {
    firstName: string;
    lastName: string;
    company: string;
    role: string;
    companySize: string;
    phone: string;
    goal: string;
  };
  /** The Privacy Policy's "last updated" date as YYYY-MM-DD. */
  privacyPolicyVersion: string;
  marketingOptIn: boolean;
  timeZone: string;
}

/** Creates the applicant with the code, and opens the application here. */
export function submitApplication(application: NewApplication) {
  return call<OpenApplication>("/applications", "POST", application);
}

/** Opens an existing application here with the code. */
export function openApplication(email: string, code: string) {
  return call<OpenApplication>("/applications/open", "POST", { email, code });
}

/** The application open on this device, if any. */
export function currentApplication() {
  return call<OpenApplication>("/applications/current", "GET");
}

/** "Not you?": closes the application on this device. */
export function closeApplication() {
  return call<null>("/applications/current", "DELETE");
}

/** The device's time zone, for arranging demos. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
}
