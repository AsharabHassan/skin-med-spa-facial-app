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
        pink: {
          DEFAULT: "#F48FB1",
          dark: "#DB7698",
        },
        coral: "#F9A392",
        teal: {
          DEFAULT: "#8ED4CC",
          dark: "#6BC4BA",
        },
        dark: "#323232",
        gray: {
          DEFAULT: "#9E9E9E",
        },
        blush: "#FFF0F5",
      },
      fontFamily: {
        heading: ["var(--font-raleway)", "sans-serif"],
        body: ["var(--font-body-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      animation: {
        scan: "scan 2.8s ease-in-out infinite",
        "pulse-pink": "pulsePink 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { transform: "translateY(900%)", opacity: "0" },
        },
        pulsePink: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(244,143,177,0)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(244,143,177,0.15)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
