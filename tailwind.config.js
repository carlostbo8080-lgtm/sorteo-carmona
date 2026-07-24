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
          DEFAULT: "#198754",
          dark: "#146c43",
          deep: "#0f5132",
          light: "#eaf6f0",
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
        ciudad: "0 4px 14px rgba(25,135,84,0.25)",
        "ciudad-lg": "0 8px 28px rgba(25,135,84,0.38)",
      },
    },
  },
  plugins: [],
};
