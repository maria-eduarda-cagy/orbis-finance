import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx"]
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  }
})
