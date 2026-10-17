"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import {
  ACTION_HEIGHT,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
} from "@/components/apply/action-styles";
import { ApplyField, type ApplyFieldKind } from "@/components/apply/ApplyField";
import type { ApplyContent } from "@/content/types";
import {
  answerProblem,
  APPLICATION_STEPS,
  type ApplicationAnswers,
  type ApplicationField,
  EMPTY_ANSWERS,
  isOptional,
  MAX_LENGTH,
} from "@/lib/apply/application";

/**
 * The apply form's two steps and the screen after it, mapped under Apply flow
 * in `codebase-map/apply.md`.
 *
 * It stays mounted while the panel is closed, so whatever was typed, and the
 * step, are still there when the panel opens again. A reload starts over.
 *
 * Nothing is checked until the first press of CONTINUE or SUBMIT. From then on
 * each field shows its own message, and each message goes as soon as its field
 * is put right; focus moves to the first field that still needs attention.
 * Changing step starts that step's checking over.
 *
 * Submitting sends nothing yet; the screen after it is shown on the browser's
 * checks alone.
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

/** What to focus once the next render is on screen. */
type FocusTarget = "first" | "problem";

interface ApplyFormProps {
  content: ApplyContent;
  onClose: () => void;
}

export function ApplyForm({ content, onClose }: ApplyFormProps) {
  const idPrefix = useId();
  const formRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);

  const [answers, setAnswers] = useState<ApplicationAnswers>(EMPTY_ANSWERS);
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);

  const fields = APPLICATION_STEPS[step] ?? [];
  const problems = fields.map((field) => answerProblem(field, answers[field]));
  const consentMissing = step === LAST_STEP && !consent;

  // Focus after the render that follows a step change, a failed check or the
  // submit: the field, its message and the next screen exist only then.
  useEffect(() => {
    const target = pendingFocus.current;
    const root = formRef.current;
    if (target === null || root === null) return;
    pendingFocus.current = null;
    const selector =
      target === "problem"
        ? "[aria-invalid='true']"
        : "input, select, textarea, a[href], button";
    root.querySelector<HTMLElement>(selector)?.focus();
  });

  const idFor = (field: string) => `${idPrefix}-${field}`;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (problems.some((problem) => problem !== null) || consentMissing) {
      setChecking(true);
      pendingFocus.current = "problem";
      return;
    }
    setChecking(false);
    pendingFocus.current = "first";
    if (step < LAST_STEP) setStep(step + 1);
    else setSent(true);
  };

  const back = () => {
    setChecking(false);
    setStep(step - 1);
    pendingFocus.current = "first";
  };

  if (sent) {
    return (
      <div ref={formRef} className="flex flex-col items-start gap-3">
        <Title text={content.success.title} />
        <p className="text-[calc(15*var(--chrome-unit))] leading-[1.55] text-pretty text-fg-1">
          {content.success.body(answers.firstName.trim())}
        </p>
        {/* Two choices, stacked full width at every size: side by side they
            do not fit the panel, and wrapped they sit at uneven widths. */}
        <div className="mt-1.5 flex w-full flex-col gap-2.5">
          <Link
            href="/marketplace"
            onClick={onClose}
            className={`${PRIMARY_ACTION} ${ACTION_HEIGHT}`}
          >
            {content.success.marketplace}
          </Link>
          {/* Where a custom request leads is not decided yet. */}
          <button
            type="button"
            className={`${SECONDARY_ACTION} ${ACTION_HEIGHT}`}
          >
            {content.success.custom}
          </button>
        </div>
      </div>
    );
  }

  const consentId = idFor("consent");
  const consentMessageId = `${consentId}-message`;
  const showConsentMessage = checking && consentMissing;

  return (
    <div ref={formRef}>
      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-[calc(22*var(--chrome-unit))]"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <Title text={content.title} />
            <span className="shrink-0 font-mono text-chrome-label text-fg-2">
              <span aria-hidden="true">
                {content.progress.shown(step + 1, APPLICATION_STEPS.length)}
              </span>
              <span className="sr-only">
                {content.progress.spoken(step + 1, APPLICATION_STEPS.length)}
              </span>
            </span>
          </div>
          {step === 0 && (
            <p className="text-[calc(13*var(--chrome-unit))] leading-normal text-pretty text-fg-1">
              {content.intro}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-[calc(12*var(--chrome-unit))] gap-y-[calc(14*var(--chrome-unit))] stage-narrow:grid-cols-2">
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
          <div className="flex flex-col gap-[7px]">
            {/* The whole line is the target, so it is tall enough to tap. */}
            <label
              htmlFor={consentId}
              className="flex min-h-chrome-touch items-center gap-3 text-[calc(13*var(--chrome-unit))] text-fg-1 row:min-h-0"
            >
              <input
                id={consentId}
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                aria-invalid={showConsentMessage}
                aria-describedby={
                  showConsentMessage ? consentMessageId : undefined
                }
                className="size-4 shrink-0 accent-accent-bright"
              />
              <span>
                {content.consent.before}
                {/* A new tab, so following it does not lose the form. */}
                <a
                  href={content.consent.href}
                  target="_blank"
                  rel="noopener"
                  className="text-fg-0 underline decoration-fg-2 underline-offset-2 transition-[text-decoration-color] duration-hover hover:decoration-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:decoration-fg-0"
                >
                  {content.consent.link}
                  <span className="sr-only">
                    {" "}
                    {content.consent.opensInNewTab}
                  </span>
                </a>
                {content.consent.after}
              </span>
            </label>
            {showConsentMessage && (
              <p
                id={consentMessageId}
                className="text-[calc(12*var(--chrome-unit))] leading-snug text-error"
              >
                {content.consent.missing}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-[calc(16*var(--chrome-unit))]">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className={`${ACTION_HEIGHT} font-mono text-chrome-label text-fg-1 transition-colors duration-hover hover:text-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0`}
            >
              <span aria-hidden="true">← </span>
              {content.actions.back}
            </button>
          )}
          <button
            type="submit"
            className={`${PRIMARY_ACTION} ${ACTION_HEIGHT} ml-auto`}
          >
            {step < LAST_STEP
              ? content.actions.continue
              : content.actions.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function Title({ text }: { text: string }) {
  return (
    <h2 className="font-sans text-[calc(22*var(--chrome-unit))] leading-[1.2] tracking-[-0.01em] text-fg-0 text-shadow-glow-0">
      {text}
    </h2>
  );
}
