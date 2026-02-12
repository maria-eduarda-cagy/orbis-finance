/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6E72FC",
          dark: "#4F52CC",
          glow: "#8A8DFF"
        }
      },
      backgroundImage: {
        "fintech-gradient": "radial-gradient(1200px 600px at 50% -100px, rgba(110,114,252,0.25), transparent)"
      }
    }
  },
  plugins: []
}
