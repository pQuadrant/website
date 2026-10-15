"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { TopRightCluster } from "@/components/chrome/TopRightCluster";
import { Globe } from "@/components/globe/Globe";
import { Stage } from "@/components/stage/Stage";
import { Starfield } from "@/components/starfield/Starfield";
import { homeContent } from "@/content/home";
import { motifRadius } from "@/lib/globe/projection";
import { chromeClearance } from "@/lib/stage/chrome-clearance";
import { stageCentreY } from "@/lib/stage/centre";
import { SpikeTopBar } from "@/spike/SpikeTopBar";

/**
 * SPIKE. The persistent stage for the route experiment. It lives in a layout, so
 * it is never remounted when the route changes: the globe and starfield keep
 * running and only their placement follows the URL.
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
  const mode = pathname.startsWith("/marketplace") ? "market" : "home";
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
          className="transition-opacity duration-800 data-[mode=market]:opacity-40 motion-reduce:transition-none"
        >
          <Starfield />
        </div>
      }
      motif={
        // Translated so the motif's centre lands on the small globe's, and
        // scaled about that centre. The canvas is the full stage, so 50% of its
        // own width is the motif's x, and `--stage-centre-y` is its y.
        <div
          ref={motifRef}
          data-mode={mode}
          className="fixed top-0 left-0 h-lvh w-full origin-[50%_var(--stage-centre-y)] data-ready:transition-[translate,scale] data-ready:duration-1000 data-ready:ease-[cubic-bezier(0.2,0.7,0.2,1)] data-[mode=market]:[scale:var(--globe-scale,0.15)] data-[mode=market]:[translate:calc(var(--mk-globe-x)-50%)_calc(var(--mk-globe-y)-var(--stage-centre-y))] motion-reduce:transition-none"
        >
          <Globe />
        </div>
      }
      topLeft={<SpikeTopBar mode={mode} />}
      topRight={<TopRightCluster content={homeContent.chrome.topRight} />}
    >
      {children}
    </Stage>
  );
}
