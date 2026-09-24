import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Museum of Bad Ideas — every doodle deserves a frame",
  description: "Upload your most questionable doodle. Our very serious museum will make it important.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
