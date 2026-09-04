import { DialRoot } from "dialkit";
import { OrnamentalGrass } from "./OrnamentalGrass";

export function GrassDemoRoute({
  showRecordingGrid,
}: {
  showRecordingGrid: boolean;
}) {
  return (
    <>
      <main className="page-shell">
        <OrnamentalGrass showRecordingGrid={showRecordingGrid} />
      </main>
      <DialRoot
        position="top-right"
        defaultOpen
        theme="light"
        productionEnabled
      />
    </>
  );
}
