"use client"
import clsx from "clsx"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-background-elevated p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          theme === "light"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun size={14} />
        Claro
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          theme === "dark"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon size={14} />
        Escuro
      </button>
    </div>
  )
}
