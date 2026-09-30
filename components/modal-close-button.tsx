"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function ModalCloseButton({
  onClick,
  className,
  label = "Fechar modal",
  size = 18,
  disabled = false,
}: {
  onClick: () => void
  className?: string
  label?: string
  size?: number
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100 disabled:cursor-not-allowed",
        className,
      )}
    >
      <X size={size} aria-hidden="true" />
    </button>
  )
}
