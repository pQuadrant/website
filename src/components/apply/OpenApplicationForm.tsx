"use client";

import { useId, useRef, useState } from "react";

import { TEXT_ACTION } from "@/components/apply/action-styles";
import { ApplyField } from "@/components/apply/ApplyField";
import { ApplyStep } from "@/components/apply/ApplyStep";
import type { ApplyContent } from "@/content/types";
import { answerProblem, MAX_LENGTH, tidyAnswer } from "@/lib/apply/application";
import { isTouchScreen, usePendingFocus } from "@/lib/apply/focus";

/**
 * The screen where someone who has already applied asks for a code to open
 * their application again, instead of applying a second time. It is not a
 * platform sign-in and never says so. See Apply flow in
 * `codebase-map/apply.md`.
 *
 * The email is checked as the application's is, and stays typed while the
 * panel shows another screen. Nothing is sent yet.
 */

interface OpenApplicationFormProps {
  content: ApplyContent;
  /** The tidied address the code is to go to. */
  onCodeRequested: (email: string) => void;
  onBack: () => void;
}

export function OpenApplicationForm({
  content,
  onCodeRequested,
  onBack,
}: OpenApplicationFormProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const problem = answerProblem("email", email);

  const submit = () => {
    const tidied = tidyAnswer("email", email);
    setEmail(tidied);
    if (answerProblem("email", tidied) !== null) {
      setChecking(true);
      setAnnouncement(isTouchScreen() ? content.problems(1) : "");
      requestFocus("problem");
      return;
    }
    setChecking(false);
    setAnnouncement("");
    onCodeRequested(tidied);
  };

  const back = () => {
    setChecking(false);
    setAnnouncement("");
    onBack();
  };

  return (
    <div ref={rootRef}>
      <ApplyStep
        title={content.open.title}
        intro={content.open.intro}
        submitLabel={content.open.submit}
        onSubmit={submit}
        announcement={announcement}
        secondary={
          <button type="button" onClick={back} className={TEXT_ACTION}>
            <span aria-hidden="true">← </span>
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
            onChange={setEmail}
            onBlur={() => setEmail((current) => tidyAnswer("email", current))}
            maxLength={MAX_LENGTH.email}
            problem={checking ? problem : null}
          />
        </div>
      </ApplyStep>
    </div>
  );
}
