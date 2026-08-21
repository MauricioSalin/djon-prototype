"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"

type ConfirmationOptions = {
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: "solid" | "outline"
  eyebrow?: string
}

type ConfirmationContextValue = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null)

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const resolver = useRef<((confirmed: boolean) => void) | null>(null)

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed)
    resolver.current = null
    setOptions(null)
  }, [])

  const confirm = useCallback((nextOptions: ConfirmationOptions) => {
    resolver.current?.(false)
    setOptions(nextOptions)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  useEffect(() => {
    if (!options) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [close, options])

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {options && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => event.target === event.currentTarget && close(false)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              aria-describedby="confirmation-description"
              className="my-4 w-full max-w-md rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 shadow-2xl sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-djon-warning-red/10 text-djon-warning-red">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-djon-warning-red">
                      {options.eyebrow ?? "CONFIRMAR AÇÃO"}
                    </p>
                    <h2 id="confirmation-title" className="text-xl font-black tracking-tighter text-djon-text">
                      {options.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar confirmação"
                  onClick={() => close(false)}
                  className="cursor-pointer text-djon-text/40 transition-colors hover:brightness-110"
                >
                  <X size={18} />
                </button>
              </div>

              <p id="confirmation-description" className="mb-6 text-sm leading-relaxed text-djon-text/50">
                {options.description}
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="cursor-pointer flex-1 rounded-full border border-djon-text/15 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-colors hover:brightness-110"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                  className={`cursor-pointer flex-1 rounded-full border py-3 text-xs font-black tracking-widest transition-colors ${
                    options.confirmVariant === "outline"
                      ? "border-djon-warning-red/20 text-djon-warning-red/70 hover:brightness-110"
                      : "border-transparent bg-djon-warning-red/80 text-djon-text hover:brightness-110"
                  }`}
                >
                  {options.confirmLabel ?? "CONFIRMAR"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationContext.Provider>
  )
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext)
  if (!context) throw new Error("useConfirmation deve ser usado dentro de ConfirmationProvider.")
  return context
}
