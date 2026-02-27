"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"

type ConfirmButtonProps = {
  onConfirm: () => void | Promise<void>
  label?: string
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  className?: string
}

export function ConfirmButton({
  onConfirm,
  label = "Remover",
  title = "Confirmar remoção",
  description = "Esta ação não pode ser desfeita.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  className
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button className={className || "bg-secondary text-secondary-foreground  hover:brightness-110"} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => setOpen(false)} disabled={loading}>
              {cancelText}
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Removendo..." : confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
