const PORTAL_ROUTING_ORIGIN = "https://portal.djonacademy.com"

export function sanitizePortalRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null

  try {
    const destination = new URL(value, PORTAL_ROUTING_ORIGIN)
    const isDashboardPath =
      destination.pathname === "/dashboard" ||
      destination.pathname.startsWith("/dashboard/")

    if (destination.origin !== PORTAL_ROUTING_ORIGIN || !isDashboardPath) {
      return null
    }

    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return null
  }
}

export function buildLoginHref(
  pathname: string,
  search = "",
  hash = "",
) {
  const destination = sanitizePortalRedirect(`${pathname}${search}${hash}`)
  return destination
    ? `/login?redirect=${encodeURIComponent(destination)}`
    : "/login"
}
