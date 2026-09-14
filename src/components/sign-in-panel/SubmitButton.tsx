import type { SignInSubmitContent } from "@/content/types";

export type SubmitState = "resting" | "processing" | "granted";

/**
 * The panel's submit button, in its three states.
 *
 * Specified in `docs/design/sign-in-panel.md`, under _Submit button_.
 */
interface SubmitButtonProps {
  state: SubmitState;
  content: SignInSubmitContent;
  /** Where the button sits in the panel's grid. */
  className: string;
}

/** Presentation rather than language, so drawn here. */
const GLYPHS: Record<SubmitState, string> = {
  resting: "→",
  processing: "◍",
  granted: "✓",
};

/**
 * Hover and active in the resting state only. Active is not a duplicate of
 * hover: Tailwind confines `hover:` to devices that hover, so without it a tap
 * would be acknowledged with nothing.
 *
 * While processing, the focus ring is layered over the glow rather than
 * replacing it — both are box shadows, and a focused button must not lose the
 * state it is announcing.
 */
const STATES: Record<SubmitState, string> = {
  resting:
    "border-line-control text-fg-0 hover:border-accent hover:text-accent active:border-accent active:text-accent focus-visible:shadow-panel-focus",
  processing:
    "border-line-control text-fg-processing shadow-submit-processing focus-visible:shadow-[var(--shadow-panel-focus),var(--shadow-submit-processing)]",
  granted: "border-accent text-accent focus-visible:shadow-panel-focus",
};

export function SubmitButton({ state, content, className }: SubmitButtonProps) {
  return (
    /* Disabled to assistive technology rather than with `disabled`. A disabled
       element drops focus to the document, and a screen reader would lose its
       place at the moment the result it is waiting for arrives. The form's
       submit handler refuses anything but the resting state, so this is not
       merely cosmetic. The page's pointer cursor rule already excludes
       `aria-disabled`. */
    <button
      type="submit"
      aria-disabled={state !== "resting" || undefined}
      className={`relative flex h-[46px] w-full items-center justify-between overflow-hidden border px-4 font-mono text-submit outline-hidden [transition:border-color_180ms_ease,color_180ms_ease,box-shadow_320ms_ease] ${STATES[state]} ${className}`}
    >
      <span>{content[state]}</span>
      <span aria-hidden="true" className="opacity-55">
        {GLYPHS[state]}
      </span>

      {/* Clipped by the button at each edge. Under reduced motion it holds
          still at the left end; the label, glyph and glow still say what is
          happening. */}
      {state === "processing" && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-[38%] animate-scan bg-signal motion-reduce:animate-none"
        />
      )}
    </button>
  );
}
