"use client"

import { useSyncExternalStore } from "react"

export function isStandalonePwa() {
  return typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)")
  media.addEventListener("change", onChange)
  window.addEventListener("pageshow", onChange)
  return () => {
    media.removeEventListener("change", onChange)
    window.removeEventListener("pageshow", onChange)
  }
}

export function useStandalonePwa() {
  return useSyncExternalStore(subscribe, isStandalonePwa, () => false)
}
