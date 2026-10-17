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

/**
 * Words kept in capitals when a lowercase company name or role is tidied:
 * job titles, departments and company suffixes people type in lowercase.
 */
const ACRONYMS: ReadonlySet<string> = new Set([
  "ai",
  "ceo",
  "cfo",
  "cio",
  "cmo",
  "coo",
  "cpo",
  "cto",
  "evp",
  "hr",
  "it",
  "pr",
  "svp",
  "vp",
  "dmcc",
  "fz",
  "fze",
  "fzco",
  "llc",
  "uae",
  "uk",
  "usa",
]);

/** True when the text has letters and every one of them is lowercase. */
function allLower(text: string): boolean {
  return text === text.toLowerCase() && text !== text.toUpperCase();
}

/** True when the text has letters and every one of them is a capital. */
function allUpper(text: string): boolean {
  return text === text.toUpperCase() && text !== text.toLowerCase();
}

/** "anne-marie" → "Anne-Marie", "o'neil" → "O'Neil". */
function capitalise(word: string): string {
  return word
    .toLowerCase()
    .replace(/(^|[-'’])(\p{L})/gu, (_, mark: string, letter: string) => {
      return mark + letter.toUpperCase();
    });
}

/** Each hyphenated part in capitals if it is a known acronym: "fz-llc" → "FZ-LLC". */
function acronymOr(word: string, otherwise: (word: string) => string): string {
  const parts = word.split("-");
  return parts.every((part) => ACRONYMS.has(part.toLowerCase()))
    ? word.toUpperCase()
    : otherwise(word);
}

/**
 * An answer as it should be kept and shown back: spacing cleaned up, an email
 * in lowercase, and a name, company or role capitalised when it was typed all
 * in one case. Anything typed in mixed case is left as typed, because it is
 * already a choice: "McDonald", "van der Berg", "eBay". Company names typed in
 * capitals stay in capitals, since they are usually initials. Scripts without
 * capitals, such as Arabic, are left as typed.
 */
export function tidyAnswer(field: ApplicationField, value: string): string {
  if (field === "goal") {
    const text = value.trim().replace(/[ \t]{2,}/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  const text = value.trim().replace(/\s+/g, " ");
  const words = text.split(" ");

  switch (field) {
    case "firstName":
    case "lastName":
      return allLower(text) || allUpper(text)
        ? words.map(capitalise).join(" ")
        : text;
    case "company":
      return allLower(text)
        ? words.map((word) => acronymOr(word, capitalise)).join(" ")
        : text;
    case "role":
      return allLower(text)
        ? words
            .map((word, index) =>
              acronymOr(word, (w) => (index === 0 ? capitalise(w) : w)),
            )
            .join(" ")
        : text;
    case "email":
      return text.toLowerCase();
    default:
      return text;
  }
}
