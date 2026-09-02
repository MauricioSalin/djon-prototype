"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || navigator.webdriver) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        // Some automated browsers expose the API but intentionally return no
        // registration when service workers are blocked.
        if (registration) await registration.update()
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
