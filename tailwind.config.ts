import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ],
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel: "0 20px 70px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
