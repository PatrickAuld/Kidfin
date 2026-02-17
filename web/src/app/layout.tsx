import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kidfin",
  description: "Kids financial tracker for families.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-950">{children}</body>
    </html>
  );
}
