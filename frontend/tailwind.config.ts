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
          DEFAULT: "#f7f9fb",
          variant: "#e1e3e5",
          container: {
            lowest: "#ffffff",
            low: "#eceef0",
            DEFAULT: "#e3e5e8",
            high: "#d7d9dd",
            highest: "#ceced2",
          },
        },
        "on-surface": "#191c1e",
        "outline-variant": "#c5c6cf",
        
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
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        headline: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
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
