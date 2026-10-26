import type { ApplyFieldContent } from "@/content/types";
import type { AnswerProblem } from "@/lib/apply/application";

/**
 * One question on the apply form: its label, its control and, when the answer
 * cannot be accepted, a message under it saying why.
 *
 * The message is tied to the control with `aria-describedby`, so a screen
 * reader reads it when the form moves focus to the field.
 */

export type ApplyFieldKind =
  "text" | "email" | "tel" | "select" | "textarea" | "code";

interface ApplyFieldProps {
  id: string;
  kind: ApplyFieldKind;
  content: ApplyFieldContent;
  value: string;
  onChange: (value: string) => void;
  /** Called when focus leaves the field, where the answer is tidied. */
  onBlur?: () => void;
  maxLength: number;
  /** The problem to show, or `null` while there is none to show. */
  problem: AnswerProblem | null;
  /** Set beside the label when the question may be left blank. */
  optionalLabel?: string;
  autoComplete?: string;
  /** For a list: its empty first choice, then the answers. */
  choose?: string;
  options?: readonly string[];
  /** Spans both columns of the form. */
  wide?: boolean;
}

/**
 * The field's box. Inputs are 36 units tall beside the chrome row's 34, 44 on
 * a phone, and take 16px text on a coarse pointer so iOS does not zoom in on
 * focus. The 2px radius from the design is left out: every control on the
 * stage has square corners.
 */
const CONTROL =
  "w-full border bg-field-fill px-[calc(12*var(--chrome-unit))] text-fg-0 outline-hidden transition-[border-color,box-shadow,background-color] duration-hover ease-[ease] placeholder:text-fg-2 hover:border-hairline-hover focus:border-accent-bright focus:bg-field-focus-fill focus:shadow-field-focus";

const TEXT =
  "font-sans text-[calc(15*var(--chrome-unit))] pointer-coarse:text-[16px]";

/** A one-time code, set wide and spaced in the chrome's mono so each digit
 * stands apart. */
const CODE =
  "font-mono text-[calc(20*var(--chrome-unit))] tracking-[0.4em] pointer-coarse:text-[20px]";

const HEIGHT = "h-chrome-touch row:h-[calc(36*var(--chrome-unit))]";

export function ApplyField({
  id,
  kind,
  content,
  value,
  onChange,
  onBlur,
  maxLength,
  problem,
  optionalLabel,
  autoComplete,
  choose,
  options = [],
  wide = false,
}: ApplyFieldProps) {
  const message = problem === null ? undefined : content[problem];
  const messageId = `${id}-message`;
  // A field with a problem stays red while it is being put right, focus
  // included; its message goes, and the border with it, once it is.
  const border =
    problem === null
      ? "border-hairline"
      : "border-error hover:border-error focus:border-error";

  const shared = {
    id,
    name: id,
    value,
    onBlur,
    "aria-invalid": problem !== null,
    "aria-describedby": message === undefined ? undefined : messageId,
  };

  let control;
  if (kind === "select") {
    control = (
      <span className="relative flex">
        <select
          {...shared}
          onChange={(event) => onChange(event.target.value)}
          className={`${CONTROL} ${TEXT} ${HEIGHT} ${border} appearance-none pr-[calc(30*var(--chrome-unit))] ${value === "" ? "text-fg-1" : ""}`}
        >
          <option value="" className="bg-stage text-fg-0">
            {choose}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-stage text-fg-0">
              {option}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-[calc(12*var(--chrome-unit))] -translate-y-1/2 font-mono text-chrome-label text-fg-2"
        >
          ↓
        </span>
      </span>
    );
  } else if (kind === "textarea") {
    // Three lines tall, two under 600px tall where the step would otherwise
    // not fit the screen. A longer answer scrolls inside the box, never the
    // panel around it. The height counts the box's padding and border.
    control = (
      <textarea
        {...shared}
        rows={3}
        maxLength={maxLength}
        placeholder={content.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${TEXT} ${border} block resize-none overscroll-contain py-[calc(9*var(--chrome-unit))] leading-[1.45] cramped:h-[calc(2lh+18*var(--chrome-unit)+2px)]`}
      />
    );
  } else if (kind === "code") {
    // Digits only on a phone's keypad, and offered from the email or message
    // by the phone itself where it can (`one-time-code`).
    control = (
      <input
        {...shared}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={maxLength}
        placeholder={content.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${CODE} ${HEIGHT} ${border}`}
      />
    );
  } else {
    control = (
      <input
        {...shared}
        type={kind}
        maxLength={maxLength}
        placeholder={content.placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${TEXT} ${HEIGHT} ${border}`}
      />
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 row:gap-[7px] ${wide ? "col-span-2" : ""}`}
    >
      <label
        htmlFor={id}
        className="font-mono text-[calc(9*var(--chrome-unit))] tracking-[0.2em] text-fg-1"
      >
        {content.label}
        {optionalLabel !== undefined && (
          <span className="text-fg-2"> {optionalLabel}</span>
        )}
      </label>
      {control}
      {message !== undefined && (
        <p
          id={messageId}
          className="text-[calc(12*var(--chrome-unit))] leading-snug text-error"
        >
          {message}
        </p>
      )}
    </div>
  );
}
