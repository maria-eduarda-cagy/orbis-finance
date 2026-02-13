import "./globals.css"
import { ReactNode } from "react"
import { Providers } from "../components/Providers"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Orbis Finance"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
