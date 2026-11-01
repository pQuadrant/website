"use client";

import { useEffect, useId, useRef, useState } from "react";

import { INLINE_LINK, TEXT_ACTION } from "@/components/apply/action-styles";
import { ApplyField } from "@/components/apply/ApplyField";
import { ApplyStep } from "@/components/apply/ApplyStep";
import type { ApplyContent } from "@/content/types";
import { describeFailure, minutesFrom } from "@/lib/apply/failure";
import {
  CODE_LENGTH,
  codeProblem,
  NEW_CODE_WAIT_SECONDS,
  tidyCode,
} from "@/lib/apply/email-code";
import { isTouchScreen, usePendingFocus } from "@/lib/apply/focus";
import type { CallFailure } from "@/lib/apply/platform";

/**
 * The screen asking for the code emailed to confirm an address, after
 * applying and when opening an application again. See Apply flow in
 * `codebase-map/apply.md`.
 *
 * It is shown once the code has been sent. CONFIRM hands the code to
 * `ApplyFlow`, which sends it with the application or to open one; the
 * platform's answer about the code is shown under the field. "Send a new
 * code" waits as long as the platform says, counting down rather than
 * failing.
 */

interface EmailCodeFormProps {
  content: ApplyContent;
  /** Where the code went, shown so a mistyped address can be spotted. */
  email: string;
  /** Resolves to null once the code is accepted, or to why it was not. */
  onConfirm: (code: string) => Promise<CallFailure | null>;
  /** Asks for a new code to the same address. */
  onResend: () => Promise<CallFailure | null>;
  onBack: () => void;
}

export function EmailCodeForm({
  content,
  email,
  onConfirm,
  onResend,
  onBack,
}: EmailCodeFormProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The platform's answer about the code, shown under the field.
  const [refusal, setRefusal] = useState<string | undefined>();
  const [resendNote, setResendNote] = useState("");
  // The screen opens just after a code was sent, so a new one waits.
  const [resendAt, setResendAt] = useState(
    () => Date.now() + NEW_CODE_WAIT_SECONDS * 1000,
  );
  const [now, setNow] = useState(() => Date.now());

  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useEffect(() => {
    if (waitSeconds === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waitSeconds]);

  const problem = codeProblem(code);

  const submit = async () => {
    setError("");
    if (problem !== null) {
      setRefusal(undefined);
      setChecking(true);
      setAnnouncement(isTouchScreen() ? content.problems(1) : "");
      requestFocus("problem");
      return;
    }
    setBusy(true);
    const failure = await onConfirm(code);
    setBusy(false);
    if (failure === null) return;

    const underField: Record<string, string> = {
      wrong_code: content.code.wrong,
      invalid_code: content.code.wrong,
      code_expired: content.code.expired,
      too_many_tries: content.code.tooManyTries,
      no_code: content.code.noCode,
    };
    if (failure.error in underField) {
      setRefusal(underField[failure.error]);
      setAnnouncement(isTouchScreen() ? content.problems(1) : "");
      requestFocus("problem");
      return;
    }
    setError(describeFailure(failure, content.errors));
  };

  const resend = async () => {
    setError("");
    setResendNote("");
    const failure = await onResend();
    const sentAt = Date.now();
    setNow(sentAt);
    if (failure === null) {
      setRefusal(undefined);
      setCode("");
      setResendNote(content.code.resent);
      setResendAt(sentAt + NEW_CODE_WAIT_SECONDS * 1000);
    } else if (failure.error === "too_soon") {
      setResendAt(
        sentAt + (failure.retryAfterSeconds ?? NEW_CODE_WAIT_SECONDS) * 1000,
      );
    } else if (failure.error === "too_many_codes") {
      setResendNote(
        content.code.tooManyCodes(minutesFrom(failure.retryAfterSeconds)),
      );
      setResendAt(sentAt + (failure.retryAfterSeconds ?? 3600) * 1000);
    } else {
      setError(describeFailure(failure, content.errors));
    }
  };

  return (
    <div ref={rootRef}>
      <ApplyStep
        title={content.code.title}
        intro={content.code.intro(email)}
        submitLabel={content.code.submit}
        onSubmit={() => void submit()}
        announcement={announcement}
        error={error}
        busy={busy}
        busyLabel={content.working}
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
            onChange={(value) => {
              setCode(tidyCode(value));
              setRefusal(undefined);
            }}
            // Room for a pasted code with spaces or a dash, which tidying
            // takes out.
            maxLength={CODE_LENGTH * 2}
            problem={checking ? problem : null}
            notice={refusal}
          />
          <div className="col-span-2 flex flex-col gap-1">
            <p className="text-[calc(13*var(--chrome-unit))] leading-snug text-fg-2">
              {content.code.resendQuestion}{" "}
              {waitSeconds > 0 ? (
                <span>{content.code.resendIn(waitSeconds)}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void resend()}
                  className={INLINE_LINK}
                >
                  {content.code.resend}
                </button>
              )}
            </p>
            {/* Always present, even while empty, so a screen reader
                announces the line when it is filled. */}
            <p
              role="status"
              className="text-[calc(13*var(--chrome-unit))] leading-snug text-fg-1"
            >
              {resendNote}
            </p>
          </div>
        </div>
      </ApplyStep>
    </div>
  );
}
