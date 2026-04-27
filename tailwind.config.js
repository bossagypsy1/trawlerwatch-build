/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#111316",
          900: "#1a1d22",
          800: "#22262d",
          700: "#2c3038",
          600: "#4a4010",
          500: "#8a7020",
          400: "#c8a800",
          300: "#e8c800",
          200: "#f5d800",
          100: "#fff0a0",
        },
        signal: {
          green: "#00ff88",
          amber: "#ffb800",
          red:   "#ff3b3b",
          blue:  "#00c8ff",
        },
      },
      fontFamily: {
        mono:    ["'IBM Plex Mono'", "monospace"],
        sans:    ["'DM Sans'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
