import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Room Remix — Your room, your rules",
  description: "Play with color, furniture, and style to dream up your next favorite room.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
