import { expect, test, type Page } from "@playwright/test"

// /auth/login deliberately returns only identity; /users/me returns the profile.
const identity = {
  id: "507f1f77bcf86cd799439001", name: "Artista de Teste",
  email: "profile@example.test", role: "student", permissions: [],
  avatar: "/images/latest-release-default.jpg", passwordChangeRequired: false,
}
const profile = {
  ...identity, projectName: "Projeto Completo", active: true,
  banner: "/images/djon-hero.png", bio: "Biografia que ja existe no servidor.",
  whatsapp: "51999990000", createdAt: "2026-09-02T00:00:00.000Z",
  socials: { instagram: "artista.teste", soundcloud: "artista-teste", youtube: "artista-teste", pressKit: "https://example.com/press-kit" },
  latestRelease: { title: "Set completo", link: "https://example.com/set", cover: "/images/latest-release-default.jpg" },
}

async function expectProfile(page: Page) {
  await expect(page.getByRole("heading", { name: profile.projectName, exact: true })).toBeVisible()
  await expect(page.getByText(profile.bio, { exact: true })).toBeVisible()
  await expect(page.locator('a[href="https://instagram.com/artista.teste"]')).toHaveCount(1)
  await expect(page.locator('a[href="https://example.com/press-kit"]')).toHaveCount(1)
  await expect(page.getByRole("heading", { name: "Set completo", exact: true })).toHaveCount(1)
}

for (const mode of ["ios", "android", "browser"] as const) {
  test.describe(mode, () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

    test("loads the full profile after login and keeps it after reopening", async ({ page }) => {
      if (mode !== "browser") {
        await page.addInitScript((mode) => {
          if (mode === "ios") {
            Object.defineProperty(navigator, "standalone", { value: true })
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
      let meRequests = 0
      let releaseProfile!: () => void
      const profileGate = new Promise<void>((resolve) => { releaseProfile = resolve })
      const writes: string[] = []
      await page.context().route("**/api/v1/**", async (route) => {
        const request = route.request()
        const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "")
        if (path === "/auth/login") return route.fulfill({ json: { accessToken: "profile-test-token", user: identity } })
        if (request.method() !== "GET") writes.push(path)
        if (path === "/users/me") {
          meRequests += 1
          await profileGate
          return route.fulfill({ json: profile })
        }
        if (["/users", "/events", "/bookings", "/materials"].includes(path)) {
          return route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } })
        }
        if (path.startsWith("/portal-content/")) return route.fulfill({ json: null })
        return route.fulfill({ json: [] })
      })
      try {
        await page.goto("/login?redirect=%2Fdashboard%2Fstudent%2Fperfil")
        await page.getByPlaceholder("seu@email.com").fill(identity.email)
        await page.getByPlaceholder("Sua senha").fill("test-password")
        await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
        await expect.poll(() => meRequests).toBe(1)
        // A slow full-profile response must not expose an editable empty profile.
        await expect(page.getByRole("button", { name: "EDITAR PERFIL", exact: true })).toHaveCount(0)
        releaseProfile()
        await expectProfile(page)
        await page.getByRole("button", { name: "EDITAR PERFIL", exact: true }).click()
        await expect(page.locator("#profile-editor input").nth(1)).toHaveValue(profile.projectName)
        await expect(page.locator("#profile-editor textarea")).toHaveValue(profile.bio)
        expect(meRequests).toBe(1)
        await page.reload()
        await expectProfile(page)
        expect(meRequests).toBe(2)
        expect(writes).toEqual([])
      } finally {
        releaseProfile()
      }
    })
  })
}
