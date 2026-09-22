import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anime Opening Machine — a story in eight frames",
  description: "Turn your character art and a theme into an anime opening storyboard, then animate your favorite shots.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
