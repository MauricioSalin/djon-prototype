import { type NextRequest, NextResponse } from "next/server"
import { portalOrigin } from "@/lib/site-urls"

const PORTAL_HOSTNAME = new URL(portalOrigin).hostname

function requestHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]
  const host = forwardedHost ?? request.headers.get("host")
  return (host ?? request.nextUrl.hostname).trim().split(":")[0].toLowerCase()
}

export function proxy(request: NextRequest) {
  const hostname = requestHostname(request)
  const { pathname } = request.nextUrl

  if (hostname === PORTAL_HOSTNAME && pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  if (hostname === PORTAL_HOSTNAME && pathname === "/") {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl, 308)
  }

  // The same portal routes must work on the origin where the PWA was installed.
  // A public-to-portal redirect takes iOS outside the installed app's scope.
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/recuperar-senha/:path*",
    "/redefinir-senha/:path*",
    "/session-bridge",
    "/dashboard/:path*",
    "/robots.txt",
  ],
}
