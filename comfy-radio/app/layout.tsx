import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comfy Radio — Chestnut Cove",
  description: "Five little stations, freshly composed by Comfy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
