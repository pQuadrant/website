"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BottomLeftCluster } from "@/components/chrome/BottomLeftCluster";
import { BottomRightCluster } from "@/components/chrome/BottomRightCluster";
import { TopLeftCluster } from "@/components/chrome/TopLeftCluster";
import { TopRightCluster } from "@/components/chrome/TopRightCluster";
import { Globe } from "@/components/globe/Globe";
import { useClearZone } from "@/components/globe/use-clear-zone";
import { previewAuthenticate } from "@/components/sign-in-panel/preview-authenticate"; // SCAFFOLDING
import {
  SignInPanel,
  type SignInPhase,
} from "@/components/sign-in-panel/SignInPanel";
import { Stage } from "@/components/stage/Stage";
import { useChromeRecede } from "@/components/stage/use-chrome-recede";
import { Starfield } from "@/components/starfield/Starfield";
import { homeContent } from "@/content/home";
import type { GlobeStatus } from "@/lib/globe/state";

/** Ties the toggle in the chrome to the panel it controls. */
const PANEL_ID = "sign-in-panel";

/**
 * What the motif does at each point in an attempt. Granted has no state of its
 * own, and a rejection is handed over once: the motif clears its own flinch.
 */
const GLOBE_STATUS: Record<SignInPhase, GlobeStatus> = {
  processing: "loading",
  granted: "idle",
  rejected: "error",
};

export default function HomePage() {
  // The toggle and the panel sit in different corners of the tree, so their
  // shared state lives here, at the nearest parent of both. None of it changes
  // on a keystroke — the form's values live in the panel — so typing does not
  // re-render the page.
  const [panelOpen, setPanelOpen] = useState(false);
  const [globeStatus, setGlobeStatus] = useState<GlobeStatus>("idle");
  const [fieldFocused, setFieldFocused] = useState(false);

  // The panel's footprint, measured here and handed to the motif as four
  // numbers, and to the stage as whether the chrome is in its way. Measuring
  // belongs to whoever renders the panel; see the hooks.
  const panelRef = useRef<HTMLDivElement>(null);
  const clearZone = useClearZone(panelRef, panelOpen);
  const chromeReceded = useChromeRecede(panelRef, panelOpen);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    // An unmounted field fires no blur, so focus is cleared here.
    setFieldFocused(false);
    // An abandoned attempt stops spinning the motif; a flinch already under way
    // is left to finish, because the motif clears that itself.
    setGlobeStatus((status) => (status === "loading" ? "idle" : status));
    returnFocus.current = true;
  }, []);

  // After the panel has gone, never before: focus must not be left on an
  // element that has been removed. The chrome is visible again by now — the
  // stage stops receding on the same render that closes the panel.
  useEffect(() => {
    if (panelOpen || !returnFocus.current) return;
    returnFocus.current = false;
    toggleRef.current?.focus();
  }, [panelOpen]);

  const { chrome } = homeContent;

  return (
    <Stage
      starfield={<Starfield />}
      motif={
        <Globe
          clearZone={clearZone}
          status={globeStatus}
          focused={fieldFocused}
        />
      }
      bloom={globeStatus === "loading"}
      chromeReceded={chromeReceded}
      topLeft={<TopLeftCluster content={chrome.topLeft} />}
      topRight={
        <TopRightCluster
          content={chrome.topRight}
          panelOpen={panelOpen}
          onToggle={() => (panelOpen ? closePanel() : setPanelOpen(true))}
          panelId={PANEL_ID}
          toggleRef={toggleRef}
        />
      }
      bottomLeft={<BottomLeftCluster content={chrome.bottomLeft} />}
      bottomRight={<BottomRightCluster content={chrome.bottomRight} />}
    >
      {panelOpen && (
        <SignInPanel
          id={PANEL_ID}
          panelRef={panelRef}
          content={homeContent.panel}
          onClose={closePanel}
          onFocusChange={setFieldFocused}
          onPhaseChange={(phase) => setGlobeStatus(GLOBE_STATUS[phase])}
          authenticate={previewAuthenticate} // SCAFFOLDING
        />
      )}
    </Stage>
  );
}
