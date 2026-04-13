/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#020b18",
          900: "#041020",
          800: "#071a30",
          700: "#0a2540",
          600: "#0d3055",
          500: "#1a4a72",
          400: "#2d6fa0",
          300: "#4a90c4",
          200: "#7ab5d8",
          100: "#b8d9ed",
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
