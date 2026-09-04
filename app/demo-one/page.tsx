import type { Metadata } from "next";
import { GrassDemoRoute } from "../GrassDemoRoute";

const title = "Demo One — Grass Study";
const description = "The complete grass study with six source recordings, reference maps, and the live wind shader.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [] },
  twitter: { title, description, images: [] },
};

export default function DemoOnePage() {
  return <GrassDemoRoute showRecordingGrid />;
}
