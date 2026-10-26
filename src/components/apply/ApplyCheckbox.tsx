import type { ReactNode } from "react";

/**
 * A checkbox on the apply form, with its label and, when it must be ticked
 * and is not, a message under it saying so. Used for agreeing to the Privacy
 * Policy and for the optional marketing emails.
 *
 * The whole line is the target, so it is tall enough to tap on a phone. The
 * message is tied to the box with `aria-describedby`, as a field's is.
 */

interface ApplyCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown under the line, and marks the box invalid, while it is set. */
  message?: string;
  children: ReactNode;
}

export function ApplyCheckbox({
  id,
  checked,
  onChange,
  message,
  children,
}: ApplyCheckboxProps) {
  const messageId = `${id}-message`;

  return (
    <div className="flex flex-col gap-1 cramped:gap-0.5 row:gap-[7px]">
      <label
        htmlFor={id}
        className="flex min-h-9 items-center gap-3 text-[calc(13*var(--chrome-unit))] leading-snug text-fg-1 cramped:min-h-7 row:min-h-0"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={message !== undefined}
          aria-describedby={message === undefined ? undefined : messageId}
          className="size-4 shrink-0 accent-accent-bright"
        />
        <span className="text-pretty">{children}</span>
      </label>
      {message !== undefined && (
        <p
          id={messageId}
          className="text-[calc(12*var(--chrome-unit))] leading-snug text-error"
        >
          {message}
        </p>
      )}
    </div>
  );
}
