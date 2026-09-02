import { expect, test, type Page, type Route } from "@playwright/test";

const unit = {
  id: "507f1f77bcf86cd799439002",
  key: "camboriu",
  label: "Camboriú / SC",
  shortLabel: "CBR",
  address: "Unidade E2E",
  active: true,
};

async function mockPortal(page: Page, role: "admin" | "professor") {
  const currentUser = {
    id: "507f1f77bcf86cd799439001",
    name: role === "admin" ? "Administrador E2E" : "Professor E2E",
    email: `${role}-e2e@teste.com`,
    role,
    unitId: unit.id,
    permissions: role === "admin" ? ["admin.access", "users.manage"] : [],
    active: true,
    createdAt: "2026-09-02T12:00:00.000Z",
  };

  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-cpf-mask-e2e");
    window.sessionStorage.clear();
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/api\/v1/,
      "",
    );

    if (path === "/users/me") {
      await route.fulfill({ json: currentUser });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [currentUser], total: 1, page: 1, limit: 100 },
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

for (const portal of [
  { role: "admin" as const, path: "/dashboard/admin/alunos" },
  { role: "professor" as const, path: "/dashboard/professor/alunos" },
]) {
  test(`aplica máscara ao CPF no portal de ${portal.role}`, async ({ page }) => {
    await mockPortal(page, portal.role);
    await page.goto(portal.path);
    await page.getByRole("button", { name: "NOVO ALUNO" }).click();

    const cpf = page.getByPlaceholder("000.000.000-00");
    await cpf.fill("10254974902");

    await expect(cpf).toHaveValue("102.549.749-02");
    await expect(cpf).toHaveAttribute("inputmode", "numeric");
    await expect(cpf).toHaveAttribute("maxlength", "14");
  });
}
