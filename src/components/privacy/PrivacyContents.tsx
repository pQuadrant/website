"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The privacy policy's contents, pinned to the right margin on wide windows,
 * where the stage keeps its top-right controls. Each entry jumps to its
 * section, and the section being read is lit with the chrome's glow and an
 * accent rule.
 *
 * The section being read is the last one whose heading has passed a reading
 * line a fifth of the way down the window. The last few sections are too short
 * to scroll up to that line in good time, so the last stretch of scrolling is
 * shared out equally between the sections that have not reached it when the
 * stretch begins: each takes its turn, in order, however coarse the
 * scroll steps, and the last is lit at the foot. An entry chosen from the list stays lit until the visitor scrolls on
 * their own, since a jump near the foot cannot bring its heading to the line.
 * It is worked out on scroll, at most once a frame, so nothing runs while the
 * page is still.
 */

/** The reading line, as a share of the window's height from the top. */
const LINE = 0.2;
/** The stretch before the foot shared out between the sections that cannot
 * reach the line, in window heights. */
const TAIL = 1;

interface PrivacyContentsProps {
  label: string;
  sections: readonly { id: string; heading: string }[];
}

export function PrivacyContents({ label, sections }: PrivacyContentsProps) {
  const [current, setCurrent] = useState(sections[0]?.id);
  const chosen = useRef<string | null>(null);

  useEffect(() => {
    const headings = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element) => element !== null);
    let frame = 0;

    const update = () => {
      frame = 0;
      if (chosen.current !== null) {
        setCurrent(chosen.current);
        return;
      }
      const height = window.innerHeight;
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - height;
      const line = height * LINE;

      let reading: HTMLElement | undefined = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) reading = heading;
      }

      // Headings still below the line when the final stretch begins.
      const stretch = Math.min(height * TAIL, max);
      const tail = headings.filter(
        (heading) =>
          heading.getBoundingClientRect().top + scrolled - line > max - stretch,
      );
      const progress = (scrolled - (max - stretch)) / stretch;
      if (tail.length > 0 && progress > 0) {
        // One share for the line's own choice, then one for each of the tail.
        const share = Math.min(
          tail.length,
          Math.floor(progress * (tail.length + 1)),
        );
        if (share > 0) reading = tail[share - 1];
      }
      if (reading !== undefined) setCurrent(reading.id);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    // The visitor scrolling by wheel, touch or keyboard hands the choice back
    // to the reading line.
    const release = () => {
      chosen.current = null;
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("keydown", release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("keydown", release);
    };
  }, [sections]);

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col">
        {sections.map(({ id, heading }) => {
          const reading = id === current;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={reading ? "location" : undefined}
                onClick={() => {
                  chosen.current = id;
                  setCurrent(id);
                }}
                className={`block border-l py-1.5 pl-4 text-[calc(13*var(--chrome-unit))] leading-snug transition-[color,border-color,text-shadow] duration-hover hover:text-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:text-fg-0 ${reading ? "border-accent-bright text-fg-0 text-shadow-glow-0" : "border-hairline text-fg-1"}`}
              >
                {heading}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
