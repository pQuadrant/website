import { ViewTransition } from "react";

import { MarketplaceHeading } from "@/spike/MarketplaceHeading";
import { MarketplacePanel } from "@/spike/MarketplacePanel";

/** SPIKE. The marketplace route: a panel that enters and exits as a named transition. */
export default function MarketplacePage() {
  return (
    <>
      <ViewTransition enter="pq-heading" exit="pq-heading" default="none">
        <MarketplaceHeading />
      </ViewTransition>
      <ViewTransition enter="pq-panel" exit="pq-panel" default="none">
        <MarketplacePanel />
      </ViewTransition>
    </>
  );
}
