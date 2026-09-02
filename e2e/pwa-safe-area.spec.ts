import { expect, test, type Page } from "@playwright/test";

async function mockPortal(page: Page) {
  const user = {
    id: "507f1f77bcf86cd799439003",
    name: "Aluno PWA",
    email: "pwa@teste.com",
    role: "student",
    permissions: [],
    active: true,
    createdAt: "2026-09-02T12:00:00.000Z",
  };
  await page.addInitScript(() => {
    localStorage.setItem("djon_access_token", "token-safe-area");
    sessionStorage.clear();
  });
  await page.context().route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    if (path === "/users/me") {
      await route.fulfill({ json: user });
    } else if (["/users", "/materials", "/events", "/bookings"].includes(path)) {
      const items = path === "/users" ? [user] : [];
      await route.fulfill({ json: { items, total: items.length, page: 1, limit: 100 } });
    } else {
      await route.fulfill({ json: [] });
    }
  });
}

for (const inset of [0, 59]) {
  test(`portal respeita area segura de ${inset}px sem alterar a cor do header`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await page.context().newCDPSession(page);
    // Override the browser's env(), not the application's CSS custom properties.
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: inset, left: 0, right: 0, bottom: 34 },
    });
    await mockPortal(page);
    await page.goto("/dashboard/student");

    const header = page.locator("header");
    const row = header.locator(":scope > div").first();
    const main = page.locator("main");
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS("padding-top", `${inset}px`);
    await expect(row).toHaveCSS("height", "64px");
    await expect.poll(async () => (await row.boundingBox())?.y).toBe(inset);
    await expect(main).toHaveCSS("padding-top", `${64 + inset}px`);
    const background = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    await expect(header).toHaveClass(/bg-djon-page\/95/);
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveCount(1);
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute("content", "black-translucent");
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#121212");

    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "Menu do portal" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS("top", `${64 + inset}px`);
    await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
    await expect(menu).toBeHidden();

    const bell = page.getByRole("button", { name: "Notificações", exact: true });
    await bell.click();
    const notificationsPanel = header.locator('[class*="max-sm:fixed"]').filter({ has: page.getByText("Tudo em dia", { exact: true }) });
    await expect(notificationsPanel).toBeVisible();
    await expect.poll(async () => Math.round((await notificationsPanel.boundingBox())?.y ?? -1)).toBe(72 + inset);
    await bell.click();

    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    const search = page.getByPlaceholder("Buscar alunos, professores, eventos...");
    await expect(search).toBeVisible();
    const searchPanel = header.locator('[class*="max-sm:fixed"]').filter({ has: search });
    await expect.poll(async () => Math.round((await searchPanel.boundingBox())?.y ?? -1)).toBe(72 + inset);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(search).toBeHidden();

    await page.screenshot({ path: testInfo.outputPath("safe-area-header.png") });
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect.poll(async () => (await row.boundingBox())?.y).toBe(inset);
    await expect(header).toHaveCSS("background-color", background);

    // Changing the device inset must relayout the header without a reload/UA check.
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0 } });
    await expect(header).toHaveCSS("padding-top", "0px");
    await expect(main).toHaveCSS("padding-top", "64px");
    await expect(header).toHaveCSS("background-color", background);
  });
}

test("desktop mantem header compacto sem area segura", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPortal(page);
  await page.goto("/dashboard/student");
  await expect(page.locator("header")).toHaveCSS("padding-top", "0px");
  await expect(page.locator("main")).toHaveCSS("padding-top", "64px");
  await expect(page.getByRole("button", { name: "Abrir menu", exact: true })).toBeHidden();
});
