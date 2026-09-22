import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "People & Culture — Mandatory Morale",
  description: "A mandatory morale initiative from People Ops.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
