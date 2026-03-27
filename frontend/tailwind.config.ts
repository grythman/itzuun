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
        surface: {
          0: "#ffffff",
          50: "#f8f9ff",
          100: "#f2f3f9",
          200: "#eceef3",
          300: "#e1e2e8",
          400: "#c9c4d7",
          500: "#797586",
          600: "#5d617d",
          700: "#484554",
          800: "#2e3135",
          900: "#191c20",
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
        card: "0 10px 30px -24px rgb(25 28 32 / 0.22)",
        "card-hover": "0 20px 40px -26px rgb(25 28 32 / 0.28)",
        modal: "0 30px 70px -30px rgb(25 28 32 / 0.35)",
        hero: "0 40px 70px -34px rgb(25 28 32 / 0.22)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
