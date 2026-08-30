import { OrnamentalGrass } from "./OrnamentalGrass";

export default function Home() {
  return (
    <main className="page-shell">
      <figure className="grass-stage">
        <OrnamentalGrass />
        <figcaption className="visually-hidden">
          Dense mounds of long ornamental grass moving continuously in bright
          coastal wind.
        </figcaption>
      </figure>
    </main>
  );
}
