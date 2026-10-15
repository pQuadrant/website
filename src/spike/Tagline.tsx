"use client";

import { useEffect, useRef } from "react";

import type { TaglineContent } from "@/content/types";
import { CHROME_CORNER_ATTRIBUTE } from "@/lib/stage/chrome-clearance";

/**
 * SPIKE. The home page's tagline, bottom-left on a tall window and above the
 * Browse hint on a phone held upright. Not shown on a short window: a phone on
 * its side has no height under the globe to put it in.
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

interface TaglineProps {
  content: TaglineContent;
  mode: "home" | "market";
}

export function Tagline({ content, mode }: TaglineProps) {
  const lineRef = useRef<HTMLParagraphElement>(null);

  const lead = content.lead.split(" ");
  const emphasis = content.emphasis.split(" ");

  useEffect(() => {
    const line = lineRef.current;
    if (line === null) return;
    // Under reduced motion CSS shows every word at once and nothing runs.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    return () => animations.forEach((animation) => animation.cancel());
  }, [lead.length]);

  const word = "inline-block opacity-0 motion-reduce:opacity-100";

  return (
    <div
      data-mode={mode}
      inert={mode === "market"}
      {...{ [CHROME_CORNER_ATTRIBUTE]: true }}
      className="pointer-events-none fixed right-[var(--mk-inset-right)] bottom-[calc(40px+44*var(--chrome-unit)+16px+env(safe-area-inset-bottom))] left-[var(--mk-inset-left)] transition-opacity duration-500 data-[mode=market]:opacity-0 row:right-auto row:bottom-[calc(40px+env(safe-area-inset-bottom))] row:max-w-[26em] stage:bottom-[calc(64px+env(safe-area-inset-bottom))] [@media(max-height:499.98px)]:hidden"
    >
      <p
        ref={lineRef}
        className="font-sans text-[calc(15*var(--chrome-unit))] leading-[1.55] text-pretty text-fg-1 text-shadow-glow-1"
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
              className="absolute right-0 -bottom-0.5 left-0 h-px origin-left scale-x-0 bg-accent-bright/75 motion-reduce:scale-x-100"
            />
          </span>
        </span>
      </p>
    </div>
  );
}
