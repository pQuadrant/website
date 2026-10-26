"use client";

import { useRef, useState } from "react";

import { ApplyForm } from "@/components/apply/ApplyForm";
import { EmailCodeForm } from "@/components/apply/EmailCodeForm";
import { NextSteps } from "@/components/apply/NextSteps";
import { OpenApplicationForm } from "@/components/apply/OpenApplicationForm";
import type { ApplyContent } from "@/content/types";
import { usePendingFocus } from "@/lib/apply/focus";

/**
 * Which screen the apply panel shows, mapped under Apply flow in
 * `codebase-map/apply.md`:
 *
 *   apply ──SUBMIT──▶ code ──CONFIRM──▶ next
 *     │                ▲
 *     └─"Already applied?"─▶ open ──EMAIL ME A CODE─┘
 *
 * BACK from the code screen returns to whichever screen asked for it.
 *
 * The application and the open-application screens stay mounted, `hidden`
 * when not shown, so what was typed survives moving between screens and
 * closing the panel. The code screen is mounted only while shown, so it starts
 * empty each time a code is asked for. Moving to a screen focuses its start,
 * as opening the panel does.
 */

/** The screen that asked for a code, which decides what follows it. */
type CodeFor = "apply" | "open";

type Screen =
  | { name: "apply" }
  | { name: "open" }
  | { name: "code"; email: string; codeFor: CodeFor }
  | { name: "next"; codeFor: CodeFor };

interface ApplyFlowProps {
  content: ApplyContent;
  onClose: () => void;
}

export function ApplyFlow({ content, onClose }: ApplyFlowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const requestFocus = usePendingFocus(() => rootRef.current);

  const [screen, setScreen] = useState<Screen>({ name: "apply" });
  const [firstName, setFirstName] = useState("");

  const show = (next: Screen) => {
    setScreen(next);
    requestFocus("start");
  };

  const askForCode = (email: string, codeFor: CodeFor) =>
    show({ name: "code", email, codeFor });

  return (
    <div ref={rootRef}>
      <div hidden={screen.name !== "apply"}>
        <ApplyForm
          content={content}
          onSubmitted={(answers) => {
            setFirstName(answers.firstName);
            askForCode(answers.email, "apply");
          }}
          onOpenApplication={() => show({ name: "open" })}
        />
      </div>

      <div hidden={screen.name !== "open"}>
        <OpenApplicationForm
          content={content}
          onCodeRequested={(email) => askForCode(email, "open")}
          onBack={() => show({ name: "apply" })}
        />
      </div>

      {screen.name === "code" && (
        <EmailCodeForm
          content={content}
          email={screen.email}
          onConfirmed={() => show({ name: "next", codeFor: screen.codeFor })}
          onBack={() => show({ name: screen.codeFor })}
        />
      )}

      {screen.name === "next" && (
        <NextSteps
          content={content.next}
          title={
            screen.codeFor === "apply"
              ? content.next.applied.title
              : content.next.returning.title
          }
          body={
            screen.codeFor === "apply"
              ? content.next.applied.body(firstName)
              : content.next.returning.body
          }
          onClose={onClose}
        />
      )}
    </div>
  );
}
