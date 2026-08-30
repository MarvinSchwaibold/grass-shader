import { GrassField } from "./GrassField";

export default function Home() {
  return (
    <main className="page-shell">
      <figure className="grass-stage">
        <GrassField />
        <figcaption className="visually-hidden">
          A close, sunlit field of fine green grass moving continuously in the
          wind.
        </figcaption>
      </figure>
    </main>
  );
}
