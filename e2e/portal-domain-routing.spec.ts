import { expect, test } from "@playwright/test"

test("redirects portal routes from the public host to the portal host", async ({
  request,
}) => {
  const response = await request.get("/redefinir-senha?token=abc123", {
    headers: { host: "www.djonacademy.com" },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(response.headers().location).toBe(
    "https://portal.djonacademy.com/redefinir-senha?token=abc123",
  )
})

test("redirects the portal root to login on the same host", async ({ request }) => {
  const response = await request.get("/", {
    headers: { host: "portal.djonacademy.com" },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(
    new URL(
      response.headers().location,
      "https://portal.djonacademy.com",
    ).toString(),
  ).toBe(
    "https://portal.djonacademy.com/login",
  )
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
    "https://portal.djonacademy.com/session-bridge",
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
    headers: { host: "portal.djonacademy.com" },
    maxRedirects: 0,
  })

  expect(publicResponse.status()).toBe(200)
  expect(portalResponse.status()).toBe(200)
})

test("keeps the public site crawlable and blocks the portal host", async ({
  request,
}) => {
  const publicRobots = await request.get("/robots.txt", {
    headers: { host: "www.djonacademy.com" },
  })
  const portalRobots = await request.get("/robots.txt", {
    headers: { host: "portal.djonacademy.com" },
  })

  expect(publicRobots.ok()).toBe(true)
  expect(await publicRobots.text()).toContain("Allow: /")
  expect(await publicRobots.text()).toContain(
    "Sitemap: https://www.djonacademy.com/sitemap.xml",
  )
  expect(portalRobots.ok()).toBe(true)
  expect(await portalRobots.text()).toBe("User-agent: *\nDisallow: /\n")
})
