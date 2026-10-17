"use client";

import { useEffect, useRef } from "react";

import type { TaglineContent } from "@/content/types";
import { CHROME_CORNER_ATTRIBUTE } from "@/lib/stage/chrome-clearance";
import type { StageMode } from "@/lib/stage/mode";
import { STAR_CLEAR_ATTRIBUTE } from "@/lib/starfield/text-clearance";

/**
 * The home page's tagline: bottom-left on a tall window, and centred
 * above the Browse hint on a phone held upright, on the same axis as the globe
 * and the hint.
 *
 * On a phone on its side it is a column of its own in the bottom-left corner,
 * at a smaller size and tighter leading, its last line level with the Browse
 * hint opposite. The column's width is set by what reads well, not by where the
 * globe happens to be: it is a chrome corner, so the globe shrinks to clear it.
 * At 13em that is six lines, which needs 310px of height to stay clear of the
 * bar, and a window narrower than 640px would leave the globe a marble beside
 * it; it is not shown there.
 *
 * Leaving home it fades in 100ms, out of the way before the shrinking globe
 * passes under it (on a phone on its side the globe starts 24px from it); coming back it waits 600ms for the globe to arrive.
 *
 * It lives in the persistent stage rather than on the home route, for two
 * reasons. It is a chrome corner, so the globe sizes itself to clear it, and a
 * corner that came and went with the route would change the globe's size
 * between home and the marketplace. And its entrance plays once per visit, not
 * every time someone comes back from the catalogue.
 *
 * Each word fades in from a blur on its own delay. The delays are set through
 * the Web Animations API rather than per-word styles, anchored to the page's
 * time origin — the clock the chrome's and the globe's entrances already run
 * on. The words start hidden in CSS, so nothing flashes before script runs.
 */

const WORD_MS = 700;
const FIRST_WORD_MS = 900;
const STAGGER_MS = 45;
/** The emphasised words arrive this much later than their place in the line. */
const EMPHASIS_HOLD_MS = 350;
/** The underline starts drawing this long after the emphasis begins. */
const UNDERLINE_AFTER_MS = 450;
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

interface TaglineProps {
  content: TaglineContent;
  mode: StageMode;
}

export function Tagline({ content, mode }: TaglineProps) {
  const lineRef = useRef<HTMLParagraphElement>(null);

  const lead = content.lead.split(" ");
  const emphasis = content.emphasis.split(" ");

  useEffect(() => {
    const line = lineRef.current;
    if (line === null) return;

    const animations: Animation[] = [];
    const play = (element: Element, keyframes: Keyframe[], delay: number) => {
      const animation = element.animate(keyframes, {
        duration: WORD_MS,
        delay,
        easing: EASE,
        fill: "forwards",
      });
      // On the page's clock, not from whenever this effect happened to run.
      animation.startTime = 0;
      animations.push(animation);
    };

    const emphasisStart =
      FIRST_WORD_MS + lead.length * STAGGER_MS + EMPHASIS_HOLD_MS;

    line.querySelectorAll("[data-word]").forEach((word, index) => {
      const emphasised = index >= lead.length;
      play(
        word,
        [
          { opacity: 0, filter: "blur(6px)", translate: "0 6px" },
          { opacity: 1, filter: "blur(0)", translate: "0 0" },
        ],
        FIRST_WORD_MS +
          index * STAGGER_MS +
          (emphasised ? EMPHASIS_HOLD_MS : 0),
      );
    });

    const underline = line.querySelector("[data-underline]");
    if (underline !== null) {
      play(
        underline,
        [{ scale: "0 1" }, { scale: "1 1" }],
        emphasisStart + UNDERLINE_AFTER_MS,
      );
    }

    // Under reduced motion the entrance skips to its end, and a finished
    // animation with `fill: "forwards"` goes on holding the words shown. The
    // `motion-reduce:` classes cover the first paint, before this runs, but stop
    // applying the moment the preference is turned off; without the held end
    // state the words would fall back to hidden. Re-read on every change, so
    // turning it on part way through the entrance snaps the same way. Nothing
    // replays when it is turned off.
    const reducedMotion = window.matchMedia(REDUCED_MOTION);
    const applyMotionPreference = () => {
      if (reducedMotion.matches) {
        animations.forEach((animation) => animation.finish());
      }
    };
    reducedMotion.addEventListener("change", applyMotionPreference);
    applyMotionPreference();

    return () => {
      reducedMotion.removeEventListener("change", applyMotionPreference);
      animations.forEach((animation) => animation.cancel());
    };
  }, [lead.length]);

  // The padding under each word opens the lines up, and gives the underline
  // its gap below the emphasis.
  const word = "inline-block pb-[3px] opacity-0 motion-reduce:opacity-100";

  return (
    <div
      data-mode={mode}
      inert={mode === "market"}
      {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      className="pointer-events-none fixed right-[var(--stage-inset-right)] bottom-[calc(40px+44*var(--chrome-unit)+16px+env(safe-area-inset-bottom))] left-[var(--stage-inset-left)] transition-opacity delay-600 duration-400 data-[mode=market]:opacity-0 data-[mode=market]:delay-0 data-[mode=market]:duration-100 row:right-auto row:bottom-[var(--stage-inset-bottom)] short:right-auto short:bottom-[calc(50px+env(safe-area-inset-bottom))] [@media(height<310px)]:hidden [@media(height<500px)_and_(width<640px)]:hidden"
    >
      {/* Beside the globe, the line stops 130px short of the window's middle so
          it never runs under the centre, but not narrower than 18em, which on
          a tall tablet would stack it into a column of two-word lines. */}
      <p
        ref={lineRef}
        {...{ [STAR_CLEAR_ATTRIBUTE]: "home" }}
        className="text-center text-balance row:max-w-[min(26em,max(18em,calc(50vw-var(--stage-inset-left)-130px)))] row:text-left row:text-pretty short:w-[13em] short:text-left short:text-pretty short:text-[calc(13*var(--chrome-unit))] short:leading-[1.4] font-sans text-[calc(15*var(--chrome-unit))] leading-[1.55] text-fg-1 text-shadow-glow-1"
      >
        {/* Read once, as a sentence. The word-by-word copy below is for the
            eye only. */}
        <span className="sr-only">
          {content.lead} {content.emphasis}
        </span>
        <span aria-hidden="true">
          {lead.map((text, index) => (
            <span key={index}>
              <span data-word="" className={word}>
                {text}
              </span>{" "}
            </span>
          ))}
          <span className="relative inline-block">
            {emphasis.map((text, index) => (
              <span key={index}>
                {index > 0 && " "}
                <span
                  data-word=""
                  className={`${word} text-fg-0 text-shadow-glow-0`}
                >
                  {text}
                </span>
              </span>
            ))}
            <span
              data-underline=""
              className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-accent-bright/75 motion-reduce:scale-x-100"
            />
          </span>
        </span>
      </p>
    </div>
  );
}
