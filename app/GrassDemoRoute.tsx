import { OrnamentalGrass } from "./OrnamentalGrass";

export function GrassDemoRoute({
  showRecordingGrid,
}: {
  showRecordingGrid: boolean;
}) {
  return (
    <main className="page-shell">
      <OrnamentalGrass showRecordingGrid={showRecordingGrid} />
    </main>
  );
}
