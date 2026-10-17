"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { TopLeftCluster } from "@/components/chrome/TopLeftCluster";
import { TopRightCluster } from "@/components/chrome/TopRightCluster";
import { Globe } from "@/components/globe/Globe";
import { BrowseHint } from "@/components/home/BrowseHint";
import { HomeSwipe } from "@/components/home/HomeSwipe";
import { Tagline } from "@/components/home/Tagline";
import { MarketplaceHeading } from "@/components/marketplace/MarketplaceHeading";
import { MarketplacePanel } from "@/components/marketplace/MarketplacePanel";
import { Stage } from "@/components/stage/Stage";
import { Starfield } from "@/components/starfield/Starfield";
import { chromeContent } from "@/content/chrome";
import { homeContent } from "@/content/home";
import { marketplaceContent } from "@/content/marketplace";
import { motifRadius } from "@/lib/globe/projection";
import { chromeClearance } from "@/lib/stage/chrome-clearance";
import { stageCentreY } from "@/lib/stage/centre";
import { stageModeFor } from "@/lib/stage/mode";

/**
 * The persistent stage for both routes, mapped in `codebase-map/routes.md`. It
 * lives in a layout, so it is never remounted when the route changes: the globe
 * and starfield keep running and only their placement follows the URL.
 *
 * Everything either route shows is here, home's copy and the marketplace alike,
 * and fades on the mode with CSS transitions. Nothing uses the browser's view
 * transitions: those freeze rendering while they snapshot the page, which
 * stalled the spinning globe for a beat at the start of every move.
 *
 * Where the small globe goes is CSS — `--mk-globe-x`, `--mk-globe-y` and `--mk-r`
 * in `globals.css`, which know the margins, the bar height and the safe-area
 * insets, and are right on the first paint. The one number CSS cannot produce
 * is the scale, because it divides the small radius by the motif's own, and the
 * motif's radius is decided in script. That is all this sets.
 */
function measureScale(root: HTMLElement): void {
  const width = window.innerWidth;
  const centreY = stageCentreY(root, window.innerHeight);
  const radius = motifRadius(
    width,
    centreY * 2,
    chromeClearance(width / 2, centreY),
  );
  const small = Number.parseFloat(
    getComputedStyle(root).getPropertyValue("--mk-r"),
  );
  root.style.setProperty("--globe-scale", `${small / radius}`);
}

interface StageShellProps {
  children: ReactNode;
}

export function StageShell({ children }: StageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mode = stageModeFor(pathname);
  const motifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const motif = motifRef.current;
    const update = () => measureScale(root);
    update();

    // The move is only animated once the first scale is in place, so a visit
    // that opens on `/marketplace` gets the small globe where it belongs instead
    // of watching it shrink from a guess. Reading the computed scale makes the
    // browser apply the new value now; without it the value and the transition
    // land in the same style update and the transition animates the change.
    if (motif !== null) {
      void getComputedStyle(motif).scale;
      motif.dataset.ready = "";
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (mode !== "market") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, router]);

  return (
    <Stage
      starfield={
        <div
          data-mode={mode}
          className="transition-opacity duration-800 will-change-[opacity] data-[mode=market]:opacity-40 motion-reduce:transition-none"
        >
          <Starfield mode={mode} />
        </div>
      }
      motif={
        // Translated so the motif's centre lands on the small globe's, and
        // scaled about that centre. The canvas is the full stage, so 50% of its
        // own width is the motif's x, and `--stage-centre-y` is its y. The curve
        // starts gently and settles evenly, so no single frame carries a jump,
        // and `will-change` has the layer ready before the first move.
        <div
          ref={motifRef}
          data-mode={mode}
          className="fixed top-0 left-0 h-lvh w-full origin-[50%_var(--stage-centre-y)] will-change-[translate,scale] data-ready:transition-[translate,scale] data-ready:duration-800 data-ready:ease-[cubic-bezier(0.4,0,0.2,1)] data-[mode=market]:[scale:var(--globe-scale,0.15)] data-[mode=market]:[translate:calc(var(--mk-globe-x)-50%)_calc(var(--mk-globe-y)-var(--stage-centre-y))] motion-reduce:transition-none!"
        >
          <Globe />
        </div>
      }
      topLeft={<TopLeftCluster content={chromeContent.topLeft} mode={mode} />}
      topRight={<TopRightCluster content={chromeContent.topRight} />}
    >
      <Tagline content={homeContent.tagline} mode={mode} />
      <BrowseHint label={homeContent.browse} mode={mode} />
      <HomeSwipe active={mode === "home"} />
      <MarketplaceHeading
        heading={marketplaceContent.heading}
        subline={marketplaceContent.subline}
        mode={mode}
      />
      <MarketplacePanel content={marketplaceContent.catalogue} mode={mode} />
      {children}
    </Stage>
  );
}
