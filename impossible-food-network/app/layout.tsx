import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Impossible Food Network",
  description: "Turn your meal into a surreal food commercial, with a glossy six-second video.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
