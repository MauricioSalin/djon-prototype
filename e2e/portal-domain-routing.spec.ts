import { expect, test } from "@playwright/test"

const port = Number(process.env.E2E_PORT ?? 3199)
const publicSiteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ?? `http://127.0.0.1:${String(port)}`
const configuredPortalOrigin =
  process.env.NEXT_PUBLIC_PORTAL_URL ??
  `http://portal.localhost:${String(port)}`
const portalHostname = new URL(configuredPortalOrigin).hostname
const redirectedPortalOrigin = `https://${portalHostname}`

function metadataContent(html: string, attribute: "property" | "name", key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tag = html.match(
    new RegExp(`<meta[^>]+${attribute}=["']${escapedKey}["'][^>]*>`, "i"),
  )?.[0]

  return tag?.match(/content=["']([^"']+)["']/i)?.[1]
}

test("redirects portal routes from the public host to the portal host", async ({
  request,
}) => {
  const response = await request.get("/redefinir-senha?token=abc123", {
    headers: { host: "www.djonacademy.com" },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(response.headers().location).toBe(
    `${redirectedPortalOrigin}/redefinir-senha?token=abc123`,
  )
})

test("redirects the portal root to login on the same host", async ({ request }) => {
  const response = await request.get("/", {
    headers: { host: portalHostname },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  const location = new URL(response.headers().location, configuredPortalOrigin)
  expect(location.hostname).toBe(portalHostname)
  expect(location.pathname).toBe("/login")
})

test("redirects the session bridge from the public host to the portal host", async ({
  request,
}) => {
  const response = await request.get("/session-bridge", {
    headers: { host: "www.djonacademy.com" },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(response.headers().location).toBe(
    `${redirectedPortalOrigin}/session-bridge`,
  )
})

test("keeps public and authenticated routes on their intended hosts", async ({
  request,
}) => {
  const publicResponse = await request.get("/", {
    headers: { host: "www.djonacademy.com" },
    maxRedirects: 0,
  })
  const portalResponse = await request.get("/dashboard/student", {
    headers: { host: portalHostname },
    maxRedirects: 0,
  })

  expect(publicResponse.status()).toBe(200)
  expect(portalResponse.status()).toBe(200)
})

test("uses the principal social image on the portal and both public hostnames", async ({
  request,
}) => {
  const [wwwResponse, apexResponse, portalResponse] = await Promise.all([
    request.get("/", { headers: { host: "www.djonacademy.com" } }),
    request.get("/", { headers: { host: "djonacademy.com" } }),
    request.get("/login", { headers: { host: portalHostname } }),
  ])

  expect(wwwResponse.ok()).toBe(true)
  expect(apexResponse.ok()).toBe(true)
  expect(portalResponse.ok()).toBe(true)

  const [wwwHtml, apexHtml, portalHtml] = await Promise.all([
    wwwResponse.text(),
    apexResponse.text(),
    portalResponse.text(),
  ])
  const principalImage = metadataContent(wwwHtml, "property", "og:image")

  expect(principalImage).toBeTruthy()
  expect(metadataContent(apexHtml, "property", "og:image")).toBe(principalImage)
  expect(metadataContent(portalHtml, "property", "og:image")).toBe(
    `${publicSiteOrigin}/opengraph-image`,
  )
  expect(metadataContent(portalHtml, "name", "twitter:image")).toBe(
    `${publicSiteOrigin}/opengraph-image`,
  )
})

test("keeps the public site crawlable and blocks the portal host", async ({
  request,
}) => {
  const publicRobots = await request.get("/robots.txt", {
    headers: { host: "www.djonacademy.com" },
  })
  const portalRobots = await request.get("/robots.txt", {
    headers: { host: portalHostname },
  })

  expect(publicRobots.ok()).toBe(true)
  expect(await publicRobots.text()).toContain("Allow: /")
  expect(await publicRobots.text()).toContain(
    `Sitemap: ${publicSiteOrigin}/sitemap.xml`,
  )
  expect(portalRobots.ok()).toBe(true)
  expect(await portalRobots.text()).toBe("User-agent: *\nDisallow: /\n")
})
