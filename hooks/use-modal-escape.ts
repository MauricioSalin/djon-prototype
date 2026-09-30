"use client"

import { useEffect, useRef, type MutableRefObject } from "react"

type EscapeLayer = {
  id: symbol
  dismiss: MutableRefObject<() => void>
}

const escapeLayers: EscapeLayer[] = []

function handleEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return
  if (document.querySelector('[data-slot="select-content"][data-state="open"]')) return
  const layer = escapeLayers.at(-1)
  if (!layer) return
  event.preventDefault()
  event.stopImmediatePropagation()
  layer.dismiss.current()
}

export function useModalEscape(active: boolean, onDismiss: () => void) {
  const id = useRef(Symbol("modal-escape-layer"))
  const dismiss = useRef(onDismiss)

  useEffect(() => {
    dismiss.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!active) return
    const layer = { id: id.current, dismiss }
    escapeLayers.push(layer)
    if (escapeLayers.length === 1) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      const index = escapeLayers.findIndex((item) => item.id === layer.id)
      if (index >= 0) escapeLayers.splice(index, 1)
      if (!escapeLayers.length) {
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [active])
}
