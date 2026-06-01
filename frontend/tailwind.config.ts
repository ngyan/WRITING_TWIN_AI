import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#F0F1FF",
          100: "#E0E2FF",
          200: "#C5C8FF",
          300: "#9BA0FF",
          400: "#6B71F5",
          500: "#4F46E5",
          600: "#3F37C9",
          700: "#312AA8",
          800: "#252087",
          900: "#1A1666",
        },
        accent: {
          50:  "#FFF8F1",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        ink: "#0F172A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        glow: "0 0 0 4px rgba(79, 70, 229, 0.15), 0 8px 24px rgba(79, 70, 229, 0.25)",
        card: "0 4px 12px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
