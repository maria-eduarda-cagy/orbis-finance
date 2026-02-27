"use client"
import { ReactNode, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/query-persist-client-core"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { ThemeProvider } from "./theme/ThemeProvider"
import { NumberVisibilityProvider } from "./visibility/NumberVisibilityProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  }
})

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "orbis-query-cache",
      throttleTime: 1000
    })
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24
    })
  }, [])
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NumberVisibilityProvider>{children}</NumberVisibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
