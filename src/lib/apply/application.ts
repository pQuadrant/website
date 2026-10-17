/**
 * What the apply form asks for, and the rule each answer has to meet.
 *
 * The form checks these in the browser. Nothing is sent anywhere yet: where an
 * application goes, and what the server checks again, is the next step of the
 * apply flow. See Apply flow in `codebase-map/apply.md`.
 */

/** The questions, in the order asked, one list per step. */
export const APPLICATION_STEPS = [
  ["firstName", "lastName", "email", "company", "role"],
  ["companySize", "phone", "goal"],
] as const;

export type ApplicationField = (typeof APPLICATION_STEPS)[number][number];

export type ApplicationAnswers = Record<ApplicationField, string>;

export const EMPTY_ANSWERS: ApplicationAnswers = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  role: "",
  companySize: "",
  phone: "",
  goal: "",
};

/** Answers a visitor may leave blank. */
const OPTIONAL: ReadonlySet<ApplicationField> = new Set(["phone"]);

export function isOptional(field: ApplicationField): boolean {
  return OPTIONAL.has(field);
}

/**
 * The longest answer each field takes. The field stops accepting input there,
 * so length never needs an error message of its own. 254 is the longest
 * address email allows.
 */
export const MAX_LENGTH: Record<ApplicationField, number> = {
  firstName: 100,
  lastName: 100,
  email: 254,
  company: 200,
  role: 100,
  companySize: 20,
  phone: 30,
  goal: 1000,
};

/** Why an answer cannot be accepted, if it cannot. */
export type AnswerProblem = "missing" | "invalid";

/**
 * Something before the @, and a domain with at least one dot and no spaces.
 * Loose on purpose: it catches typing slips, not unusual but real addresses.
 * Whether the address exists is only known once a code sent to it comes back.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

/** Digits with the usual separators, and an optional leading +. */
const PHONE = /^\+?[\d\s().-]+$/;

/** International numbers run to 15 digits; very few are shorter than 7. */
const PHONE_DIGITS = { min: 7, max: 15 };

export function answerProblem(
  field: ApplicationField,
  value: string,
): AnswerProblem | null {
  const answer = value.trim();
  if (answer === "") return isOptional(field) ? null : "missing";

  if (field === "email" && !EMAIL.test(answer)) return "invalid";
  if (field === "phone") {
    const digits = answer.replace(/\D/g, "").length;
    if (
      !PHONE.test(answer) ||
      digits < PHONE_DIGITS.min ||
      digits > PHONE_DIGITS.max
    ) {
      return "invalid";
    }
  }
  return null;
}
