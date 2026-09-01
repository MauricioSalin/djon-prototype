import { expect, test, type Page, type Route } from "@playwright/test";

type Role = "student" | "professor" | "admin";

const futureYear = new Date().getFullYear() + 1;
const events = Array.from({ length: 9 }, (_, index) => ({
  id: `507f1f77bcf86cd7994391${String(index).padStart(2, "0")}`,
  title: `Próximo evento ${index + 1}`,
  date: `${futureYear}-01-${String(index + 1).padStart(2, "0")}`,
  time: "20:00",
  location: `Local ${index + 1}`,
  instagram: `pessoa${index + 1}`,
  description: `Descrição completa do evento ${index + 1}.`,
  authorId: {
    id: `507f1f77bcf86cd7994392${String(index).padStart(2, "0")}`,
    name: `Pessoa ${index + 1}`,
  },
  type: (["djOn", "professor", "student"] as const)[index % 3],
  createdAt: "2026-09-01T12:00:00.000Z",
}));

const paths: Record<Role, string> = {
  student: "/dashboard/student",
  professor: "/dashboard/professor",
  admin: "/dashboard/admin",
};

async function mockHomeApi(page: Page, role: Role) {
  const currentUser = {
    id: "507f1f77bcf86cd799439001",
    name: `${role} E2E`,
    email: `${role}@teste.com`,
    role,
    permissions: role === "admin" ? ["admin.access"] : [],
    active: true,
    createdAt: "2026-09-01T12:00:00.000Z",
  };

  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
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
    if (path === "/events") {
      await route.fulfill({
        json: { items: events, total: events.length, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/users" || path === "/bookings" || path === "/materials") {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (path.startsWith("/portal-content/")) {
      await route.fulfill({ status: 404, json: { message: "Sem conteúdo" } });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

for (const role of ["student", "professor", "admin"] as const) {
  test(`mostra os seis próximos eventos com os cards do mural para ${role}`, async ({
    page,
  }) => {
    await mockHomeApi(page, role);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(paths[role]);

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Próximos Eventos", exact: true }),
    });
    await expect(section).toBeVisible();
    await expect(section.locator("article")).toHaveCount(6);
    await expect(section.locator("article").first()).toContainText("@pessoa1");
    await expect(section.locator("article").first()).toContainText(
      "Descrição completa do evento 1.",
    );
    await expect(section.getByText("Próximo evento 7", { exact: true })).toHaveCount(0);
    await expect(section.getByText("Próximo evento 9", { exact: true })).toHaveCount(0);
    await expect(section.getByRole("link", { name: "VER TODOS" })).toHaveAttribute(
      "href",
      "/dashboard/mural",
    );

    const grid = section.locator("article").first().locator("..");
    await expect
      .poll(async () =>
        grid.evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
        ),
      )
      .toBe(3);

    const rowPositions = await section.locator("article").evaluateAll((cards) =>
      [...new Set(cards.map((card) => Math.round(card.getBoundingClientRect().top)))],
    );
    expect(rowPositions).toHaveLength(2);
  });
}
