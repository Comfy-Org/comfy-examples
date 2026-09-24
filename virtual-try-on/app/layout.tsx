import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thread & Form — Virtual Try-On",
  description: "See the pieces you love, on you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
