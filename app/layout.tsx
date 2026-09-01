import type { Metadata } from "next";
import { headers } from "next/headers";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "continuous-grass-wind.marvin471512.chatgpt.site";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const title = "Continuous Wind — Grass Study";
  const description = "A custom WebGL2 study of mounded ornamental grass moving in continuous wind.";

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <DialRoot
          position="top-right"
          defaultOpen
          theme="light"
          productionEnabled
        />
      </body>
    </html>
  );
}
