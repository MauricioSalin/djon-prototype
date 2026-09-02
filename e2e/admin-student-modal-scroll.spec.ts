import { expect, test, type Page, type Route } from "@playwright/test";

const admin = {
  id: "507f1f77bcf86cd799439001",
  name: "Administrador E2E",
  email: "admin-e2e@teste.com",
  role: "admin",
  permissions: ["admin.access", "users.manage"],
  active: true,
  createdAt: "2026-09-01T12:00:00.000Z",
};

const unit = {
  id: "507f1f77bcf86cd799439002",
  key: "camboriu",
  label: "Camboriú / SC",
  shortLabel: "CBR",
  address: "Unidade E2E",
  active: true,
};

async function mockAdminPortal(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-student-modal-e2e");
    window.sessionStorage.clear();
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/api\/v1/,
      "",
    );

    if (path === "/users/me") {
      await route.fulfill({ json: admin });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [admin], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/units" || path === "/units/admin/all") {
      await route.fulfill({ json: [unit] });
      return;
    }
    if (["/bookings", "/events", "/materials"].includes(path)) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (path.startsWith("/portal-content/")) {
      await route.fulfill({ json: null });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

test("modal de cadastro bloqueia a página e mantém o scroll no card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await mockAdminPortal(page);
  await page.goto("/dashboard/admin/alunos");

  await page.getByRole("button", { name: "NOVO ALUNO" }).click();

  const card = page
    .getByRole("heading", { name: "Cadastrar Aluno" })
    .locator("xpath=ancestor::div[contains(@class, 'djon-scroll')]");
  const overlay = card.locator("..");

  await expect(card).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
  await expect
    .poll(() =>
      overlay.evaluate((element) => getComputedStyle(element).overflowY),
    )
    .toBe("hidden");

  const scrollState = await card.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(scrollState.overflowY).toBe("auto");
  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);

  await card.evaluate((element) => {
    element.scrollTop = 200;
  });
  await expect
    .poll(() => card.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  await card
    .getByRole("button")
    .filter({ has: page.locator("svg.lucide-x") })
    .click();
  await expect(card).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
});
