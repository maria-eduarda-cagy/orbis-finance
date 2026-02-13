"use client"

export function Footer() {
  return (
    <footer className="w-full text-muted-foreground text-sm">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Orbis Finance</span>
        <div className="flex flex-wrap items-center gap-4">
          <a href="https://www.linkedin.com/in/maria-eduarda-cagy/" className="hover:text-foreground transition-colors">LinkedIn</a>
          <a href="https://github.com/maria-eduarda-cagy" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="mailto:mariaeduardacs@gmail.com" className="hover:text-foreground transition-colors">Email</a>
        </div>
      </div>
    </footer>
  )
}
