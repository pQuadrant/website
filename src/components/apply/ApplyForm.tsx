"use client";

import { useId, useRef, useState } from "react";

import { INLINE_LINK, TEXT_ACTION } from "@/components/apply/action-styles";
import { ApplyCheckbox } from "@/components/apply/ApplyCheckbox";
import { ApplyField, type ApplyFieldKind } from "@/components/apply/ApplyField";
import { ApplyStep } from "@/components/apply/ApplyStep";
import type { ApplyContent } from "@/content/types";
import {
  answerProblem,
  APPLICATION_STEPS,
  type ApplicationAnswers,
  type ApplicationField,
  EMPTY_ANSWERS,
  isOptional,
  MAX_LENGTH,
  tidyAnswer,
} from "@/lib/apply/application";
import { isTouchScreen, usePendingFocus } from "@/lib/apply/focus";

/**
 * The apply form's two steps, mapped under Apply flow in
 * `codebase-map/apply.md`.
 *
 * It stays mounted while the panel is closed or showing another screen, so
 * whatever was typed, and the step, are still there when it is shown again. A
 * reload starts over.
 *
 * Nothing is checked until the first press of CONTINUE or SUBMIT. From then on
 * each field shows its own message, and each message goes as soon as its field
 * is put right; focus moves to the first field that still needs attention.
 * Changing step starts that step's checking over.
 *
 * Each answer is tidied when focus leaves its field, and the step's answers
 * again when it is submitted, so an answer finished with Enter is tidied too
 * (`tidyAnswer`).
 *
 * Submitting hands the answers to `ApplyFlow`, which asks for the email code.
 * Nothing is sent yet.
 *
 * On a phone the form keeps two columns and tighter spacing, so each step fits
 * an upright phone's screen without the panel scrolling.
 */

interface FieldControl {
  kind: ApplyFieldKind;
  autoComplete?: string;
  wide?: boolean;
}

const CONTROLS: Record<ApplicationField, FieldControl> = {
  firstName: { kind: "text", autoComplete: "given-name" },
  lastName: { kind: "text", autoComplete: "family-name" },
  // Full width so a long address is visible as typed.
  email: { kind: "email", autoComplete: "email", wide: true },
  company: { kind: "text", autoComplete: "organization" },
  role: { kind: "text", autoComplete: "organization-title" },
  companySize: { kind: "select" },
  phone: { kind: "tel", autoComplete: "tel" },
  goal: { kind: "textarea", wide: true },
};

const LAST_STEP = APPLICATION_STEPS.length - 1;

interface ApplyFormProps {
  content: ApplyContent;
  /** The answers, tidied and accepted by the browser's checks. */
  onSubmitted: (answers: ApplicationAnswers) => void;
  /** Leaves for the screen where someone who has applied opens it again. */
  onOpenApplication: () => void;
}

export function ApplyForm({
  content,
  onSubmitted,
  onOpenApplication,
}: ApplyFormProps) {
  const idPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [answers, setAnswers] = useState<ApplicationAnswers>(EMPTY_ANSWERS);
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  // Read out on a touch screen, where focus does not move to the first field
  // that needs attention (see `focusProblem`).
  const [announcement, setAnnouncement] = useState("");

  const fields = APPLICATION_STEPS[step] ?? [];
  const problems = fields.map((field) => answerProblem(field, answers[field]));
  const consentMissing = step === LAST_STEP && !consent;

  const idFor = (field: string) => `${idPrefix}-${field}`;

  const tidy = (field: ApplicationField) =>
    setAnswers((current) => ({
      ...current,
      [field]: tidyAnswer(field, current[field]),
    }));

  const submit = () => {
    fields.forEach(tidy);
    const count =
      problems.filter((problem) => problem !== null).length +
      (consentMissing ? 1 : 0);
    if (count > 0) {
      setChecking(true);
      setAnnouncement(isTouchScreen() ? content.problems(count) : "");
      requestFocus("problem");
      return;
    }
    setChecking(false);
    setAnnouncement("");
    if (step < LAST_STEP) {
      setStep(step + 1);
      requestFocus("start");
    } else {
      const tidied = { ...answers };
      for (const field of fields)
        tidied[field] = tidyAnswer(field, answers[field]);
      onSubmitted(tidied);
    }
  };

  const back = () => {
    setChecking(false);
    setAnnouncement("");
    setStep(step - 1);
    requestFocus("start");
  };

  return (
    <div ref={rootRef}>
      <ApplyStep
        title={content.title}
        aside={
          <span className="shrink-0 font-mono text-chrome-label text-fg-2">
            <span aria-hidden="true">
              {content.progress.shown(step + 1, APPLICATION_STEPS.length)}
            </span>
            <span className="sr-only">
              {content.progress.spoken(step + 1, APPLICATION_STEPS.length)}
            </span>
          </span>
        }
        intro={content.intros[step] ?? ""}
        submitLabel={
          step < LAST_STEP ? content.actions.continue : content.actions.submit
        }
        onSubmit={submit}
        announcement={announcement}
        secondary={
          step > 0 ? (
            <button type="button" onClick={back} className={TEXT_ACTION}>
              <span aria-hidden="true">← </span>
              {content.actions.back}
            </button>
          ) : (
            // Beside CONTINUE, where step two has BACK, so it adds no height.
            <p className="text-[calc(13*var(--chrome-unit))] leading-snug text-pretty text-fg-2">
              {content.alreadyApplied.question}{" "}
              <button
                type="button"
                onClick={onOpenApplication}
                className={INLINE_LINK}
              >
                {content.alreadyApplied.action}
              </button>
            </p>
          )
        }
      >
        <div className="grid grid-cols-2 gap-x-[calc(12*var(--chrome-unit))] gap-y-3 row:gap-y-[calc(14*var(--chrome-unit))] cramped:gap-y-2">
          {fields.map((field, index) => (
            <ApplyField
              key={field}
              id={idFor(field)}
              {...CONTROLS[field]}
              content={content.fields[field]}
              value={answers[field]}
              onChange={(value) =>
                setAnswers((current) => ({ ...current, [field]: value }))
              }
              onBlur={() => tidy(field)}
              maxLength={MAX_LENGTH[field]}
              problem={checking ? (problems[index] ?? null) : null}
              optionalLabel={isOptional(field) ? content.optional : undefined}
              choose={content.choose}
              options={
                field === "companySize" ? content.companySizes : undefined
              }
            />
          ))}
        </div>

        {step === LAST_STEP && (
          <div className="flex flex-col gap-0.5 cramped:gap-0 row:gap-2">
            <ApplyCheckbox
              id={idFor("consent")}
              checked={consent}
              onChange={setConsent}
              message={
                checking && consentMissing ? content.consent.missing : undefined
              }
            >
              {content.consent.before}
              {/* A new tab, so following it does not lose the form. */}
              <a
                href={content.consent.href}
                target="_blank"
                rel="noopener"
                className={INLINE_LINK}
              >
                {content.consent.link}
                <span className="sr-only">
                  {" "}
                  {content.consent.opensInNewTab}
                </span>
              </a>
              {content.consent.after}
            </ApplyCheckbox>
            {/* Optional, and never ticked to begin with: consent to marketing
                has to be given, not assumed. */}
            <ApplyCheckbox
              id={idFor("marketing")}
              checked={marketing}
              onChange={setMarketing}
            >
              {content.marketing}
            </ApplyCheckbox>
          </div>
        )}
      </ApplyStep>
    </div>
  );
}
