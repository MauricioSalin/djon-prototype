"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        const response = await fetch("/sw.js", { cache: "no-store" })

        if (!response.ok) {
          console.warn("DJ ON PWA service worker is not available yet")
          return
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        registration.update()
      } catch (error) {
        console.warn("DJ ON PWA registration failed", error)
      }
    }

    if (document.readyState === "complete") {
      register()
      return
    }

    window.addEventListener("load", register, { once: true })

    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
