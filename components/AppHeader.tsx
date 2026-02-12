export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada e acionável das suas finanças.</p>
      </div>
    </header>
  )
}
