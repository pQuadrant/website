"use client";

import { useId, useRef, useState } from "react";

import { INLINE_LINK, TEXT_ACTION } from "@/components/apply/action-styles";
import { ApplyField } from "@/components/apply/ApplyField";
import { ApplyStep } from "@/components/apply/ApplyStep";
import type { ApplyContent } from "@/content/types";
import { CODE_LENGTH, codeProblem, tidyCode } from "@/lib/apply/email-code";
import { isTouchScreen, usePendingFocus } from "@/lib/apply/focus";

/**
 * The screen asking for the code emailed to confirm an address, after
 * applying and when opening an application again. See Apply flow in
 * `codebase-map/apply.md`.
 *
 * For now it shows how the step looks and behaves, and nothing more: no code
 * is sent, any code of the right length is accepted, and asking for a new one
 * only says that one is on its way (`email-code.ts`).
 */

interface EmailCodeFormProps {
  content: ApplyContent;
  /** Where the code went, shown so a mistyped address can be spotted. */
  email: string;
  onConfirmed: () => void;
  onBack: () => void;
}

export function EmailCodeForm({
  content,
  email,
  onConfirmed,
  onBack,
}: EmailCodeFormProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [resent, setResent] = useState(false);

  const problem = codeProblem(code);

  const submit = () => {
    if (problem !== null) {
      setChecking(true);
      setAnnouncement(isTouchScreen() ? content.problems(1) : "");
      requestFocus("problem");
      return;
    }
    onConfirmed();
  };

  return (
    <div ref={rootRef}>
      <ApplyStep
        title={content.code.title}
        intro={content.code.intro(email)}
        submitLabel={content.code.submit}
        onSubmit={submit}
        announcement={announcement}
        secondary={
          <button type="button" onClick={onBack} className={TEXT_ACTION}>
            <span aria-hidden="true">← </span>
            {content.actions.back}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-y-2.5">
          <ApplyField
            id={`${id}-code`}
            kind="code"
            wide
            content={content.code.field}
            value={code}
            onChange={(value) => setCode(tidyCode(value))}
            // Room for a pasted code with spaces or a dash, which tidying
            // takes out.
            maxLength={CODE_LENGTH * 2}
            problem={checking ? problem : null}
          />
          <div className="col-span-2 flex flex-col gap-1">
            <p className="text-[calc(13*var(--chrome-unit))] leading-snug text-fg-2">
              {content.code.resendQuestion}{" "}
              <button
                type="button"
                onClick={() => setResent(true)}
                className={INLINE_LINK}
              >
                {content.code.resend}
              </button>
            </p>
            {/* Always present, even while empty, so a screen reader
                announces the line when it is filled. */}
            <p
              role="status"
              className="text-[calc(13*var(--chrome-unit))] leading-snug text-fg-1"
            >
              {resent ? content.code.resent : ""}
            </p>
          </div>
        </div>
      </ApplyStep>
    </div>
  );
}
