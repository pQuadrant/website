import type { FormEvent, ReactNode } from "react";

import {
  ACTION_HEIGHT,
  PRIMARY_ACTION,
} from "@/components/apply/action-styles";
import { ApplyTitle } from "@/components/apply/ApplyTitle";

/**
 * The frame every form in the apply panel shares: a title, an optional note
 * beside it, a line under it, the fields, and a row with the primary action on
 * the right and anything quieter on the left.
 *
 * Spacing tightens on a phone, and again under 600px tall, so the longest
 * step fits an upright phone without the panel scrolling (Fitting a phone in
 * `codebase-map/apply.md`).
 */

interface ApplyStepProps {
  title: string;
  /** Set beside the title, such as the step count. */
  aside?: ReactNode;
  intro: string;
  submitLabel: string;
  onSubmit: () => void;
  /** Read out by assistive technology; see `ApplyContent.problems`. */
  announcement: string;
  /** Left of the primary action: BACK, or a way to a different screen. */
  secondary?: ReactNode;
  children: ReactNode;
}

export function ApplyStep({
  title,
  aside,
  intro,
  submitLabel,
  onSubmit,
  announcement,
  secondary,
  children,
}: ApplyStepProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-3 row:gap-[calc(22*var(--chrome-unit))] cramped:gap-2"
    >
      <div className="flex flex-col gap-1.5 row:gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <ApplyTitle text={title} />
          {aside}
        </div>
        <p className="text-[calc(13*var(--chrome-unit))] leading-normal text-pretty text-fg-1">
          {intro}
        </p>
      </div>

      {children}

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="flex items-center gap-[calc(16*var(--chrome-unit))]">
        {secondary}
        <button
          type="submit"
          className={`${PRIMARY_ACTION} ${ACTION_HEIGHT} ml-auto shrink-0`}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
