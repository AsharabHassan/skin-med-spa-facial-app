import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C49840",
          light: "#D4B060",
          dark: "#9A7628",
        },
        cream: "#EDE6D6",
        obsidian: "#060509",
        parchment: "#110E09",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-space-mono)", "monospace"],
        mono:  ["var(--font-space-mono)", "monospace"],
      },
      animation: {
        "scan":       "scan 2.8s ease-in-out infinite",
        "scan-fast":  "scan 1.4s linear infinite",
        "pulse-gold": "pulseGold 2.5s ease-in-out infinite",
        "shimmer":    "shimmer 2s ease-in-out infinite",
        "blink":      "blink 1s step-end infinite",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { transform: "translateY(900%)", opacity: "0" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(196,152,64,0)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(196,152,64,0.1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
