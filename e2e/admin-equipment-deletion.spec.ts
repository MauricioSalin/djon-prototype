import { expect, test, type Page, type Route } from "@playwright/test";

const equipment = {
  id: "507f1f77bcf86cd799439031",
  name: "DDJ-FLX10",
  description: "Controladora de quatro canais para treinos com Rekordbox.",
  unitId: "507f1f77bcf86cd799439021",
  unitLabel: "Camboriú / SC",
  active: false,
  unavailableWeekdays: [],
  unavailableFrom: null,
  unavailableUntil: null,
};

async function mockEquipments(
  page: Page,
  handlers: {
    onDelete?: () => void;
    onPatch?: (payload: Record<string, unknown>) => void;
  },
) {
  let equipments = [equipment];
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
  });
  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "");
    if (path === "/users/me") {
      await route.fulfill({
        json: {
          id: "507f1f77bcf86cd799439011",
          name: "Admin E2E",
          email: "admin@teste.com",
          role: "admin",
          permissions: ["equipments.manage"],
          active: true,
        },
      });
      return;
    }
    if (path === "/equipments/admin/all") {
      await route.fulfill({ json: equipments });
      return;
    }
    if (path === `/equipments/${equipment.id}` && request.method() === "PATCH") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      equipments = [{ ...equipment, ...payload }];
      handlers.onPatch?.(payload);
      await route.fulfill({ json: equipments[0] });
      return;
    }
    if (path === `/equipments/${equipment.id}` && request.method() === "DELETE") {
      equipments = [];
      handlers.onDelete?.();
      await route.fulfill({ json: equipment });
      return;
    }
    if (path === "/units" || path === "/units/admin/all") {
      await route.fulfill({ json: [] });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (["/events", "/bookings", "/materials"].includes(path)) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/audit-logs") {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 50 },
      });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

test("exclui definitivamente até um equipamento que já estava inativo", async ({
  page,
}) => {
  let deleteRequests = 0;
  await mockEquipments(page, {
    onDelete: () => {
      deleteRequests += 1;
    },
  });

  await page.goto("/dashboard/admin/equipamentos");
  await expect(page.getByText("DDJ-FLX10", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Excluir DDJ-FLX10" }).click();
  await expect(page.getByText("Excluir equipamento?")).toBeVisible();
  await expect(
    page.getByText(/Para impedir agendamentos apenas por algum tempo/),
  ).toBeVisible();
  await page.getByRole("button", { name: "EXCLUIR", exact: true }).click();

  await expect.poll(() => deleteRequests).toBe(1);
  await expect(page.getByText("DDJ-FLX10", { exact: true })).toHaveCount(0);
});

test("salva a indisponibilidade sem enviar campos somente de leitura", async ({
  page,
}) => {
  const payloads: Record<string, unknown>[] = [];
  await mockEquipments(page, {
    onPatch: (payload) => payloads.push(payload),
  });

  await page.goto("/dashboard/admin/equipamentos");
  await page
    .getByRole("button", {
      name: "Configurar indisponibilidade de DDJ-FLX10",
    })
    .click();
  await page.getByRole("button", { name: "Segunda", exact: true }).click();
  await page
    .getByRole("button", { name: "SALVAR INDISPONIBILIDADE" })
    .click();

  await expect.poll(() => payloads).toHaveLength(1);
  expect(payloads[0]).toMatchObject({
    unavailableWeekdays: [1],
    unavailableFrom: null,
    unavailableUntil: null,
  });
  expect(payloads[0]).not.toHaveProperty("id");
  expect(payloads[0]).not.toHaveProperty("unitLabel");

  await page
    .getByRole("button", {
      name: "Configurar indisponibilidade de DDJ-FLX10",
    })
    .click();
  await page.getByRole("button", { name: "Por dia e horário" }).click();
  await page.getByLabel("INÍCIO").fill("2026-09-10T10:00");
  await page.getByLabel("FIM").fill("2026-09-10T12:00");
  await page
    .getByRole("button", { name: "SALVAR INDISPONIBILIDADE" })
    .click();

  await expect.poll(() => payloads).toHaveLength(2);
  expect(payloads[1]).toMatchObject({
    unavailableWeekdays: [],
    unavailableFrom: "2026-09-10T10:00",
    unavailableUntil: "2026-09-10T12:00",
  });
  expect(payloads[1]).not.toHaveProperty("id");
  expect(payloads[1]).not.toHaveProperty("unitLabel");
});
