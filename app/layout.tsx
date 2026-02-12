import "./globals.css"
import { ReactNode } from "react"
import { Providers } from "../components/Providers"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 bg-fintech-gradient">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
