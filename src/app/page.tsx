import { Stage } from "@/components/stage/Stage";

export default function HomePage() {
  return (
    <Stage>
      {/* SCAFFOLDING: stands in for the sign-in panel at its specified size, so
          that the centring rules and the stage's minimum height — both derived
          from these dimensions — can be verified. Replaced by the panel itself;
          see `docs/design/sign-in-panel.md`. */}
      <div className="h-panel-height w-panel-width border border-line-panel bg-panel" />
    </Stage>
  );
}
