import type { User } from "@/lib/store"

export const PORTAL_SESSION_READY = "djon:portal-session-ready"
export const PORTAL_SESSION_REQUEST = "djon:portal-session-request"
export const PORTAL_SESSION_RESPONSE = "djon:portal-session-response"
export const PORTAL_SESSION_LOGOUT = "djon:portal-session-logout"

export type PortalSessionResponse = {
  type: typeof PORTAL_SESSION_RESPONSE
  user: User | null
}

export function isPortalSessionResponse(
  value: unknown,
): value is PortalSessionResponse {
  if (!value || typeof value !== "object") return false
  const message = value as Partial<PortalSessionResponse>
  if (message.type !== PORTAL_SESSION_RESPONSE) return false
  if (message.user === null) return true
  return Boolean(
    message.user &&
      typeof message.user.id === "string" &&
      typeof message.user.name === "string" &&
      ["student", "professor", "admin"].includes(message.user.role ?? ""),
  )
}
