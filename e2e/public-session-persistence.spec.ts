import { expect, test } from "@playwright/test"

const sessionUser = {
  id: "507f1f77bcf86cd799439001",
  name: "Aluno Persistente",
  email: "aluno-persistente@teste.com",
  role: "student",
  permissions: [],
  active: true,
  createdAt: "2026-09-02T00:00:00.000Z",
}

test("shows the portal user on the public home and synchronizes logout", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const isPortalBridge =
      window.location.hostname === "portal.localhost" ||
      window.location.pathname === "/session-bridge"
    if (isPortalBridge) {
      window.localStorage.setItem("djon_access_token", "token-public-home-e2e")
    }
  })
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/api\/v1/,
      "",
    )
    if (path === "/users/me") {
      await route.fulfill({ json: sessionUser })
      return
    }
    if (path === "/units") {
      await route.fulfill({ json: [] })
      return
    }
    if (path === "/landing-content") {
      await route.fulfill({ json: [] })
      return
    }
    await route.fulfill({ json: [] })
  })

  await page.goto("/")

  expect(await page.evaluate(() => localStorage.getItem("djon_access_token"))).toBeNull()
  await expect(
    page.locator('iframe[title="Sincronização da sessão do portal"]'),
  ).toHaveCount(0)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Abrir menu da conta" })).toBeVisible()
  await expect(page.getByRole("link", { name: "LOGIN" })).toHaveCount(0)

  await page.reload()
  await expect(
    page.locator('iframe[title="Sincronização da sessão do portal"]'),
  ).toHaveCount(0)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Abrir menu da conta" })).toBeVisible()
  await page.getByRole("button", { name: "Abrir menu da conta" }).click()
  await expect(page.getByRole("link", { name: "Acessar portal" })).toHaveAttribute(
    "href",
    /\/dashboard\/student$/,
  )

  await page.getByRole("button", { name: "Sair" }).click()

  await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible()
  const bridge = page.frames().find((frame) => frame.url().includes("/session-bridge"))
  expect(bridge).toBeDefined()
  await expect
    .poll(() =>
      bridge!.evaluate(() => localStorage.getItem("djon_access_token")),
    )
    .toBeNull()
})
