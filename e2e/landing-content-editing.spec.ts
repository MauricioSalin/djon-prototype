import {
  expect,
  test,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";
import { landingDefaults, type LandingSectionKey } from "../lib/landing-content";

const editor = {
  id: "507f1f77bcf86cd799439011",
  name: "Professor Editor",
  email: "editor@teste.com",
  role: "professor",
  permissions: ["site.edit"],
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const unit = {
  id: "507f1f77bcf86cd799439012",
  key: "poa",
  label: "Porto Alegre / RS",
  shortLabel: "POA",
  address: "Rua da Música, 100 — Porto Alegre",
  mapSrc: "https://www.openstreetmap.org/export/embed.html?bbox=-51.3,-30.1,-51.1,-29.9",
  mapsHref: "https://www.openstreetmap.org/",
  phone: "(51) 99999-1111",
  email: "poa@djon.test",
  instagram: "https://instagram.com/djonpoa",
  facebook: "https://facebook.com/djonpoa",
  openingHours: "Segunda a sábado, das 10h às 20h",
  timezone: "America/Sao_Paulo",
  active: true,
};

async function expectImageSource(image: Locator, expectedPath: string) {
  await expect(image).toBeVisible();
  await expect
    .poll(async () => {
      const source = await image.getAttribute("src");
      if (!source) return "";
      const parsed = new URL(source, "http://localhost");
      return parsed.searchParams.get("url") ?? parsed.pathname;
    })
    .toBe(expectedPath);
}

async function mockLanding(
  page: Page,
  onUpdate: (key: LandingSectionKey, data: unknown) => void,
  permissions: string[] = ["site.edit"],
  onDelete: (id: string) => void = () => undefined,
) {
  await page.addInitScript(() => localStorage.setItem("djon_access_token", "token-e2e"));
  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "");
    if (path === "/users/me") {
      await route.fulfill({ json: { ...editor, permissions } });
      return;
    }
    if (path === "/landing-content") {
      await route.fulfill({
        json: Object.entries(landingDefaults).map(([key, data]) => ({ key, data })),
      });
      return;
    }
    if (path.startsWith("/landing-content/") && request.method() === "PATCH") {
      const key = path.split("/").pop() as LandingSectionKey;
      const payload = request.postDataJSON() as { data: unknown };
      onUpdate(key, payload.data);
      await route.fulfill({ json: { key, data: payload.data } });
      return;
    }
    if (path === "/files" && request.method() === "POST") {
      await route.fulfill({
        status: 201,
        json: {
          id: "64b7abdecf2160b649ab6085",
          url: "/api/v1/files/64b7abdecf2160b649ab6085",
          fileName: "grid.png",
          mimeType: "image/png",
          size: 68,
          purpose: "site-image",
        },
      });
      return;
    }
    if (path.startsWith("/files/") && request.method() === "DELETE") {
      onDelete(path.split("/").pop() ?? "");
      await route.fulfill({ json: { removed: true } });
      return;
    }
    if (path === "/units") {
      await route.fulfill({ json: [unit] });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

test("edita as sete seções e mantém o contato derivado da unidade", async ({ page }) => {
  const updates: Array<{ key: LandingSectionKey; data: unknown }> = [];
  await mockLanding(page, (key, data) => updates.push({ key, data }));
  await page.goto("/");

  await expect(page.getByRole("button", { name: "EDITAR", exact: true })).toHaveCount(7);
  await expectImageSource(
    page.getByAltText("Formação DJ — DJ ON Academy"),
    "/images/djon-course-dj.png",
  );
  await expectImageSource(
    page.getByAltText("Produção Musical — DJ ON Academy"),
    "/images/djon-course-producao.png",
  );
  await expectImageSource(
    page.getByAltText("Formação DJ", { exact: true }),
    "/images/djon-course-dj.png",
  );
  await expectImageSource(
    page.getByAltText("SHOWCASE — Evento Oficial DJ ON"),
    "/images/djon-showcase.png",
  );
  await expectImageSource(
    page.getByAltText("Segredo", { exact: true }),
    "/images/djon-team-segredo.png",
  );
  await expect(page.getByText("(51) 99999-1111", { exact: true })).toBeVisible();
  await expect(page.getByText("poa@djon.test", { exact: true })).toBeVisible();
  await expect(page.getByText("Segunda a sábado, das 10h às 20h", { exact: true })).toHaveCount(2);
  await expect(page.locator("#cursos").getByRole("link", { name: "DESBLOQUEAR" }).first()).toHaveAttribute("href", "#contato");

  await page.getByRole("button", { name: "EDITAR", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Hero principal");
  await expect(page.getByRole("dialog").locator("input").first().locator("..")).toHaveClass(
    "flex items-center gap-2",
  );
  await page.getByLabel("Título").fill("SEU PRÓXIMO\nPALCO COMEÇA AQUI");
  await page.getByRole("button", { name: "SALVAR ALTERAÇÕES" }).click();

  expect(updates).toHaveLength(1);
  expect(updates[0]).toMatchObject({
    key: "hero",
    data: { title: "SEU PRÓXIMO\nPALCO COMEÇA AQUI" },
  });
  await expect(page.getByText("PALCO COMEÇA AQUI", { exact: true })).toBeVisible();
});

test("não oferece edição sem a permissão do site principal", async ({ page }) => {
  await mockLanding(page, () => undefined, ["portal.edit"]);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "EDITAR", exact: true })).toHaveCount(0);
});

test("edita somente um curso por vez usando abas", async ({ page }) => {
  await mockLanding(page, () => undefined);
  await page.goto("/");

  await page.getByRole("button", { name: "EDITAR", exact: true }).nth(2).click();
  const dialog = page.getByRole("dialog");
  const tabs = dialog.getByRole("tab");
  const panel = dialog.getByRole("tabpanel");

  await expect(tabs).toHaveCount(3);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByLabel("Título")).toHaveValue("Formação DJ");
  await expect(panel.locator('[data-site-aspect="4:5"]')).toHaveClass(/max-w-sm/);

  await dialog.getByRole("tab", { name: "2. Produção Musical" }).click();
  await expect(dialog.getByRole("tab", { name: "2. Produção Musical" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(panel.getByLabel("Título")).toHaveValue("Produção Musical");
});

test("edita somente um integrante do time por vez usando abas", async ({ page }) => {
  await mockLanding(page, () => undefined);
  await page.goto("/");

  await page.getByRole("button", { name: "EDITAR", exact: true }).nth(5).click();
  const dialog = page.getByRole("dialog");
  const tabs = dialog.getByRole("tab");
  const panel = dialog.getByRole("tabpanel");

  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByLabel("Nome")).toHaveValue("Segredo");
  await expect(panel.locator('input[type="file"]')).toHaveCount(1);
  await expect(panel.locator('[data-site-aspect="1:1"]')).toHaveClass(/max-w-sm/);

  await dialog.getByRole("tab", { name: "3. Xinddy" }).click();
  await expect(dialog.getByRole("tab", { name: "3. Xinddy" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(panel.getByLabel("Nome")).toHaveValue("Xinddy");
});

test("usa os dropdowns próprios do portal para cores e ícones", async ({ page }) => {
  await mockLanding(page, () => undefined);
  await page.goto("/");

  await page.getByRole("button", { name: "EDITAR", exact: true }).nth(3).click();
  const dialog = page.getByRole("dialog");

  await expect(dialog.getByRole("combobox", { name: "Cor" })).toHaveCount(3);
  await expect(
    dialog.getByRole("combobox", { name: "Ícone da biblioteca Lucide" }),
  ).toHaveCount(3);

  const colorSelect = dialog.getByRole("combobox", { name: "Cor" }).first();
  await expect(colorSelect.locator('[data-slot="select-option-preview"]')).toBeVisible();
  await colorSelect.click();
  const viewport = page.locator('[data-slot="select-viewport"]');
  await expect(viewport).toBeVisible();
  await expect(viewport).toHaveCSS("overflow-y", "auto");
  await expect(page.locator('[data-slot="select-scroll-up-button"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="select-scroll-down-button"]')).toHaveCount(0);
  const purpleOption = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: /^Roxo claro$/ });
  await expect(purpleOption).toHaveAttribute("role", "option");
  await expect(
    purpleOption.locator('[data-slot="select-option-preview"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewport).toBeHidden();

  const iconSelect = dialog
    .getByRole("combobox", { name: "Ícone da biblioteca Lucide" })
    .first();
  await expect(iconSelect.locator('[data-slot="select-option-preview"]')).toBeVisible();
  await iconSelect.click();
  await expect(viewport).toBeVisible();
  const peopleOption = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: /^Pessoas$/ });
  await expect(peopleOption).toHaveAttribute("role", "option");
  await expect(peopleOption.locator('[data-slot="select-option-preview"]')).toBeVisible();
  await page.keyboard.press("Escape");
});

test("remove do storage uma imagem enviada quando a edição é cancelada", async ({ page }) => {
  const deleted: string[] = [];
  await mockLanding(page, () => undefined, ["site.edit"], (id) => deleted.push(id));
  await page.goto("/");

  await page.getByRole("button", { name: "EDITAR", exact: true }).nth(1).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Apresentação");
  await expect(dialog.locator('[data-site-aspect="1:1"]')).toHaveCount(4);
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: "grid.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(dialog.locator('img[src*="64b7abdecf2160b649ab6085"]').first()).toBeVisible();
  await dialog.getByRole("button", { name: "CANCELAR" }).click();

  await expect.poll(() => deleted).toContain("64b7abdecf2160b649ab6085");
});
