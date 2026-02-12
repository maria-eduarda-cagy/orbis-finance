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
        "info-foreground": "var(--info-foreground)"
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.35)",
        subtle: "0 1px 0 rgba(255,255,255,0.02)"
      },
      backgroundImage: {
        "fintech-gradient": "radial-gradient(1200px 600px at 50% -100px, rgba(76,111,255,0.18), transparent)"
      }
    }
  },
  plugins: []
}
