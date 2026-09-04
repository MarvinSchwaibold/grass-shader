import type { Metadata } from "next";
import { GrassDemoRoute } from "../GrassDemoRoute";

const title = "Demo Two — Grass Study";
const description = "The original grass recording and reference maps alongside the live wind shader.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [] },
  twitter: { title, description, images: [] },
};

export default function DemoTwoPage() {
  return <GrassDemoRoute showRecordingGrid={false} />;
}
