import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";

/**
 * Syne — display / UI font (headings, labels, buttons, NEXUS logo)
 * Loaded via next/font for self-hosting, preloading, and no layout shift.
 * CSS variable: --font-syne   →  referenced by --nx-font-display in globals.css
 */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

/**
 * DM Mono — monospace / terminal font (agent thought streams, timestamps, code)
 * CSS variable: --font-dm-mono  →  referenced by --nx-font-mono in globals.css
 */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS — Multi-Agent Intelligence Platform",
  description: "Real-time multi-agent AI debate and analysis platform powered by Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${syne.variable} ${dmMono.variable}`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
