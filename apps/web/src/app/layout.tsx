import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// 9TH HOUR — Brand typography per UIUX_FLOW.md
// Headings: Playfair Display (sacred weight) | Body/UI: DM Sans | Currency/Streaks: JetBrains Mono
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "9th Hour — The Hour of Prayer is Now",
  description:
    "9th Hour is your digital temple — a place to pray, share, give, and belong, any hour of the day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme="dark" is the default brand experience per UIUX_FLOW.md.
    // A theme toggle in Settings (Phase 9) flips this to "light" and persists the choice.
    <html lang="en" data-theme="dark">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-bg-primary text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
