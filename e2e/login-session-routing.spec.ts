import { expect, test } from "@playwright/test"

test("redirects an authenticated user away from login to their portal home", async ({
  page,
}) => {
  let currentUserRequests = 0
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e")
  })

  await page.route("**/api/v1/users/me", async (route) => {
    currentUserRequests += 1
    expect(route.request().headers().authorization).toBe("Bearer token-e2e")
    await route.fulfill({
      json: {
        id: "507f1f77bcf86cd799439001",
        name: "Aluno E2E",
        email: "aluno-e2e@teste.com",
        role: "student",
        permissions: [],
        active: true,
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    })
  })

  await page.goto("/login")

  await expect(page).toHaveURL(/\/dashboard\/student$/, { timeout: 15_000 })
  expect(currentUserRequests).toBe(1)
})
