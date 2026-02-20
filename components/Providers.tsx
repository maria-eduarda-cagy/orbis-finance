"use client"
import { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./theme/ThemeProvider"
import { NumberVisibilityProvider } from "./visibility/NumberVisibilityProvider"

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NumberVisibilityProvider>{children}</NumberVisibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
