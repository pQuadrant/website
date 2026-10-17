"use client";

import { useEffect, useState } from "react";

/**
 * The privacy policy's contents, pinned to the right margin on wide windows,
 * where the stage keeps its top-right controls. Each entry jumps to its
 * section, and the section being read is lit with the chrome's glow and an
 * accent rule.
 *
 * The section being read is the last one whose heading has passed the upper
 * fifth of the window. The last few sections are too short to reach that line,
 * so at the foot of the page it is the one just jumped to, if it is in view,
 * and otherwise the last. It is worked out on scroll, at most once a frame, so
 * nothing runs while the page is still.
 */

interface PrivacyContentsProps {
  label: string;
  sections: readonly { id: string; heading: string }[];
}

export function PrivacyContents({ label, sections }: PrivacyContentsProps) {
  const [current, setCurrent] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element) => element !== null);
    let frame = 0;

    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const atFoot =
        window.scrollY + window.innerHeight >= root.scrollHeight - 2;
      let reading: HTMLElement | undefined = headings[0];

      if (atFoot) {
        const jumped = headings.find(
          (heading) => `#${heading.id}` === window.location.hash,
        );
        const top = jumped?.getBoundingClientRect().top ?? -1;
        const inView = top >= 0 && top < window.innerHeight;
        reading = inView ? jumped : headings.at(-1);
      } else {
        const line = window.innerHeight * 0.2;
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= line) reading = heading;
        }
      }
      if (reading !== undefined) setCurrent(reading.id);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
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
