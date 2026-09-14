"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ErrorSlot,
  type SignInMessage,
} from "@/components/sign-in-panel/ErrorSlot";
import { SignInField } from "@/components/sign-in-panel/SignInField";
import {
  SubmitButton,
  type SubmitState,
} from "@/components/sign-in-panel/SubmitButton";
import { useFocusTrap } from "@/components/sign-in-panel/use-focus-trap";
import type { SignInPanelContent } from "@/content/types";

export interface SignInCredentials {
  email: string;
  password: string;
}

export type SignInResult = "granted" | "rejected";

/** How a sign-in attempt is resolved. No backend is decided yet. */
export type Authenticate = (
  credentials: SignInCredentials,
) => Promise<SignInResult>;

/** The points in an attempt that the rest of the page responds to. */
export type SignInPhase = "processing" | "granted" | "rejected";

/**
 * The sign-in panel.
 *
 * Specified in `docs/design/sign-in-panel.md`. Rendered only while open, so
 * closing it discards everything typed, every message and the attempt count —
 * the spec asks for exactly that, and unmounting is the one way to be sure
 * nothing survives.
 *
 * It reports rather than reaches in. The page is told when a field takes or
 * loses focus and when an attempt moves between phases, and decides what the
 * motif and the stage do about it.
 */
interface SignInPanelProps {
  id: string;
  /** Measured by the page, for the motif's clear zone and the chrome. */
  panelRef: RefObject<HTMLDivElement | null>;
  content: SignInPanelContent;
  onClose: () => void;
  onFocusChange: (focused: boolean) => void;
  onPhaseChange: (phase: SignInPhase) => void;
  /**
   * Resolves an attempt. Absent until a backend exists, and then a complete
   * form passes its missing-field checks and goes no further.
   */
  authenticate?: Authenticate;
}

