import type { AnswerProblem } from "@/lib/apply/application";

/**
 * The one-time code emailed to confirm an address, when applying and when
 * opening an application again. See Apply flow in `codebase-map/apply.md`.
 *
 * No code is sent or checked yet: the screen accepts any code of the right
 * length, so the flow can be seen end to end before the platform sends codes.
 */

export const CODE_LENGTH = 6;

/** Keeps only the digits, up to the code's length, so a pasted code with a
 * space or a dash in it still fits. */
export function tidyCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function codeProblem(value: string): AnswerProblem | null {
  if (value === "") return "missing";
  return value.length === CODE_LENGTH ? null : "invalid";
}
