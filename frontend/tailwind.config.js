/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gunn High red.
        brand: {
          50: "#fff1f2",
          100: "#ffe0e3",
          200: "#fec6cc",
          300: "#fb9aa5",
          400: "#f45d6f",
          500: "#e62e45",
          600: "#c8102e",
          700: "#a80c26",
          800: "#8b0e24",
          900: "#730f22",
          950: "#40040f",
        },
        ink: "#111111",
        paper: "#faf8f4",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', "Inter", "ui-sans-serif", "sans-serif"],
        chalk: ["Caveat", "cursive"],
      },
      boxShadow: {
        sticker: "4px 4px 0 0 #111111",
        "sticker-sm": "2px 2px 0 0 #111111",
        "sticker-red": "4px 4px 0 0 #c8102e",
      },
    },
  },
  plugins: [],
};
