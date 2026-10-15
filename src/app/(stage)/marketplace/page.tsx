import { ViewTransition } from "react";

import { MarketplacePanel } from "@/spike/MarketplacePanel";

/** SPIKE. The marketplace route: a panel that enters and exits as a named transition. */
export default function MarketplacePage() {
  return (
    <ViewTransition enter="pq-panel" exit="pq-panel" default="none">
      <MarketplacePanel />
    </ViewTransition>
  );
}
