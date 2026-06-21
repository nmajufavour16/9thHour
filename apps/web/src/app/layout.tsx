import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Playfair for headings, DM Sans for body, JetBrains Mono for numbers/streaks
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
    // dark is the default — a Settings toggle flips this to "light" later
    <html lang="en" data-theme="dark">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-bg-primary text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
