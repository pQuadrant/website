import type { ReactNode } from "react";

import { StageShell } from "@/components/stage/StageShell";

/** The stage lives here so it persists across `/` and `/marketplace`. */
export default function StageLayout({ children }: { children: ReactNode }) {
  return <StageShell>{children}</StageShell>;
}
