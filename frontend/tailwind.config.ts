import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#031636",
          container: "#1a2b4c",
          fixed: "#d8e2ff",
        },
        secondary: {
          DEFAULT: "#13696a",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          variant: "rgb(var(--surface-variant) / <alpha-value>)",
          container: {
            lowest: "rgb(var(--surface-container-lowest) / <alpha-value>)",
            low: "rgb(var(--surface-container-low) / <alpha-value>)",
            DEFAULT: "rgb(var(--surface-container) / <alpha-value>)",
            high: "rgb(var(--surface-container-high) / <alpha-value>)",
            highest: "rgb(var(--surface-container-highest) / <alpha-value>)",
          },
        },
        "on-surface": "rgb(var(--on-surface) / <alpha-value>)",
        "outline-variant": "rgb(var(--outline-variant) / <alpha-value>)",
        
        brand: {
          50: "#f3f0ff",
          100: "#e6deff",
          200: "#d8ceff",
          300: "#cabeff",
          400: "#9e8af2",
          500: "#6f58df",
          600: "#451ebb",
          700: "#3c19a0",
          800: "#311480",
          900: "#240d5f",
          950: "#1c0062",
        },
        accent: {
          50: "#eaf7ff",
          100: "#c2e8ff",
          200: "#9eddff",
          300: "#75d1ff",
          400: "#41bbea",
          500: "#1a98c6",
          600: "#006384",
          700: "#004a64",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        headline: ["var(--font-manrope)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 20px 50px rgba(3, 22, 54, 0.06)",
        card: "0 10px 30px -24px rgb(25 28 32 / 0.22)",
        "card-hover": "0 20px 40px -26px rgb(25 28 32 / 0.28)",
        modal: "0 30px 70px -30px rgb(25 28 32 / 0.35)",
        hero: "0 40px 70px -34px rgb(25 28 32 / 0.22)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #031636 0%, #1a2b4c 100%)',
      }
    },
  },
  plugins: [],
};

export default config;
