import Link from "next/link";
import { ViewTransition } from "react";

import { spikeContent } from "@/spike/content";
import { HomeSwipe } from "@/spike/HomeSwipe";

/** SPIKE. Home: the ways into the marketplace, the Browse hint and a swipe up. */
export default function HomePage() {
  return (
    <ViewTransition enter="pq-fade" exit="pq-fade" default="none">
      <HomeSwipe />
      <Link
        href="/marketplace"
        className="fixed bottom-[calc(40px+env(safe-area-inset-bottom))] left-1/2 flex h-chrome-touch -translate-x-1/2 items-center gap-[calc(10*var(--chrome-unit))] px-chrome-control-pad font-mono text-chrome-label text-fg-0 text-shadow-glow-0 transition-transform duration-200 hover:translate-y-0.5 focus-visible:shadow-glow-focus focus-visible:outline-hidden active:translate-y-0.5 stage-narrow:right-[calc(40px+env(safe-area-inset-right))] stage-narrow:left-auto stage-narrow:translate-x-0 [@media(max-height:499.98px)]:right-[calc(24px+env(safe-area-inset-right))] [@media(max-height:499.98px)]:left-auto [@media(max-height:499.98px)]:translate-x-0 row:hidden"
      >
        {spikeContent.browse}
        <span aria-hidden="true">↓</span>
      </Link>
    </ViewTransition>
  );
}
