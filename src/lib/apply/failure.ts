import type { ApplyContent } from "@/content/types";
import type { CallFailure } from "@/lib/apply/platform";

/** Whole minutes to wait, rounded up, at least one. */
export function minutesFrom(seconds: number | undefined): number {
  return Math.max(1, Math.ceil((seconds ?? 60) / 60));
}

/**
 * The line shown above a form's actions for a failed call to the platform.
 * Refusals about one answer, such as a wrong code, are shown under that
 * answer by the form instead, and do not reach here.
 */
export function describeFailure(
  failure: CallFailure,
  errors: ApplyContent["errors"],
): string {
  switch (failure.error) {
    case "network":
      return errors.network;
    case "bot_check_failed":
      return errors.botCheck;
    case "too_many_requests":
      return errors.tooManyRequests(minutesFrom(failure.retryAfterSeconds));
    case "email_failed":
      return errors.emailFailed;
    case "invalid_answers":
      return errors.invalidAnswers;
    default:
      return errors.server;
  }
}
