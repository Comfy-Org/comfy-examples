import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bureau of Visual Corrections",
  description: "Remove unwanted objects from an image and preserve the record.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
