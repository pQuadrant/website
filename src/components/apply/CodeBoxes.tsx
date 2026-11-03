"use client";

import { useState } from "react";

import { CODE_LENGTH } from "@/lib/apply/email-code";

/**
 * The email code's control: one digit to a box, each typed digit moving on to
 * the next box, with a wider gap after the third so the boxes read like the
 * code in the email ("482 913"). See Apply flow in `codebase-map/apply.md`.
 *
 * It is one real field drawn as six boxes, not six fields. A phone offers a
 * code from the email to one field (`one-time-code`), a pasted code arrives in
 * one piece, and a screen reader hears one field with its label and message;
 * six fields break all three. The field lies over the boxes, invisible, so a
 * tap or click anywhere on them focuses it. Its caret is kept at the end:
 * digits are put right by deleting back, not by picking a box.
 */

interface CodeBoxesProps {
  id: string;
  value: string;
  /** Called with digits only, at most the code's length. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid: boolean;
  describedBy?: string;
  /** The box's height, shared with the other fields. */
  heightClass: string;
}

/** Each box takes the field's look: its fill, border, focus glow and error. */
const BOX =
  "flex min-w-0 flex-1 items-center justify-center border bg-field-fill font-mono text-[calc(20*var(--chrome-unit))] text-fg-0 transition-[border-color,box-shadow,background-color] duration-hover ease-[ease] pointer-coarse:text-[20px]";

export function CodeBoxes({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  heightClass,
}: CodeBoxesProps) {
  const [focused, setFocused] = useState(false);
  // The box the next digit goes in; the last once all are filled.
  const active = Math.min(value.length, CODE_LENGTH - 1);

  const keepCaretAtEnd = (input: HTMLInputElement) => {
    const end = input.value.length;
    if (input.selectionStart !== end || input.selectionEnd !== end) {
      input.setSelectionRange(end, end);
    }
  };

  return (
    <div className="group relative flex gap-[calc(8*var(--chrome-unit))]">
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const lit = focused && index === active;
        const border = invalid
          ? "border-error"
          : lit
            ? "border-accent-bright"
            : "border-hairline group-hover:border-hairline-hover";
        return (
          <span
            key={index}
            aria-hidden="true"
            className={`${BOX} ${heightClass} ${border} max-w-[calc(48*var(--chrome-unit))] ${lit ? "bg-field-focus-fill shadow-field-focus" : ""} ${index === CODE_LENGTH / 2 ? "ml-[calc(10*var(--chrome-unit))]" : ""}`}
          >
            {value[index] ??
              (lit && (
                // Where the next digit goes. Still, not blinking, so it needs
                // nothing under reduced motion.
                <span className="h-[1.1em] w-px bg-accent-bright" />
              ))}
          </span>
        );
      })}
      <input
        id={id}
        name={id}
        value={value}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        // Room for a pasted code with spaces or a dash, which are taken out.
        maxLength={CODE_LENGTH * 2}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          // A whole code added at once, pasted or offered by the phone,
          // replaces what was there; otherwise digits past the last box are
          // ignored.
          const added = digits.length - value.length;
          onChange(
            added >= CODE_LENGTH
              ? digits.slice(-CODE_LENGTH)
              : digits.slice(0, CODE_LENGTH),
          );
        }}
        onSelect={(event) => keepCaretAtEnd(event.currentTarget)}
        onFocus={(event) => {
          setFocused(true);
          keepCaretAtEnd(event.currentTarget);
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        // Invisible but there: it takes the taps, clicks, typing and pasting
        // for the boxes under it. 16px text so iOS does not zoom in on focus.
        className="absolute inset-0 h-full w-full border-0 bg-transparent text-[16px] text-transparent caret-transparent outline-hidden selection:bg-transparent"
      />
    </div>
  );
}
