"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

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
 * VARIANT A: the globe's canvas is scaled and translated with CSS. The target
 * is worked out here from the same numbers the globe uses for its own radius,
 * and handed to CSS as custom properties on the root.
 */

/** The small globe's radius in chrome units, wide window and phone. */
const SMALL_RADIUS_WIDE = 52;
const SMALL_RADIUS_NARROW = 34;

/** The chrome scale from `--chrome-unit`, which script cannot read as a number. */
function chromeUnit(width: number): number {
  return Math.min(1.7, Math.max(1, 1 + (width - 1024) * 0.00045573));
}

function place(): void {
  const root = document.documentElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const centreX = width / 2;
  const centreY = stageCentreY(root, height);
  const radius = motifRadius(
    width,
    centreY * 2,
    chromeClearance(root, centreX, centreY),
  );

  const unit = chromeUnit(width);
  const wide = width >= 640;
  // A window too short to stack the globe above the catalogue, which is every
  // phone on its side. It has width to spare and no height, so the globe moves
  // into a column of its own and the catalogue sits beside it.
  const short = height < 500;
  const row = wide && !short;
  const margin = width >= 1100 ? 64 : wide ? 40 : 24;
  const targetRadius =
    (wide && !short ? SMALL_RADIUS_WIDE : SMALL_RADIUS_NARROW) * unit;
  const barBottom = 56 + (row ? 34 : 44) * unit;
  const targetX = margin + targetRadius;
  const targetY = barBottom + (short ? 12 : 24) + targetRadius;
  const panelTop = short ? barBottom + 12 : targetY + targetRadius + 12;
  // The panel box starts one margin early so that its own padding puts the
  // content a gutter clear of the globe.
  const panelLeft = short ? targetX + targetRadius + 24 - margin : 0;

  root.style.setProperty("--globe-origin", `${centreX}px ${centreY}px`);
  root.style.setProperty("--globe-dx", `${targetX - centreX}px`);
  root.style.setProperty("--globe-dy", `${targetY - centreY}px`);
  root.style.setProperty("--globe-scale", `${targetRadius / radius}`);
  root.style.setProperty("--panel-top", `${panelTop}px`);
  root.style.setProperty("--panel-left", `${panelLeft}px`);
  root.style.setProperty("--globe-radius", `${radius}px`);
  root.style.setProperty(
    "--globe-small",
    `${targetX}px ${targetY}px ${targetRadius}px`,
  );
}

interface StageShellProps {
  children: ReactNode;
}

export function StageShell({ children }: StageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mode = pathname.startsWith("/marketplace") ? "market" : "home";

  useEffect(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
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
        <div
          data-mode={mode}
          className="fixed top-0 left-0 h-lvh w-full origin-(--globe-origin) transition-transform duration-1000 ease-[cubic-bezier(0.2,0.7,0.2,1)] data-[mode=market]:translate-x-(--globe-dx) data-[mode=market]:translate-y-(--globe-dy) data-[mode=market]:scale-(--globe-scale) motion-reduce:transition-none"
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
