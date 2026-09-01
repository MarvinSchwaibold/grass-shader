const recordings = ["7394", "7398", "7400", "7401", "7403", "7406"];

export default function Home() {
  return (
    <main className="video-grid-page">
      <section className="video-grid" aria-label="Grass study recordings">
        {recordings.map((recording) => (
          <figure className="video-grid__item" key={recording}>
            <video
              className="video-grid__video"
              src={`/study-${recording}.mp4`}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label={`Grass study recording IMG_${recording}`}
            />
            <figcaption className="visually-hidden">
              Grass study recording IMG_{recording}
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
