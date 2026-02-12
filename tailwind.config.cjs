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
        background: "var(--background)",
        "background-elevated": "var(--background-elevated)",
        "background-subtle": "var(--background-subtle)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        success: "var(--success)",
        "success-foreground": "var(--success-foreground)",
        warning: "var(--warning)",
        "warning-foreground": "var(--warning-foreground)",
        danger: "var(--danger)",
        "danger-foreground": "var(--danger-foreground)",
        info: "var(--info)",
        "info-foreground": "var(--info-foreground)",
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
        "chart-6": "var(--chart-6)",
        "chart-7": "var(--chart-7)"
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.02) inset",
        subtle: "0 1px 0 rgba(255,255,255,0.04)"
      },
      backgroundImage: {
        "fintech-gradient": "radial-gradient(1200px 600px at 15% -100px, rgba(79,124,255,0.2), transparent 60%)"
      }
    }
  },
  plugins: []
}
