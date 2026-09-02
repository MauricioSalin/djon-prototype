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

async function mockMaterialEditor(
  page: Page,
  initialMaterial: Record<string, unknown> | null = null,
) {
  const materialId = "507f1f77bcf86cd799439041";
  let savedBody = "";
  let savedMaterial: Record<string, unknown> | null = initialMaterial;
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
      savedMaterial = {
        id: materialId,
        title: "",
        categoryId: {
          id: "507f1f77bcf86cd799439031",
          name: "Equipamento",
        },
        status: "draft",
        body: savedBody,
        authorId: professor,
        attachments: [],
        createdAt: "2026-09-02T12:00:00.000Z",
      };
      await route.fulfill({
        json: savedMaterial,
      });
      return;
    }
    if (path === `/materials/${materialId}` && request.method() === "GET") {
      await route.fulfill({
        status: savedMaterial ? 200 : 404,
        json: savedMaterial ?? { message: "Material não encontrado." },
      });
      return;
    }
    if (path === `/materials/${materialId}` && request.method() === "PATCH") {
      const payload = request.postDataJSON() as { body?: string };
      savedBody = payload.body ?? "";
      savedMaterial = { ...savedMaterial, ...payload, body: savedBody };
      await route.fulfill({ json: savedMaterial });
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

test("insere iframe seguro e o retoma no rascunho com textos preservados", async ({ page }) => {
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
  await expect(media).toHaveAttribute("data-video-transparent", "true");
  await expect(media).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(iframe).toHaveAttribute("allowtransparency", "true");
  await expect(iframe).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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
  expect(saved).toContain('data-video-transparent="true"');
  expect(saved).toContain('allowtransparency="true"');
  expect(saved).toContain("Texto ao lado do modelo 3D.");
  expect(saved).toContain("Texto abaixo do iframe.");
  expect(saved).toContain("https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&amp;transparent=1");
  expect(saved).not.toContain("onload");
  expect(saved).not.toContain("<script");
  expect(saved.indexOf("Texto abaixo do iframe.")).toBeGreaterThan(
    saved.indexOf('data-video-layout="left"'),
  );

  await expect(page).toHaveURL(/category=Rascunhos/);
  await page.goto("/dashboard/material/novo?edit=507f1f77bcf86cd799439041");

  const resumedMedia = page.locator('.material-editor [data-video-kind="embed"]');
  await expect(resumedMedia.locator("iframe")).toHaveAttribute(
    "src",
    "https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&transparent=1",
  );
  await expect(resumedMedia.locator('[data-video-text="true"]')).toContainText(
    "Texto ao lado do modelo 3D.",
  );
  await expect(page.locator(".material-editor")).toContainText("Texto abaixo do iframe.");
  await resumedMedia.click({ position: { x: 10, y: 10 } });
  await expect(page.getByText("IFRAME", { exact: true })).toBeVisible();
});

test("não força transparência quando o embed mantém o próprio fundo", async ({ page }) => {
  await mockMaterialEditor(page);
  await page.goto("/dashboard/material/novo");

  await page.getByRole("button", { name: "Conteúdo incorporado (iframe)" }).click();
  const dialog = page.getByRole("dialog", { name: "Inserir iframe" });
  await dialog.getByLabel("Código do iframe").fill(
    '<iframe title="Modelo com fundo" src="https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1"></iframe>',
  );
  await dialog.getByRole("button", { name: "INSERIR IFRAME" }).click();

  const media = page.locator('.material-editor [data-video-kind="embed"]');
  await expect(media).not.toHaveAttribute("data-video-transparent", /.+/);
  await expect(media.locator("iframe")).not.toHaveAttribute("allowtransparency", /.+/);
});

test("insere iframe fora do subtítulo onde o cursor estava", async ({ page }) => {
  await mockMaterialEditor(page);
  await page.goto("/dashboard/material/novo");

  const editor = page.locator(".material-editor");
  await editor.fill("Controladora");
  await editor.selectText();
  await page.getByRole("button", { name: "Subtítulo", exact: true }).click();
  await editor.locator("h3").click();

  await page.getByRole("button", { name: "Conteúdo incorporado (iframe)" }).click();
  const dialog = page.getByRole("dialog", { name: "Inserir iframe" });
  await dialog.getByLabel("Código do iframe").fill(
    '<iframe title="DDJ FLX4 - Pioneer" src="https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&amp;transparent=1"></iframe>',
  );
  await dialog.getByRole("button", { name: "INSERIR IFRAME" }).click();

  const media = editor.locator('[data-video-kind="embed"]');
  expect(
    await media.evaluate((element) => element.parentElement?.classList.contains("material-editor")),
  ).toBe(true);
  await expect(editor.locator("h3")).toHaveText("Controladora");
});

test("remove subtítulo ao clicar novamente em H3", async ({ page }) => {
  await mockMaterialEditor(page);
  await page.goto("/dashboard/material/novo");

  const editor = page.locator(".material-editor");
  await editor.fill("Texto que volta a ser parágrafo.");
  await editor.selectText();
  await page.getByRole("button", { name: "Negrito", exact: true }).click();
  await page.getByRole("button", { name: "Subtítulo", exact: true }).click();
  await expect(editor.locator("h3")).toHaveText("Texto que volta a ser parágrafo.");
  await expect(editor.locator("h3 strong, h3 b")).toHaveText(
    "Texto que volta a ser parágrafo.",
  );

  await page.getByRole("button", { name: "Subtítulo", exact: true }).click();
  await expect(editor.locator("h3")).toHaveCount(0);
  await expect(editor.locator("p")).toHaveText("Texto que volta a ser parágrafo.");
  await expect(editor.locator("p strong, p b")).toHaveText(
    "Texto que volta a ser parágrafo.",
  );
});

test("mantém texto normal após salvar e reabrir conteúdo que estava em H3", async ({ page }) => {
  const getSavedBody = await mockMaterialEditor(page);
  await page.goto("/dashboard/material/novo");

  const editor = page.locator(".material-editor");
  await editor.fill("Texto sem negrito que estava marcado como subtítulo.");
  await editor.selectText();
  await page.getByRole("button", { name: "Subtítulo", exact: true }).click();
  await expect(editor.locator("h3")).toHaveCSS("font-weight", "800");

  const normalButton = page.getByRole("button", { name: "Texto normal", exact: true });
  await normalButton.click();
  await expect(editor.locator("h3")).toHaveCount(0);
  await expect(editor.locator("p")).toHaveCSS("font-weight", "400");
  await expect(editor.locator("strong, b")).toHaveCount(0);
  await expect(normalButton).toHaveAttribute("aria-pressed", "true");

  await normalButton.click();
  await expect(editor.locator("p")).toHaveCSS("font-weight", "400");

  await page.getByRole("button", { name: "SALVAR RASCUNHO" }).click();
  await expect.poll(getSavedBody).toContain(
    "<p>Texto sem negrito que estava marcado como subtítulo.</p>",
  );
  expect(getSavedBody()).not.toContain("<h3");
  expect(getSavedBody()).not.toContain("<strong");
  expect(getSavedBody()).not.toContain("<b>");

  await page.goto("/dashboard/material/novo?edit=507f1f77bcf86cd799439041");
  await expect(page.locator(".material-editor p")).toHaveCSS("font-weight", "400");
  await expect(page.locator(".material-editor h3")).toHaveCount(0);
});

test("retira iframe e parágrafos de dentro de subtítulos antigos", async ({ page }) => {
  const materialId = "507f1f77bcf86cd799439041";
  const getSavedBody = await mockMaterialEditor(page, {
    id: materialId,
    title: "Controladora",
    categoryId: {
      id: "507f1f77bcf86cd799439031",
      name: "Equipamento",
    },
    status: "draft",
    body: '<h3>Controladora<br><div data-video-layout="block" data-video-width="100%" data-video-kind="embed" data-video-transparent="true"><iframe src="https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&amp;transparent=1" title="DDJ FLX4 - Pioneer" allowfullscreen allowtransparency="true"></iframe></div><p>Texto comum depois do iframe.</p></h3>',
    authorId: professor,
    attachments: [],
    createdAt: "2026-09-02T12:00:00.000Z",
  });

  await page.goto(`/dashboard/material/novo?edit=${materialId}`);

  const editor = page.locator(".material-editor");
  const media = editor.locator('[data-video-kind="embed"]');
  await expect(media).toHaveCount(1);
  expect(
    await media.evaluate((element) => element.parentElement?.classList.contains("material-editor")),
  ).toBe(true);
  await expect(editor.locator("h3")).toHaveText("Controladora");
  await expect(editor.locator("p")).toHaveText("Texto comum depois do iframe.");

  await page.getByRole("button", { name: "SALVAR RASCUNHO" }).click();
  await expect.poll(getSavedBody).toContain('data-video-kind="embed"');
  expect(getSavedBody()).not.toContain('<h3>Controladora<br><div data-video-layout');
});

test("mostra o iframe dentro do artigo publicado", async ({ page }) => {
  const materialId = "507f1f77bcf86cd799439041";
  const iframeSrc =
    "https://sketchfab.com/models/3d58b845642e4867b77c756c64d29802/embed?autostart=1&transparent=1";
  await mockMaterialEditor(page, {
    id: materialId,
    title: "Controladora",
    categoryId: {
      id: "507f1f77bcf86cd799439031",
      name: "Equipamento",
    },
    status: "published",
    body: `<div data-video-layout="block" data-video-width="100%" data-video-kind="embed" data-video-transparent="true"><iframe src="${iframeSrc}" title="DDJ FLX4 - Pioneer" allowfullscreen allowtransparency="true"></iframe></div><p>Texto abaixo do iframe.</p>`,
    authorId: professor,
    attachments: [],
    createdAt: "2026-09-02T12:00:00.000Z",
  });

  await page.goto(`/dashboard/material/${materialId}`);

  const article = page.locator(".material-prose");
  await expect(article.locator('iframe[title="DDJ FLX4 - Pioneer"]')).toHaveAttribute(
    "src",
    iframeSrc,
  );
  await expect(article.locator("iframe")).toBeVisible();
  await expect(article).toContainText("Texto abaixo do iframe.");
});
