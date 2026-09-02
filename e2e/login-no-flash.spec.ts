import { expect, test } from "@playwright/test"

const student = {
  id: "507f1f77bcf86cd799439001",
  name: "Aluno E2E",
  email: "aluno-e2e@teste.com",
  role: "student",
  permissions: [],
  active: true,
  createdAt: "2026-09-02T00:00:00.000Z",
}

test("does not render the login form while redirecting an active session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-no-flash-e2e")
  })

  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "")
    if (pathname === "/users/me") {
      await new Promise((resolve) => setTimeout(resolve, 1_000))
      await route.fulfill({ json: student })
      return
    }
    await route.fulfill({ json: [] })
  })

  await page.goto("/login")

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole("heading", { name: "Acessar Portal" }),
  ).toHaveCount(0)
  await expect(page).toHaveURL(/\/dashboard\/student$/, { timeout: 15_000 })
})

test("returns to the requested portal route after login", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api\/v1/, "")

    if (pathname === "/auth/login" && request.method() === "POST") {
      await route.fulfill({
        json: { accessToken: "token-callback-e2e", user: student },
      })
      return
    }
    if (pathname === "/users/me") {
      await route.fulfill({ json: student })
      return
    }
    await route.fulfill({ json: [] })
  })

  const requestedPath = "/dashboard/student/agendar?date=2026-09-10"
  await page.goto(requestedPath)

  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(new URL(page.url()).searchParams.get("redirect")).toBe(requestedPath)

  await page.getByPlaceholder("seu@email.com").fill("aluno-e2e@teste.com")
  await page.getByPlaceholder("Sua senha").fill("senha-e2e-segura")
  await page.getByRole("button", { name: "ENTRAR" }).click()

  await expect(page).toHaveURL(
    new RegExp("/dashboard/student/agendar\\?date=2026-09-10$"),
  )
})

test("ignores an external redirect after login", async ({ page }) => {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      json: { accessToken: "token-safe-redirect-e2e", user: student },
    })
  })

  await page.goto("/login?redirect=https%3A%2F%2Fexample.com%2Fcaptura")
  await page.getByPlaceholder("seu@email.com").fill("aluno-e2e@teste.com")
  await page.getByPlaceholder("Sua senha").fill("senha-e2e-segura")
  await page.getByRole("button", { name: "ENTRAR" }).click()

  await expect(page).toHaveURL(/\/dashboard\/student$/)
})
