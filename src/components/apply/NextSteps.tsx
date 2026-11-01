import Link from "next/link";

import {
  ACTION_HEIGHT,
  INLINE_LINK,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
} from "@/components/apply/action-styles";
import { ApplyTitle } from "@/components/apply/ApplyTitle";
import type { ApplyContent } from "@/content/types";

/**
 * The screen once an email code is confirmed, and whenever the panel opens
 * while an application is open on this device: the two ways on, the
 * marketplace or a custom request, and "Not you?", which closes the
 * application on this device. See Apply flow in `codebase-map/apply.md`.
 */

interface NextStepsProps {
  content: ApplyContent["next"];
  title: string;
  body: string;
  onClose: () => void;
  onNotYou: () => void;
}

export function NextSteps({
  content,
  title,
  body,
  onClose,
  onNotYou,
}: NextStepsProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <ApplyTitle text={title} />
      <p className="text-[calc(15*var(--chrome-unit))] leading-[1.55] text-pretty text-fg-1">
        {body}
      </p>
      {/* Two choices, stacked full width at every size: side by side they
          do not fit the panel, and wrapped they sit at uneven widths. */}
      <div className="mt-1.5 flex w-full flex-col gap-2.5">
        <Link
          href="/marketplace"
          onClick={onClose}
          className={`${PRIMARY_ACTION} ${ACTION_HEIGHT}`}
        >
          {content.marketplace}
        </Link>
        {/* Where a custom request leads is not decided yet. */}
        <button
          type="button"
          className={`${SECONDARY_ACTION} ${ACTION_HEIGHT}`}
        >
          {content.custom}
        </button>
      </div>
      <p className="text-[calc(13*var(--chrome-unit))] leading-snug text-fg-2">
        {content.notYou.question}{" "}
        <button type="button" onClick={onNotYou} className={INLINE_LINK}>
          {content.notYou.action}
        </button>
      </p>
    </div>
  );
}
