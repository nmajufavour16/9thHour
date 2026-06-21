import type { Config } from "tailwindcss";

// Colors map to CSS vars in globals.css — flipping data-theme on <html> swaps everything instantly.

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--color-bg-primary)",
          surface: "var(--color-bg-surface)",
          elevated: "var(--color-bg-elevated)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
        },
        gold: {
          DEFAULT: "var(--color-gold)",
          light: "var(--color-gold-light)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        live: "var(--color-live)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        border: "var(--color-border)",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
