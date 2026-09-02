import { expect, test, type Page } from "@playwright/test"
import { createServer } from "node:http"
import { readFileSync } from "node:fs"

const port = Number(process.env.E2E_PORT ?? 3199)
const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? `http://127.0.0.1:${port}`
const portalOrigin = process.env.NEXT_PUBLIC_PORTAL_URL ?? `http://portal.localhost:${port}`
const user = {
  id: "507f1f77bcf86cd799439001", name: "Aluno PWA", email: "pwa@example.test",
  role: "student", permissions: [], active: true, createdAt: "2026-09-02T00:00:00.000Z",
}

async function mockApi(page: Page) {
  // Keep the unrelated 3D scene pending without causing a React error boundary.
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      return url.startsWith("https://prod.spline.design/")
        ? new Promise<Response>(() => {})
        : originalFetch(input, init)
    }
  })
  await page.context().route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "")
    if (path === "/auth/login") return route.fulfill({ json: { accessToken: "pwa-test-token", user } })
    if (path === "/users/me") return route.fulfill({ json: user })
    if (["/materials", "/events", "/bookings", "/users"].includes(path)) {
      return route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } })
    }
    return route.fulfill({ json: [] })
  })
}

async function standalone(page: Page, mode: "ios" | "android") {
  await page.addInitScript((mode) => {
    if (mode === "ios") {
      Object.defineProperty(navigator, "standalone", { configurable: true, value: true })
    } else {
      const matchMedia = window.matchMedia.bind(window)
      window.matchMedia = (query) => {
        const result = matchMedia(query)
        if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { value: true })
        return result
      }
    }
  }, mode)
}

for (const mode of ["ios", "android"] as const) {
  test(`public PWA keeps mobile login, password recovery and authenticated session on its origin (${mode})`, async ({ page }) => {
    await standalone(page, mode)
    await mockApi(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(publicOrigin)
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click()
    const login = page.getByRole("link", { name: "LOGIN", exact: true }).filter({ visible: true })
    await expect(login).toHaveAttribute("href", "/login")
    await login.click()
    await expect(page).toHaveURL(`${publicOrigin}/login`)
    await page.getByRole("link", { name: "ESQUECI MINHA SENHA" }).click()
    await expect(page).toHaveURL(`${publicOrigin}/recuperar-senha`)
    await page.goto(`${publicOrigin}/login`)
    await page.getByRole("button", { name: "VOLTAR" }).click()
    await expect(page).toHaveURL(`${publicOrigin}/`)
    await page.goto(`${publicOrigin}/login`)
    await page.getByPlaceholder("seu@email.com").fill(user.email)
    await page.getByPlaceholder("Sua senha").fill("test-password")
    await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
    await expect(page).toHaveURL(`${publicOrigin}/dashboard/student`)
    await expect(page.getByRole("button", { name: "Notificações", exact: true })).toBeVisible()
    await page.goto(publicOrigin)
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click()
    const portal = page.getByRole("link", { name: "ACESSAR PORTAL", exact: true })
    await expect(portal).toHaveAttribute("href", "/dashboard/student")
    await expect(page.locator('iframe[title="Sincronização da sessão do portal"]')).toHaveAttribute("src", "/session-bridge")
    await page.getByRole("button", { name: "SAIR", exact: true }).click()
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click()
    await expect(page.getByRole("link", { name: "LOGIN", exact: true }).filter({ visible: true })).toBeVisible()
    await page.goto(`${publicOrigin}/dashboard/student`)
    await expect(page).toHaveURL(new RegExp(`^${publicOrigin}/login(?:\\?|$)`))
  })
}

test("portal-installed PWA keeps login and dashboard on the portal origin", async ({ page }) => {
  await standalone(page, "ios")
  await mockApi(page)
  await page.goto(`${portalOrigin}/login`)
  await page.getByPlaceholder("seu@email.com").fill(user.email)
  await page.getByPlaceholder("Sua senha").fill("test-password")
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
  await expect(page).toHaveURL(`${portalOrigin}/dashboard/student`)
  await expect(page.getByRole("button", { name: "Notificações", exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(`${portalOrigin}/dashboard/student`)
})

test("ordinary browser still links to the configured portal", async ({ page }) => {
  await mockApi(page)
  await page.goto(publicOrigin)
  await expect(page.getByRole("link", { name: "LOGIN", exact: true })).toHaveAttribute("href", `${portalOrigin}/login`)
})

test.describe("installed service worker", () => {
  test.use({ serviceWorkers: "allow" })
  test("bypasses a previously cached permanent login redirect", async ({ page }) => {
    let oldRedirect = true
    let loginRequests = 0
    const worker = readFileSync("public/sw.js", "utf8")
    const server = createServer((request, response) => {
      if (request.url === "/sw.js") {
        response.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-store" })
        response.end(worker)
        return
      }
      if (request.url === "/login") {
        loginRequests += 1
        if (oldRedirect) {
          response.writeHead(308, { Location: "/outside-app", "Cache-Control": "max-age=86400" })
          response.end()
          return
        }
      }
      response.writeHead(200, { "Content-Type": "text/html" })
      response.end("<!doctype html><title>PWA origin test</title><p>Same-origin page</p>")
    })
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))
    const address = server.address() as { port: number }
    const origin = `http://127.0.0.1:${address.port}`
    try {
      await page.goto(`${origin}/login`)
      await expect(page).toHaveURL(`${origin}/outside-app`)
      oldRedirect = false
      await page.goto(`${origin}/`)
      await page.goto(`${origin}/login`)
      await expect(page).toHaveURL(`${origin}/outside-app`)
      expect(loginRequests).toBe(1)
      await page.goto(`${origin}/`)
      await page.evaluate(async () => {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        await navigator.serviceWorker.ready
      })
      await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
      await page.goto(`${origin}/login`)
      await expect(page).toHaveURL(`${origin}/login`)
      expect(loginRequests).toBe(2)
    } finally {
      await page.goto("about:blank")
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })
})
