"use client";

import { useRef, useState } from "react";

import { ApplyForm } from "@/components/apply/ApplyForm";
import { EmailCodeForm } from "@/components/apply/EmailCodeForm";
import { NextSteps } from "@/components/apply/NextSteps";
import { OpenApplicationForm } from "@/components/apply/OpenApplicationForm";
import { privacyContent } from "@/content/privacy";
import type { ApplyContent } from "@/content/types";
import type { ApplicationAnswers } from "@/lib/apply/application";
import { usePendingFocus } from "@/lib/apply/focus";
import {
  type CallFailure,
  type CallResult,
  checkEmail,
  closeApplication,
  type CodePurpose,
  deviceTimeZone,
  type OpenApplication,
  openApplication,
  sendCode,
  submitApplication,
} from "@/lib/apply/platform";
import { useHumanCheck } from "@/lib/apply/human-proof";

/**
 * Which screen the apply panel shows, and every call it makes to the
 * platform, mapped under Apply flow in `codebase-map/apply.md`:
 *
 *   apply ──SUBMIT──▶ code ──CONFIRM──▶ next
 *     │                ▲
 *     └─"Already applied?"─▶ open ──EMAIL ME A CODE─┘
 *
 * While an application is open on this device (`applicant`), the panel shows
 * only the screen after the code; "Not you?" closes it and returns to the
 * form, emptied. BACK from the code screen returns to whichever screen asked
 * for it.
 *
 * The application and the open-application screens stay mounted, `hidden`
 * when not shown, so what was typed survives moving between screens and
 * closing the panel. The code screen is mounted only while shown, so it starts
 * empty each time a code is asked for. Moving to a screen focuses its start,
 * as opening the panel does.
 *
 * The email check and every code request carry proof of a person
 * (`human-proof.ts`): a Cloudflare Turnstile token the first time, and the
 * human pass the platform returns after that. Turnstile's widget lives at the
 * bottom of the panel and only takes space when Cloudflare asks the visitor to
 * interact. Until there is a pass, a token is got ready whenever focus is in
 * the panel (opening it puts focus there, and so does each field and screen),
 * so a call rarely waits for Cloudflare.
 */

type Screen = "apply" | "open" | "code";

/** What the code screen is confirming. */
interface CodeRequest {
  email: string;
  purpose: CodePurpose;
}

interface ApplyFlowProps {
  content: ApplyContent;
  onClose: () => void;
  /** The application open on this device, if any. */
  applicant: OpenApplication | null;
  onApplicantChange: (applicant: OpenApplication | null) => void;
}

export function ApplyFlow({
  content,
  onClose,
  applicant,
  onApplicantChange,
}: ApplyFlowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);
  const humanCheck = useHumanCheck(botRef);

  const [screen, setScreen] = useState<Screen>("apply");
  const [codeRequest, setCodeRequest] = useState<CodeRequest | null>(null);
  // The application waiting on its code.
  const [pending, setPending] = useState<{
    answers: ApplicationAnswers;
    marketing: boolean;
  } | null>(null);
  const [openEmail, setOpenEmail] = useState("");
  // Whether the open application was made just now, which decides the
  // greeting: "Application received" rather than "Welcome back".
  const [justApplied, setJustApplied] = useState(false);
  // Changing it empties the form, after applying and after "Not you?".
  const [formKey, setFormKey] = useState(0);

  const show = (next: Screen) => {
    setScreen(next);
    requestFocus("start");
  };

  const requestCode = async (
    request: CodeRequest,
  ): Promise<CallFailure | null> => {
    const result = await humanCheck.send((proof) =>
      sendCode(request.email, request.purpose, proof),
    );
    return result.ok ? null : result;
  };

  const askForCode = async (
    request: CodeRequest,
  ): Promise<CallFailure | null> => {
    const failure = await requestCode(request);
    if (failure !== null) return failure;
    setCodeRequest(request);
    show("code");
    return null;
  };

  const confirm = async (code: string): Promise<CallFailure | null> => {
    if (codeRequest === null) return { error: "server" };
    let result: CallResult<OpenApplication>;
    if (codeRequest.purpose === "apply" && pending !== null) {
      const { email, ...answers } = pending.answers;
      result = await submitApplication({
        email,
        code,
        answers,
        privacyPolicyVersion: privacyContent.version,
        marketingOptIn: pending.marketing,
        timeZone: deviceTimeZone(),
      });
    } else {
      result = await openApplication(codeRequest.email, code);
    }
    if (!result.ok) return result;

    setJustApplied(codeRequest.purpose === "apply");
    setPending(null);
    setCodeRequest(null);
    setScreen("apply");
    setFormKey((key) => key + 1);
    onApplicantChange(result.data);
    requestFocus("start");
    return null;
  };

  const notYou = () => {
    // Closed here at once; if the platform cannot be reached, the device still
    // holds the cookie and the next visit shows the application again.
    void closeApplication();
    onApplicantChange(null);
    setJustApplied(false);
    setOpenEmail("");
    setScreen("apply");
    setFormKey((key) => key + 1);
    requestFocus("start");
  };

  return (
    <div
      ref={rootRef}
      // Nothing in the screen after the code needs a token.
      onFocus={applicant === null ? humanCheck.prepare : undefined}
    >
      {applicant !== null ? (
        <NextSteps
          content={content.next}
          title={
            justApplied
              ? content.next.applied.title
              : content.next.returning.title(applicant.firstName)
          }
          body={
            justApplied
              ? content.next.applied.body(applicant.firstName)
              : content.next.returning.body
          }
          onClose={onClose}
          onNotYou={notYou}
        />
      ) : (
        <>
          <div hidden={screen !== "apply"}>
            <ApplyForm
              key={formKey}
              content={content}
              onCheckEmail={(email) =>
                humanCheck.send((proof) => checkEmail(email, proof))
              }
              onSubmitted={(answers, marketing) => {
                setPending({ answers, marketing });
                return askForCode({ email: answers.email, purpose: "apply" });
              }}
              onOpenApplication={(email) => {
                if (email !== undefined) setOpenEmail(email);
                show("open");
              }}
            />
          </div>

          <div hidden={screen !== "open"}>
            <OpenApplicationForm
              content={content}
              email={openEmail}
              onEmailChange={setOpenEmail}
              onRequestCode={(email) => askForCode({ email, purpose: "open" })}
              onBack={() => show("apply")}
            />
          </div>

          {screen === "code" && codeRequest !== null && (
            <EmailCodeForm
              content={content}
              email={codeRequest.email}
              onConfirm={confirm}
              onResend={() => requestCode(codeRequest)}
              onBack={() =>
                show(codeRequest.purpose === "apply" ? "apply" : "open")
              }
            />
          )}
        </>
      )}

      {/* Cloudflare's check. No height unless Cloudflare asks the visitor to
          interact, when its box appears here, as far below the actions as
          the form's own parts are apart. */}
      <div
        ref={botRef}
        className={
          humanCheck.shown
            ? "mt-3 row:mt-[calc(22*var(--chrome-unit))] cramped:mt-2"
            : undefined
        }
      />
    </div>
  );
}
