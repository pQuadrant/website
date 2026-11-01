import type { AnswerProblem } from "@/lib/apply/application";

/**
 * The one-time code emailed to confirm an address, when applying and when
 * opening an application again. See Apply flow in `codebase-map/apply.md`.
 *
 * The platform makes, sends and checks every code; these only shape what is
 * typed before it is sent. Its rules are under Email codes in the platform
 * repository's `docs/data-model.md`.
 */

export const CODE_LENGTH = 6;

/**
 * Seconds the platform makes a visitor wait between codes. The code screen
 * counts down from it, and from whatever the platform says when asked early.
 */
export const NEW_CODE_WAIT_SECONDS = 60;

/** Keeps only the digits, up to the code's length, so a pasted code with a
 * space or a dash in it still fits. */
export function tidyCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function codeProblem(value: string): AnswerProblem | null {
  if (value === "") return "missing";
  return value.length === CODE_LENGTH ? null : "invalid";
}
