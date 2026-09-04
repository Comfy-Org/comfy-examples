import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Record — historical correspondence",
  description: "Chat with historical figures through ComfyUI video generation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
