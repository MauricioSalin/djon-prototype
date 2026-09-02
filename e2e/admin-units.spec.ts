import { expect, test, type Page, type Route } from "@playwright/test";

const unit = {
  id: "507f1f77bcf86cd799439021",
  key: "camboriu",
  label: "Camboriú / SC",
  shortLabel: "Camboriú",
  address: "Alameda Cap. Ernesto Nunes, 987 — Bairro Cedros, Camboriú",
  timezone: "America/Sao_Paulo",
  active: true,
};

async function mockUnits(
  page: Page,
  onSave: (payload: Record<string, unknown>) => void,
) {
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
          permissions: ["units.manage"],
          active: true,
        },
      });
      return;
    }
    if (path === "/units/admin/all" || path === "/units") {
      await route.fulfill({ json: [unit] });
      return;
    }
    if (path === `/units/${unit.id}` && request.method() === "PATCH") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      onSave(payload);
      await route.fulfill({ json: { ...unit, ...payload } });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (
      path === "/events" ||
      path === "/bookings" ||
      path === "/materials"
    ) {
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

test("edita somente dados úteis e preenche o contato legado exibido no site", async ({
  page,
}) => {
  let savedPayload: Record<string, unknown> | undefined;
  await mockUnits(page, (payload) => {
    savedPayload = payload;
  });

  await page.goto("/dashboard/admin/unidades");
  await page.getByRole("button", { name: "Editar unidade" }).click();

  await expect(page.getByLabel("Nome da unidade")).toHaveValue(
    "Camboriú / SC",
  );
  await expect(page.getByLabel("Telefone público")).toHaveValue(
    "(51) 99700-7846",
  );
  await expect(page.getByLabel("E-mail de contato")).toHaveValue(
    "contato@djonacademy.com",
  );
  await expect(page.getByLabel(/Instagram/)).toHaveValue(
    "https://www.instagram.com/djonacademy",
  );
  await expect(page.getByLabel(/Facebook/)).toHaveValue(
    "https://www.facebook.com/djonacademy",
  );
  await expect(page.getByPlaceholder("Identificador (poa)")).toHaveCount(0);
  await expect(page.getByPlaceholder("Nome curto")).toHaveCount(0);
  await expect(page.getByPlaceholder("Fuso horário")).toHaveCount(0);
  await expect(
    page.getByText(
      "Mapa, link de localização, identificador interno e fuso horário são definidos automaticamente.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "SALVAR UNIDADE" }).click();
  await expect.poll(() => savedPayload).toBeDefined();
  expect(savedPayload).toMatchObject({
    label: "Camboriú / SC",
    phone: "(51) 99700-7846",
    email: "contato@djonacademy.com",
    instagram: "https://www.instagram.com/djonacademy",
    facebook: "https://www.facebook.com/djonacademy",
    openingHours: "Segunda à sexta das 9h às 18h",
  });
  expect(savedPayload).not.toHaveProperty("key");
  expect(savedPayload).not.toHaveProperty("shortLabel");
  expect(savedPayload).not.toHaveProperty("timezone");
  expect(savedPayload).not.toHaveProperty("mapSrc");
  expect(savedPayload).not.toHaveProperty("mapsHref");
});
