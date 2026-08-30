import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Continuous Wind — Grass Study",
  description:
    "A real-time shader study of dense, fine grass moving in continuous wind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
