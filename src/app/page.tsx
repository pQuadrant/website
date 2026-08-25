"use client";

import { useState } from "react";

import { BottomLeftCluster } from "@/components/chrome/BottomLeftCluster";
import { BottomRightCluster } from "@/components/chrome/BottomRightCluster";
import { TopLeftCluster } from "@/components/chrome/TopLeftCluster";
import { TopRightCluster } from "@/components/chrome/TopRightCluster";
import { Stage } from "@/components/stage/Stage";
import { homeContent } from "@/content/home";

/** Ties the toggle in the chrome to the panel it controls. */
const PANEL_ID = "sign-in-panel";

export default function HomePage() {
  // The toggle and the panel sit in different corners of the tree, so their
  // shared state lives here, at the nearest parent of both.
  const [panelOpen, setPanelOpen] = useState(false);

  const { chrome } = homeContent;

  return (
    <Stage
      topLeft={<TopLeftCluster content={chrome.topLeft} />}
      topRight={
        <TopRightCluster
          content={chrome.topRight}
          panelOpen={panelOpen}
          onToggle={() => setPanelOpen((open) => !open)}
          panelId={PANEL_ID}
        />
      }
      bottomLeft={<BottomLeftCluster content={chrome.bottomLeft} />}
      bottomRight={<BottomRightCluster content={chrome.bottomRight} />}
    >
      {panelOpen && (
        /* SCAFFOLDING: stands in for the sign-in panel at its specified size, so
           that the centring rules and the stage's minimum height — both derived
           from these dimensions — can be verified. Replaced by the panel itself;
           see `docs/design/sign-in-panel.md`. */
        <div
          id={PANEL_ID}
          className="pointer-events-auto h-panel-height w-panel-width border border-line-panel bg-panel"
        />
      )}
    </Stage>
  );
}
