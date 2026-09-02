"use client"

import { useEffect } from "react"
import {
  PORTAL_SESSION_LOGOUT,
  PORTAL_SESSION_READY,
  PORTAL_SESSION_REQUEST,
  PORTAL_SESSION_RESPONSE,
} from "@/lib/portal-session-bridge"
import { publicSiteHref } from "@/lib/site-urls"
import { store } from "@/lib/store"

function allowedPublicOrigins() {
  const origin = new URL(publicSiteHref("/"), window.location.href)
  const origins = new Set([origin.origin])

  if (origin.hostname.startsWith("www.")) {
    origin.hostname = origin.hostname.slice(4)
    origins.add(origin.origin)
  }

  return origins
}

export default function SessionBridgePage() {
  useEffect(() => {
    const allowedOrigins = allowedPublicOrigins()
    const referrerOrigin = (() => {
      try {
        return new URL(document.referrer).origin
      } catch {
        return null
      }
    })()

    if (!referrerOrigin || !allowedOrigins.has(referrerOrigin)) return

    let active = true
    const sendSession = async () => {
      const user = await store.restoreSession(true).catch(() => null)
      if (active) {
        window.parent.postMessage(
          { type: PORTAL_SESSION_RESPONSE, user },
          referrerOrigin,
        )
      }
    }
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== referrerOrigin ||
        event.source !== window.parent ||
        !event.data ||
        typeof event.data !== "object"
      ) {
        return
      }

      const type = (event.data as { type?: unknown }).type
      if (type === PORTAL_SESSION_REQUEST) {
        void sendSession()
      } else if (type === PORTAL_SESSION_LOGOUT) {
        store.logout()
        void sendSession()
      }
    }
    const handleStorage = () => void sendSession()

    window.addEventListener("message", handleMessage)
    window.addEventListener("storage", handleStorage)
    window.parent.postMessage({ type: PORTAL_SESSION_READY }, referrerOrigin)

    return () => {
      active = false
      window.removeEventListener("message", handleMessage)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return null
}
