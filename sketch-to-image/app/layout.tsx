import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas to Image",
  description: "A Comfy-guided sketch canvas sample.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
