"use client";

import { useId, useRef, useState } from "react";

import { TEXT_ACTION } from "@/components/apply/action-styles";
import { ApplyField } from "@/components/apply/ApplyField";
import { ApplyStep } from "@/components/apply/ApplyStep";
import type { ApplyContent } from "@/content/types";
import { describeFailure } from "@/lib/apply/failure";
import { answerProblem, MAX_LENGTH, tidyAnswer } from "@/lib/apply/application";
import { isTouchScreen, usePendingFocus } from "@/lib/apply/focus";
import type { CallFailure } from "@/lib/apply/platform";

/**
 * The screen where someone who has already applied asks for a code to open
 * their application again, instead of applying a second time. It is not a
 * platform sign-in and never says so. See Apply flow in
 * `codebase-map/apply.md`.
 *
 * The email is held by `ApplyFlow`, so "Open your application" under an email
 * that has already applied brings that address here already typed. An email
 * that has never applied is told so at once, and no code is sent.
 */

interface OpenApplicationFormProps {
  content: ApplyContent;
  email: string;
  onEmailChange: (email: string) => void;
  /**
   * Asks for a code for this tidied address. Resolves to null once it is on
   * its way, or to why it could not be sent.
   */
  onRequestCode: (email: string) => Promise<CallFailure | null>;
  onBack: () => void;
}

export function OpenApplicationForm({
  content,
  email,
  onEmailChange,
  onRequestCode,
  onBack,
}: OpenApplicationFormProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [checking, setChecking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The last address the platform said has not applied.
  const [unknownEmail, setUnknownEmail] = useState<string | null>(null);

  const problem = answerProblem("email", email);
  const notice =
    unknownEmail !== null && tidyAnswer("email", email) === unknownEmail
      ? content.open.notApplied
      : undefined;

  const showProblem = () => {
    setChecking(true);
    setAnnouncement(isTouchScreen() ? content.problems(1) : "");
    requestFocus("problem");
  };

  const submit = async () => {
    setError("");
    const tidied = tidyAnswer("email", email);
    onEmailChange(tidied);
    if (answerProblem("email", tidied) !== null || tidied === unknownEmail) {
      showProblem();
      return;
    }
    setChecking(false);
    setAnnouncement("");
    setBusy(true);
    const failure = await onRequestCode(tidied);
    setBusy(false);
    if (failure === null) return;
    if (failure.error === "not_applied") {
      setUnknownEmail(tidied);
      showProblem();
      return;
    }
    setError(describeFailure(failure, content.errors));
  };

  const back = () => {
    setChecking(false);
    setAnnouncement("");
    setError("");
    onBack();
  };

  return (
    <div ref={rootRef}>
      <ApplyStep
        title={content.open.title}
        intro={content.open.intro}
        submitLabel={content.open.submit}
        onSubmit={() => void submit()}
        announcement={announcement}
        error={error}
        busy={busy}
        busyLabel={content.working}
        secondary={
          <button type="button" onClick={back} className={TEXT_ACTION}>
            {content.actions.back}
          </button>
        }
      >
        <div className="grid grid-cols-2">
          <ApplyField
            id={`${id}-email`}
            kind="email"
            autoComplete="email"
            wide
            content={content.fields.email}
            value={email}
            onChange={onEmailChange}
            onBlur={() => onEmailChange(tidyAnswer("email", email))}
            maxLength={MAX_LENGTH.email}
            problem={checking ? problem : null}
            notice={notice}
          />
        </div>
      </ApplyStep>
    </div>
  );
}
