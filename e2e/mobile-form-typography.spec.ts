import { expect, test, type Page } from "@playwright/test";

async function mockAdmin(page: Page) {
  const unit = { id: "unit-mobile", key: "poa", label: "Porto Alegre / RS", shortLabel: "POA", active: true };
  const user = {
    id: "admin-mobile", name: "Admin Mobile", email: "mobile@example.com",
    role: "admin", permissions: ["admin.access", "users.manage"],
    unitId: unit.id, active: true,
  };
  await page.addInitScript(() => {
    localStorage.setItem("djon_access_token", "mobile-form-test");
  });
  await page.context().route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    const json = path === "/users/me" ? user
      : path.startsWith("/units") ? [unit]
      : path === "/users" ? { items: [user], total: 1, page: 1, limit: 100 }
      : ["/bookings", "/events", "/materials"].includes(path) ? { items: [], total: 0, page: 1, limit: 100 }
      : path.startsWith("/portal-content/") ? null : [];
    await route.fulfill({ json });
  });
}

for (const mode of [
  { name: "phone", width: 390, height: 844, touch: true },
  { name: "landscape PWA", width: 844, height: 390, touch: true },
  { name: "small viewport", width: 320, height: 740, touch: false },
]) {
  test.describe(mode.name, () => {
    test.use({ viewport: { width: mode.width, height: mode.height }, isMobile: mode.touch, hasTouch: mode.touch });

    test("keeps login fields at 16px before and after focus", async ({ page }) => {
      if (mode.name.includes("PWA")) {
        await page.addInitScript(() => {
          Object.defineProperty(navigator, "standalone", { get: () => true });
        });
      }
      await page.goto("/login");
      const email = page.getByPlaceholder("seu@email.com");
      await expect(email).toHaveCSS("font-size", "16px");
      await email.fill("mobile@example.com");
      await expect(email).toBeFocused();
      await expect(email).toHaveValue("mobile@example.com");
      await expect(email).toHaveCSS("font-size", "16px");
      await expect(page.locator('input[type="password"]')).toHaveCSS("font-size", "16px");
      // Preserve user pinch zoom; font sizing must not rely on disabling scaling.
      const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
      expect(viewport).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/);
    });

    test("matches text, numeric, date and select fields in the student form", async ({ page }) => {
      await mockAdmin(page);
      await page.goto("/dashboard/admin/alunos");
      await page.getByRole("button", { name: "NOVO ALUNO" }).click();
      const name = page.getByPlaceholder("Nome completo do aluno");
      await expect(name).toBeVisible();
      for (const field of await page.locator('form input:not([type="hidden"]), form [data-slot="select-trigger"]').all()) {
        await expect(field).toHaveCSS("font-size", "16px");
        const box = await field.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(mode.width + 1);
        expect(box!.height).toBeGreaterThanOrEqual(40);
      }
      const cpf = page.getByPlaceholder("000.000.000-00");
      await cpf.fill("10254974902");
      await expect(cpf).toHaveValue("102.549.749-02");
      await page.getByRole("combobox", { name: "Selecionar unidade..." }).click();
      const option = page.getByRole("option", { name: "Porto Alegre / RS" });
      await expect(option).toBeVisible();
      await expect(option).toHaveCSS("font-size", "16px");
      await option.click();
      await expect(page.getByRole("combobox", { name: "Selecionar unidade..." })).toHaveText("Porto Alegre / RS");
      await page.screenshot({ path: test.info().outputPath("student-form.png") });
    });
  });
}

test("normalizes smaller textarea styles on mobile while preserving desktop sizes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/brand");
  const textarea = page.locator("textarea").first();
  await expect(textarea).toHaveCSS("font-size", "16px");
  await textarea.focus();
  await expect(textarea).toHaveCSS("font-size", "16px");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(textarea).toHaveCSS("font-size", "12px");
  await page.goto("/login");
  await expect(page.getByPlaceholder("seu@email.com")).toHaveCSS("font-size", "14px");
});
