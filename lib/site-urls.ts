const DEFAULT_PUBLIC_SITE_ORIGIN = "https://www.djonacademy.com"
const DEFAULT_PORTAL_ORIGIN = "https://portal.djonacademy.com"

function normalizeOrigin(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback
  return new URL(candidate).origin
}

export const publicSiteOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_SITE_URL,
  DEFAULT_PUBLIC_SITE_ORIGIN,
)

export const portalOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_PORTAL_URL,
  DEFAULT_PORTAL_ORIGIN,
)

function localRelativeHref(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

function environmentAwareHref(
  path: string,
  configuredOrigin: string | undefined,
  productionOrigin: string,
) {
  const normalizedPath = localRelativeHref(path)
  if (process.env.NODE_ENV !== "production" && !configuredOrigin?.trim()) {
    return normalizedPath
  }
  return new URL(normalizedPath, `${productionOrigin}/`).toString()
}

export function publicSiteHref(path = "/", preservePwaOrigin = false) {
  if (preservePwaOrigin && typeof window !== "undefined") {
    const publicUrl = new URL(publicSiteOrigin)
    const publicOrigins = new Set([publicUrl.origin])
    if (publicUrl.hostname.startsWith("www.")) {
      publicUrl.hostname = publicUrl.hostname.slice(4)
      publicOrigins.add(publicUrl.origin)
    }
    if (publicOrigins.has(window.location.origin)) return localRelativeHref(path)
  }
  return environmentAwareHref(
    path,
    process.env.NEXT_PUBLIC_SITE_URL,
    publicSiteOrigin,
  )
}

export function portalHref(path = "/login", preservePwaOrigin = false) {
  if (preservePwaOrigin) return localRelativeHref(path)
  return environmentAwareHref(
    path,
    process.env.NEXT_PUBLIC_PORTAL_URL,
    portalOrigin,
  )
}