export function SignInPanel({
  id,
  panelRef,
  content,
  onClose,
  onFocusChange,
  onPhaseChange,
  authenticate,
}: SignInPanelProps) {
  const messageId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("resting");
  const [message, setMessage] = useState<SignInMessage | null>(null);
  const [attempts, setAttempts] = useState(0);

  // The attempt whose result is still wanted. Cleared on close, so a result
  // that arrives after the panel has gone is dropped rather than applied.
  const pending = useRef<symbol | null>(null);
  useEffect(
    () => () => {
      pending.current = null;
    },
    [],
  );

  useFocusTrap(panelRef, onClose);

  // Into the panel before it is painted — the panel itself, not a field, on
  // every device. A focused field lights the motif, and lit on arrival it made
  // the clear zone read as a dark panel landing ahead of this one while this
  // one was still fading in. On a phone a focused field also raises the
  // keyboard over half the panel, or on iOS, where script focus does not
  // reliably raise it, leaves a field lit with no keyboard at all. The
  // visitor's first click, tap or Tab goes into the form.
  useLayoutEffect(() => {
    panelRef.current?.focus();
  }, [panelRef]);

  const locked = submitState !== "resting";

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setMessage(null);
    };
  }

  // "Next" on a phone keyboard is Enter. With the password still empty it
  // moves on, rather than submitting and answering with a message for doing
  // what the keyboard said.
  function onEmailKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (email.trim() === "" || password !== "") return;
    event.preventDefault();
    passwordRef.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (locked) return;

    // Caught before anything is sent, and never the credentials error. An
    // email of spaces is empty; a password of spaces is a password.
    if (email.trim() === "") {
      setMessage({ kind: "missing", field: "email" });
      emailRef.current?.focus();
      return;
    }
    if (password === "") {
      setMessage({ kind: "missing", field: "password" });
      passwordRef.current?.focus();
      return;
    }

    if (authenticate === undefined) return;

    const attempt = Symbol("attempt");
    pending.current = attempt;
    setMessage(null);
    setSubmitState("processing");
    onPhaseChange("processing");

    const result = await authenticate({ email: email.trim(), password });
    if (pending.current !== attempt) return;
    pending.current = null;

    if (result === "granted") {
      setSubmitState("granted");
      onPhaseChange("granted");
      return;
    }

    const made = attempts + 1;
    setAttempts(made);
    setSubmitState("resting");
    setMessage({ kind: "rejected", attempt: made });
    onPhaseChange("rejected");
  }

  const rejected = message?.kind === "rejected";
  const flagged = (field: "email" | "password") =>
    rejected || (message?.kind === "missing" && message.field === field);

  return (
    /* One element, two compositions. Portrait is a single column in document
       order. Landscape is identity and footer, the divider, then the form —
       placed explicitly, with the header and the footer sharing the left column
       from opposite ends. Because it is one element laid out two ways, rotating
       a phone keeps everything typed.

       The landscape tracks, left to right: the 176px column, 36px, the 1px
       divider, 36px, the field labels, 16px, the inputs. The gaps are tracks
       rather than a column gap because they differ, and the label track is
       `max-content` so it is as wide as the wider label — both fields subgrid
       into it, so both inputs start on one line whatever the copy says.

       Its height is never set. Every box inside has a height no state can
       change, so the sum is constant in every state at a given width, which
       is the rule — see _How the height is held constant_. */
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={content.dialogLabel}
      tabIndex={-1}
      onFocus={(event) => {
        if (event.target instanceof HTMLInputElement) onFocusChange(true);
      }}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof HTMLInputElement)) {
          onFocusChange(false);
        }
      }}
      className="pointer-events-auto relative grid w-panel-width max-w-[calc(100dvw-2*var(--spacing-stage-margin-tight))] animate-panel-in grid-cols-[minmax(0,1fr)] border border-line-panel bg-panel px-8 pt-9 pb-[30px] outline-hidden motion-reduce:animate-none panel-landscape:w-panel-width-landscape panel-landscape:grid-cols-[176px_36px_1px_36px_max-content_16px_minmax(0,1fr)] panel-landscape:py-5"
    >
      <div className="flex flex-col items-center gap-3 panel-landscape:col-[1] panel-landscape:row-[1/5] panel-landscape:items-start panel-landscape:self-start">
        {/* STAND-IN for the drawn wordmark, which has not been supplied. Its box
            is the mark's 31px, so the mark replaces it without moving anything. */}
        <p
          role="img"
          aria-label={content.wordmarkLabel}
          className="flex h-[31px] items-center font-mono text-wordmark text-fg-0 opacity-96"
        >
          {content.wordmarkLabel}
        </p>
        {/* Wraps to two lines inside the landscape column, at 1.6. */}
        <p className="font-mono text-subhead text-fg-2 panel-landscape:leading-[1.6]">
          {content.subhead}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="mt-7 h-px bg-line-panel panel-landscape:col-[3] panel-landscape:row-[1/5] panel-landscape:mt-0 panel-landscape:h-auto"
      />

      {/* `contents`, so the fields, slot, button and footer are items of the
          panel's grid while still belonging to the form — Enter still submits. */}
      <form noValidate onSubmit={onSubmit} className="contents">
        <SignInField
          kind="email"
          content={content.fields.email}
          inputRef={emailRef}
          value={email}
          onChange={edit(setEmail)}
          onKeyDown={onEmailKeyDown}
          readOnly={locked}
          flagged={flagged("email")}
          messageId={messageId}
          className="mt-7 panel-landscape:col-[5/8] panel-landscape:row-[1] panel-landscape:mt-0"
        />

        <SignInField
          kind="password"
          content={content.fields.password}
          inputRef={passwordRef}
          value={password}
          onChange={edit(setPassword)}
          readOnly={locked}
          flagged={flagged("password")}
          messageId={messageId}
          className="mt-[26px] panel-landscape:col-[5/8] panel-landscape:row-[2] panel-landscape:mt-3.5"
        />

        <ErrorSlot
          id={messageId}
          error={content.error}
          missing={content.missing}
          message={message}
          className="mt-[26px] panel-landscape:col-[5/8] panel-landscape:row-[3] panel-landscape:mt-3.5"
        />

        <SubmitButton
          state={submitState}
          content={content.submit}
          className="mt-[26px] panel-landscape:col-[5/8] panel-landscape:row-[4] panel-landscape:mt-3.5"
        />

        {/* Portrait: opposite ends of one row, until the two labels cannot sit
            14px apart — below about 343px of window — when the second wraps to
            its own line, 7px down, still at the right. Whether they fit is a
            question about the labels, so the wrap decides it, not a breakpoint.

            Each is 13px of type with a 44px hit area made of invisible padding.
            The first reaches 25px up, stopping 1px short of the submit button,
            and 6px down; the second 1px up and 30px down, to the inside of the
            border. Side by side those never meet, and wrapped they tile exactly
            across the 7px gap — the same two rules serve both arrangements,
            which is why they are asymmetric.

            Landscape: stacked 44px rows at the foot of the left column, labels
            centred, tiling with no gap. */}
        <div className="mt-[26px] flex flex-wrap justify-between gap-x-3.5 gap-y-[7px] panel-landscape:col-[1] panel-landscape:row-[1/5] panel-landscape:mt-0 panel-landscape:flex-col panel-landscape:flex-nowrap panel-landscape:self-end">
          <button
            type="button"
            className={`${FOOTER_LINK} text-fg-1 before:-top-[25px] before:-bottom-[6px]`}
          >
            {content.footer.forgotPassword}
          </button>
          <button
            type="button"
            className={`${FOOTER_LINK} ml-auto text-fg-2 before:-top-px before:-bottom-[30px] panel-landscape:ml-0`}
          >
            {content.footer.requestAccess}
          </button>
        </div>
      </form>

      {/* Last in the document, so a screen reader meets the form before the way
          out of it; positioned, so it still draws in the corner.

          A 44px square in the corner with the 9px label placed inside it by
          padding, which leaves the label exactly where the spec puts it. On a
          phone this is the control that closes the panel whenever the chrome
          has receded. The ring goes round the label, not the square. */}
      <button
        type="button"
        aria-label={content.escape.accessibleLabel}
        onClick={onClose}
        className="group absolute top-0 right-0 flex h-11 w-11 items-start justify-end pt-[13px] pr-[14px] font-mono text-esc text-fg-3 outline-hidden transition-[color] duration-hover ease-[ease] hover:text-fg-0 active:text-fg-0"
      >
        <span className="group-focus-visible:shadow-panel-focus">
          {content.escape.label}
        </span>
      </button>
    </div>
  );
}

/**
 * Shared by both footer links. The hit area is the `before:` box, positioned by
 * each link; landscape replaces it with a real 44px row.
 */
const FOOTER_LINK =
  "relative font-mono text-meta outline-hidden transition-[color,text-shadow] duration-hover ease-[ease] before:absolute before:inset-x-0 hover:text-fg-0 hover:text-shadow-panel-glow focus-visible:shadow-panel-focus active:text-fg-0 active:text-shadow-panel-glow panel-landscape:flex panel-landscape:h-11 panel-landscape:items-center panel-landscape:before:hidden";
