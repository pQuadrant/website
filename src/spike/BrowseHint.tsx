import Link from "next/link";

import { spikeContent } from "@/spike/content";

interface BrowseHintProps {
  mode: "home" | "market";
}

/**
 * SPIKE. `BROWSE AI SYSTEMS ↓`, the way into the marketplace wherever the
 * HOME / MARKETPLACE switch is not shown.
 *
 * Part of the persistent stage, so it fades on the mode rather than mounting
 * and unmounting with the route. Leaving home it is gone in 160ms, before the
 * shrinking globe passes it; coming back it waits 600ms for the globe to
 * arrive. Visibility rides along so it is hidden once faded, and `inert` keeps
 * it out of the tab order in the marketplace.
 */
export function BrowseHint({ mode }: BrowseHintProps) {
  return (
    <Link
      href="/marketplace"
      data-mode={mode}
      inert={mode === "market"}
      className="fixed bottom-[calc(40px+env(safe-area-inset-bottom))] left-1/2 flex h-chrome-touch -translate-x-1/2 items-center gap-[calc(10*var(--chrome-unit))] px-chrome-control-pad font-mono text-chrome-label text-fg-0 text-shadow-glow-0 [transition:opacity_400ms_ease-out_600ms,translate_200ms,visibility_0s_linear_600ms] hover:translate-y-0.5 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:translate-y-0.5 data-[mode=market]:invisible data-[mode=market]:opacity-0 data-[mode=market]:[transition:opacity_160ms_ease-out,translate_200ms,visibility_0s_linear_160ms] stage-narrow:right-[calc(40px+env(safe-area-inset-right))] stage-narrow:left-auto stage-narrow:translate-x-0 short:right-[calc(24px+env(safe-area-inset-right))] short:left-auto short:translate-x-0 row:hidden motion-reduce:transition-none!"
    >
      {spikeContent.browse}
      <span aria-hidden="true">↓</span>
    </Link>
  );
}
