"use client";

import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

import type { FieldContent } from "@/content/types";

/**
 * One of the panel's two fields: a label above an input, 9px apart.
 *
 * Specified in `docs/design/sign-in-panel.md`, under _Fields_.
 */
interface SignInFieldProps {
  kind: "email" | "password";
  content: FieldContent;
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Read-only while a sign-in is processing and after access is granted. */
  readOnly: boolean;
  /** Named by a message: the bottom rule turns `fg-0`. */
  flagged: boolean;
  /** The error slot, which describes the field while it is flagged. */
  messageId: string;
  /** Where the field sits in the panel's grid, which is the panel's business. */
  className: string;
}

/**
 * What differs between the two fields. The bullet mask is presentation rather
 * than language, so it is drawn here and not held in `src/content/`.
 */
const KINDS = {
  email: {
    type: "email",
    name: "email",
    autoComplete: "username",
    inputMode: "email",
    enterKeyHint: "next",
    autoCapitalize: "none",
    autoCorrect: "off",
    value: "text-value-email",
  },
  password: {
    type: "password",
    name: "password",
    autoComplete: "current-password",
    inputMode: undefined,
    enterKeyHint: "go",
    autoCapitalize: undefined,
    autoCorrect: undefined,
    value: "text-value-password",
  },
} as const;

const PASSWORD_PLACEHOLDER = "•".repeat(12);

export function SignInField({
  kind,
  content,
  inputRef,
  value,
  onChange,
  onKeyDown,
  readOnly,
  flagged,
  messageId,
  className,
}: SignInFieldProps) {
  const spec = KINDS[kind];

  return (
    /* The label wraps the input, so the whole block is one target: 56px in
       portrait, which is what gives a 34px input a hit area above 44px without
       the input growing.

       In landscape the field is one 44px row, label beside input, sharing a
       baseline. It subgrids into the panel's label, spacer and input tracks, so
       both fields' inputs start on the same line — the label track is as wide
       as the wider label. Two label lines are what the landscape panel could
       not afford; see _Landscape composition_.

       Stacked above the escape button. In landscape that button's 44px square
       reaches into the right-hand end of the email row, and a tap there should
       focus the field rather than close the panel and discard the form. */
    <label
      className={`group relative z-[1] flex flex-col gap-[9px] panel-landscape:grid panel-landscape:grid-cols-subgrid panel-landscape:items-baseline panel-landscape:gap-0 ${className}`}
    >
      <span className="font-mono text-label text-fg-1 transition-[color] duration-control ease-[ease] group-focus-within:text-accent panel-landscape:col-[1]">
        {content.label}
      </span>

      {/* 16px on a coarse pointer, and always in landscape, because Safari on
          iOS zooms the whole page when a smaller field takes focus and the
          visitor cannot undo it.

          Focus wins over the flagged rule: `focus:` sorts after the base colour.

          The autofilled value is held at `fg-0`. The background behind it is
          the browser's and follows the document's dark colour scheme. */}
      <input
        ref={inputRef}
        type={spec.type}
        name={spec.name}
        autoComplete={spec.autoComplete}
        inputMode={spec.inputMode}
        enterKeyHint={spec.enterKeyHint}
        autoCapitalize={spec.autoCapitalize}
        autoCorrect={spec.autoCorrect}
        spellCheck={false}
        placeholder={
          kind === "email" ? content.placeholder : PASSWORD_PLACEHOLDER
        }
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        aria-invalid={flagged || undefined}
        aria-describedby={flagged ? messageId : undefined}
        className={`h-[34px] w-full border-b bg-transparent p-0 font-sans ${spec.value} text-fg-0 outline-hidden transition-[border-color] duration-control ease-[ease] placeholder:text-placeholder autofill:[-webkit-text-fill-color:var(--color-fg-0)] focus:border-accent pointer-coarse:text-[16px] panel-landscape:col-[3] panel-landscape:h-11 panel-landscape:text-[16px] ${
          flagged ? "border-fg-0" : "border-line-control"
        }`}
      />
    </label>
  );
}
