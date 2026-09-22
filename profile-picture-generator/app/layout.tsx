import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forma — Profile picture studio",
  description: "Make a profile picture that feels like you, in a style that feels right.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
