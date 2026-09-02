import { type NextRequest, NextResponse } from "next/server"
import { portalOrigin } from "@/lib/site-urls"

const PORTAL_HOSTNAME = new URL(portalOrigin).hostname
const PUBLIC_HOSTNAMES = new Set(["djonacademy.com", "www.djonacademy.com"])

function requestHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]
  const host = forwardedHost ?? request.headers.get("host")
  return (host ?? request.nextUrl.hostname).trim().split(":")[0].toLowerCase()
}

function isPortalPath(pathname: string) {
  return [
    "/login",
    "/recuperar-senha",
    "/redefinir-senha",
    "/dashboard",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function proxy(request: NextRequest) {
  const hostname = requestHostname(request)
  const { pathname } = request.nextUrl

  if (hostname === PORTAL_HOSTNAME && pathname === "/") {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl, 308)
  }

  if (PUBLIC_HOSTNAMES.has(hostname) && isPortalPath(pathname)) {
    const portalUrl = request.nextUrl.clone()
    portalUrl.protocol = "https:"
    portalUrl.hostname = PORTAL_HOSTNAME
    portalUrl.port = ""
    return NextResponse.redirect(portalUrl, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/recuperar-senha/:path*",
    "/redefinir-senha/:path*",
    "/dashboard/:path*",
  ],
}
