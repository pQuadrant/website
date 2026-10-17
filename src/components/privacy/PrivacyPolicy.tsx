import Link from "next/link";

import type {
  ChromeTopLeftContent,
  PrivacyBlock,
  PrivacyContent,
} from "@/content/types";

/**
 * The privacy policy page, mapped under Privacy policy in
 * `codebase-map/content.md`.
 *
 * A plain reading page outside the stage: no globe, no starfield, and the
 * document scrolls normally. It keeps the stage's fill, type, colours and the
 * glowing wordmark, which sits where it does on the stage and leads home.
 */

interface PrivacyPolicyProps {
  content: PrivacyContent;
  wordmark: ChromeTopLeftContent["wordmark"];
}

const LINK =
  "text-fg-0 underline decoration-fg-2 underline-offset-2 transition-[text-decoration-color] duration-hover hover:decoration-fg-0 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:decoration-fg-0";

export function PrivacyPolicy({ content, wordmark }: PrivacyPolicyProps) {
  // The contact address is linked wherever it appears in the text.
  const withEmail = (text: string) =>
    text.split(content.contactEmail).flatMap((part, index) =>
      index === 0
        ? [part]
        : [
            <a
              key={index}
              href={`mailto:${content.contactEmail}`}
              className={LINK}
            >
              {content.contactEmail}
            </a>,
            part,
          ],
    );

  const block = (item: PrivacyBlock, index: number) =>
    typeof item === "string" ? (
      <p key={index} className="mt-3">
        {withEmail(item)}
      </p>
    ) : (
      <ul
        key={index}
        className="mt-3 list-disc space-y-2 pl-5 marker:text-fg-2"
      >
        {item.list.map((entry) => (
          <li key={entry}>{withEmail(entry)}</li>
        ))}
      </ul>
    );

  return (
    <div className="min-h-svh pt-[calc(56px+env(safe-area-inset-top))] pr-[var(--stage-inset-right)] pb-[calc(96px+env(safe-area-inset-bottom))] pl-[var(--stage-inset-left)]">
      {/* The stage's wordmark inherits the chrome label's tracking, 0.2em of
          the 10-unit label size, so the same 2 units are written here. */}
      <header className="flex h-chrome-touch items-center row:h-chrome-control">
        <Link
          href="/"
          aria-label={wordmark.accessibleLabel}
          className="font-sans text-[calc(17*var(--chrome-unit))] tracking-[calc(2*var(--chrome-unit))] text-fg-0 text-shadow-glow-0 transition-[color,text-shadow] duration-hover focus-visible:shadow-glow-focus focus-visible:outline-hidden"
        >
          {wordmark.label}
        </Link>
      </header>

      <main className="mt-14 max-w-[680px] text-[calc(15*var(--chrome-unit))] leading-[1.65] text-pretty text-fg-1 row:mt-20">
        <h1 className="font-sans text-[calc(28*var(--chrome-unit))] leading-[1.15] tracking-[-0.015em] text-fg-0 text-shadow-glow-0">
          {content.title}
        </h1>
        <p className="mt-3 font-mono text-chrome-label text-fg-2">
          {content.updated}
        </p>

        <div className="mt-8">{content.intro.map(block)}</div>

        {content.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-sans text-[calc(18*var(--chrome-unit))] leading-[1.3] text-fg-0">
              {section.heading}
            </h2>
            {section.blocks.map(block)}
          </section>
        ))}
      </main>
    </div>
  );
}
