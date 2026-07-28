/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C8102E",
          dark: "#9b0c22",
          deep: "#7a091b",
          light: "#e8203e",
        },
        gold: "#D4A017",
        ciudad: {
          DEFAULT: "#8a7b6c",
          dark: "#6b5d4f",
          deep: "#4a4038",
          light: "#f5f1ea",
        },
      },
      fontFamily: {
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        display: ['"Bebas Neue"', "sans-serif"],
        condensed: ['"Manrope"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        brand: "0 4px 14px rgba(200,16,46,0.25)",
        "brand-lg": "0 8px 28px rgba(200,16,46,0.38)",
        ciudad: "0 4px 14px rgba(138,123,108,0.25)",
        "ciudad-lg": "0 8px 28px rgba(138,123,108,0.38)",
      },
    },
  },
  plugins: [],
};
