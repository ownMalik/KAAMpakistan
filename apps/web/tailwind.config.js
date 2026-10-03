/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F766E", // Deep Pakistani Teal
          dark: "#115E59",
          light: "#14B8A6"
        },
        accent: {
          DEFAULT: "#F59E0B", // Warm Amber
        }
      }
    },
  },
  plugins: [],
}