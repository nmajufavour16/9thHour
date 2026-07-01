import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // dark is the default; the inline script below applies a saved preference
    // before paint so there's no flash. suppressHydrationWarning: the script
    // may change data-theme before React hydrates.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('9h-theme');if(p!=='light'&&p!=='dark'&&p!=='system')p='dark';var t=p==='system'?((window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark'):p;document.documentElement.setAttribute('data-theme',t);var l=document.createElement('link');l.rel='preload';l.as='image';l.href=t==='light'?'/logo-light.png':'/logo-dark.png';document.head.appendChild(l);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-bg-primary text-text-primary min-h-screen`}
      >
        <ThemeProvider>
          <div className="min-h-screen pb-20 sm:pb-8">{children}</div>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
        </ThemeProvider>
      </body>
    </html>
  );
}
