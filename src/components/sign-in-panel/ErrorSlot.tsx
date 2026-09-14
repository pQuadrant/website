import { MAX_SIGN_IN_ATTEMPTS } from "@/content/home";
import type { SignInErrorContent, SignInMissingContent } from "@/content/types";

/** What the slot can be showing. */
export type SignInMessage =
  | { kind: "missing"; field: "email" | "password" }
  | { kind: "rejected"; attempt: number };

/**
 * The error slot: present in every state, and always as tall as the tallest
 * message it can show.
 *
 * Specified in `docs/design/sign-in-panel.md`, under _Error slot_.
 */
interface ErrorSlotProps {
  /** Referenced by the fields that a message names. */
  id: string;
  error: SignInErrorContent;
  missing: SignInMissingContent;
  message: SignInMessage | null;
  /** Where the slot sits in the panel's grid. */
  className: string;
}

const MESSAGE = "border-l border-fg-0 pl-3 font-mono text-error";

export function ErrorSlot({
  id,
  error,
  missing,
  message,
  className,
}: ErrorSlotProps) {
  return (
    /* The reserve is laid out rather than stated. The two-line credentials
       message is rendered invisibly in the same grid cell as the live one, so
       the slot is exactly as tall as that message at the current width: 32px
       wherever line two fits, 48px on a window narrow enough to wrap it. A
       fixed 32px would overflow into the submit button there the first time a
       message appeared — the one movement this slot exists to prevent. */
    <div className={`grid ${className}`}>
      <div
        aria-hidden="true"
        className={`invisible [grid-area:1/1] ${MESSAGE}`}
      >
        <p>{error.headline}</p>
        <p>{error.attemptLine(MAX_SIGN_IN_ATTEMPTS)}</p>
      </div>

      {/* Present from the first render, so a message is announced when it
          arrives rather than being missed because the region arrived with it. */}
      <div id={id} role="status" className="[grid-area:1/1]">
        {message?.kind === "rejected" && (
          <div className={MESSAGE}>
            <p className="text-fg-0">{error.headline}</p>
            <p className="text-fg-1">
              {error.attemptLine(
                Math.min(message.attempt, MAX_SIGN_IN_ATTEMPTS),
              )}
            </p>
          </div>
        )}

        {/* One line and no count: nothing was sent. */}
        {message?.kind === "missing" && (
          <div className={MESSAGE}>
            <p className="text-fg-0">{missing[message.field]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
