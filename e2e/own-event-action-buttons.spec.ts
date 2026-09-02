import { expect, test, type Page, type Route } from "@playwright/test";

const student = {
  id: "507f1f77bcf86cd799439031",
  name: "Aluno E2E",
  email: "aluno-e2e@teste.com",
  role: "student",
  permissions: [],
  active: true,
  createdAt: "2026-09-01T12:00:00.000Z",
};

const event = {
  id: "507f1f77bcf86cd799439041",
  title: "Evento com ações",
  date: `${new Date().getFullYear() + 1}-09-06`,
  time: "16:00",
  location: "Hum Rooftop",
  authorId: {
    id: student.id,
    name: student.name,
  },
  type: "student",
  createdAt: "2026-09-01T12:00:00.000Z",
};

async function mockOwnEventsApi(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/api\/v1/,
      "",
    );

    if (path === "/users/me") {
      await route.fulfill({ json: student });
      return;
    }
    if (path === "/events") {
      await route.fulfill({
        json: { items: [event], total: 1, page: 1, limit: 100 },
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
    if (path === "/notifications") {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

test("usa cores semânticas e hover padrão nas ações do card", async ({
  page,
}) => {
  await mockOwnEventsApi(page);
  await page.goto("/dashboard/student/evento");

  const editButton = page.getByRole("button", {
    name: `Editar evento ${event.title}`,
  });
  const deleteButton = page.getByRole("button", {
    name: `Excluir evento ${event.title}`,
  });

  await expect(editButton).toBeVisible();
  await expect(editButton).toHaveCSS("color", "rgb(138, 242, 59)");
  await expect(deleteButton).toHaveCSS("color", "rgb(248, 113, 113)");

  const editFilterBeforeHover = await editButton.evaluate(
    (button) => getComputedStyle(button).filter,
  );
  await editButton.hover();
  await expect
    .poll(() => editButton.evaluate((button) => getComputedStyle(button).filter))
    .not.toBe(editFilterBeforeHover);

  await deleteButton.hover();
  await expect
    .poll(() =>
      deleteButton.evaluate((button) => getComputedStyle(button).filter),
    )
    .not.toBe(editFilterBeforeHover);
});
