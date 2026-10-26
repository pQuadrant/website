import { STEP_TITLE_ATTRIBUTE } from "@/lib/apply/focus";

/**
 * The heading of each screen in the apply panel. It takes focus in place of a
 * field on touch screens (`focusStart`), so it is focusable but shows no ring.
 */
export function ApplyTitle({ text }: { text: string }) {
  return (
    <h2
      tabIndex={-1}
      {...{ [STEP_TITLE_ATTRIBUTE]: "" }}
      className="font-sans text-[calc(22*var(--chrome-unit))] leading-[1.2] tracking-[-0.01em] text-fg-0 text-shadow-glow-0 outline-hidden"
    >
      {text}
    </h2>
  );
}
