import { expect, test, type Page, type Route } from "@playwright/test";

const professor = {
  id: "507f1f77bcf86cd799439011",
  name: "Professor E2E",
  email: "professor-iframe@teste.com",
  role: "professor",
  unitId: {
    id: "507f1f77bcf86cd799439021",
    label: "Porto Alegre / RS",
    shortLabel: "POA",
  },
  permissions: [],
  active: true,
  createdAt: "2026-09-02T12:00:00.000Z",
};

async function mockMaterialEditor(page: Page) {
  let savedBody = "";
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
  });
  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/users/me") {
      await route.fulfill({ json: professor });
      return;
    }
    if (path === "/materials/categories") {
      await route.fulfill({
        json: [
          {
            id: "507f1f77bcf86cd799439031",
            name: "Equipamento",
            type: "biblioteca",
          },
        ],
      });
      return;
    }
    if (path === "/materials" && request.method() === "POST") {
      const payload = request.postDataJSON() as { body?: string };
      savedBody = payload.body ?? "";
      await route.fulfill({
        json: {
          id: "507f1f77bcf86cd799439041",
          title: "",
          category: "Equipamento",
          status: "draft",
          body: savedBody,
          authorId: professor.id,
          authorName: professor.name,
          attachments: [],
          createdAt: "2026-09-02T12:00:00.000Z",
        },
      });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [professor], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (["/events", "/bookings", "/materials"].includes(path)) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (["/notifications", "/units", "/equipments"].includes(path)) {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: [] });
  });
  return () => savedBody;
}

test("insere iframe seguro e mantém texto ao lado e abaixo", async ({ page }) => {
  const getSavedBody = await mockMaterialEditor(page);
  await page.goto("/dashboard/material/novo");

  await page.getByRole("button", { name: "Conteúdo incorporado (iframe)" }).click();
  const dialog = page.getByRole("dialog", { name: "Inserir iframe" });
  await expect(dialog).toBeVisible();

  const code = dialog.getByLabel("Código do iframe");
  await code.fill(
    '<iframe src="javascript:alert(1)" onload="alert(2)"></iframe><script>alert(3)</script>',
  );
  await dialog.getByRole("button", { name: "INSERIR IFRAME" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Cole um único código iframe com endereço HTTPS válido.",
  );

  await code.fill(
    '<iframe title="DDJ FLX4 - Pioneer" frameborder="0" allowfullscreen web-share execution-while-not-rendered onload="alert(1)" allow="autoplay; fullscreen; xr-spatial-tracking" src="https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&transparent=1"></iframe>',
  );
  await dialog.getByRole("button", { name: "INSERIR IFRAME" }).click();

  const media = page.locator('.material-editor [data-video-kind="embed"]');
  const iframe = media.locator("iframe");
  await expect(media).toHaveAttribute("data-video-layout", "block");
  await expect(iframe).toHaveAttribute("title", "DDJ FLX4 - Pioneer");
  await expect(iframe).toHaveAttribute(
    "src",
    "https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&transparent=1",
  );
  await expect(iframe).not.toHaveAttribute("onload", /.+/);
  await expect(iframe).toHaveAttribute("web-share", "");
  await expect(iframe).toHaveAttribute("execution-while-not-rendered", "");

  await page.getByRole("button", { name: "Iframe à esquerda com texto ao lado" }).click();
  await media.locator('[data-video-text="true"]').fill("Texto ao lado do modelo 3D.");
  await page.locator('.material-editor [data-video-tail="true"]').fill("Texto abaixo do iframe.");

  await page.getByRole("button", { name: "SALVAR RASCUNHO" }).click();
  await expect.poll(getSavedBody).toContain('data-video-kind="embed"');

  const saved = getSavedBody();
  expect(saved).toContain("Texto ao lado do modelo 3D.");
  expect(saved).toContain("Texto abaixo do iframe.");
  expect(saved).toContain("https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&amp;transparent=1");
  expect(saved).not.toContain("onload");
  expect(saved).not.toContain("<script");
  expect(saved.indexOf("Texto abaixo do iframe.")).toBeGreaterThan(
    saved.indexOf('data-video-layout="left"'),
  );
});
