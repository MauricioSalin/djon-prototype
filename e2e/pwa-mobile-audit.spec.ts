import { expect, test, type Page, type Route } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/_vercel/insights/script.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "",
    }),
  );
});

const ids = {
  admin: "507f1f77bcf86cd799439001",
  professor: "507f1f77bcf86cd799439002",
  student: "507f1f77bcf86cd799439003",
  unit: "507f1f77bcf86cd799439004",
  equipment: "507f1f77bcf86cd799439005",
  material: "507f1f77bcf86cd799439006",
};

const permissions = [
  "admin.access",
  "users.manage",
  "permissions.manage",
  "leads.manage",
  "bookings.manage",
  "bookings.review",
  "courses.manage",
  "attendance.manage",
  "materials.manage",
  "units.manage",
  "equipments.manage",
  "events.manage",
  "notifications.manage",
  "portal.edit",
];

type PortalRole = "admin" | "professor" | "student";

function user(role: PortalRole) {
  return {
    id: ids[role],
    name:
      role === "admin"
        ? "Administrador Mobile"
        : role === "professor"
          ? "Professor Mobile"
          : "Aluno Mobile",
    email: `${role}-mobile@teste.com`,
    role,
    permissions: role === "admin" ? permissions : [],
    unitId: {
      id: ids.unit,
      label: "Porto Alegre / RS",
      shortLabel: "POA",
    },
    active: true,
    createdAt: "2026-09-01T12:00:00.000Z",
  };
}

const unit = {
  id: ids.unit,
  key: "poa",
  label: "Porto Alegre / RS",
  shortLabel: "POA",
  address: "Unidade Mobile",
  active: true,
};

const equipment = {
  id: ids.equipment,
  name: "CDJ Mobile",
  unitId: unit,
  active: true,
  unavailableWeekdays: [],
};

const material = {
  id: ids.material,
  title: "Material Mobile",
  description: "Conteúdo para validar a leitura em telas pequenas.",
  body: "<p>Conteúdo de teste responsivo.</p>",
  categoryId: { id: "507f1f77bcf86cd799439007", name: "Biblioteca" },
  authorId: user("admin"),
  status: "published",
  attachments: [],
  createdAt: "2026-09-01T12:00:00.000Z",
};

async function mockPortal(page: Page, role: PortalRole) {
  const current = user(role);
  const users = [user("admin"), user("professor"), user("student")];

  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-mobile-audit");
    window.sessionStorage.clear();
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/users/me") {
      await route.fulfill({ json: current });
      return;
    }
    if (/^\/users\/[a-f\d]{24}$/.test(path)) {
      const selected = users.find((item) => path.endsWith(item.id)) ?? current;
      await route.fulfill({ json: selected });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: users, total: users.length, page: 1, limit: 100 },
      });
      return;
    }
    if (path === `/materials/${ids.material}`) {
      await route.fulfill({ json: material });
      return;
    }
    if (path === "/materials" || path.startsWith("/materials?")) {
      await route.fulfill({
        json: { items: [material], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/events" || path.startsWith("/events?")) {
      await route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } });
      return;
    }
    if (path === "/bookings" || path.startsWith("/bookings?")) {
      await route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } });
      return;
    }
    if (path === "/units" || path === "/units/admin/all") {
      await route.fulfill({ json: [unit] });
      return;
    }
    if (path === "/equipments" || path === "/equipments/admin/all") {
      await route.fulfill({ json: [equipment] });
      return;
    }
    if (path === "/materials/categories") {
      await route.fulfill({ json: [material.categoryId] });
      return;
    }
    if (path === "/bookings/training-balance") {
      await route.fulfill({ json: { usedMinutes: 0, limitMinutes: 600 } });
      return;
    }
    if (path === "/audit-logs" || path.startsWith("/audit-logs?")) {
      await route.fulfill({ json: { items: [], total: 0, page: 1, limit: 50 } });
      return;
    }
    if (path.startsWith("/portal-content/")) {
      await route.fulfill({
        json: {
          key: path.slice("/portal-content/".length),
          label: "DJ ON",
          title: "Portal\nDJ ON.",
          description: "Conteúdo responsivo do portal.",
          banner: null,
        },
      });
      return;
    }
    if (
      path === "/notifications" ||
      path === "/leads" ||
      path.startsWith("/courses")
    ) {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

const routes: Record<PortalRole, string[]> = {
  admin: [
    "/dashboard/admin",
    "/dashboard/admin/config",
    "/dashboard/admin/alunos",
    "/dashboard/admin/professores",
    "/dashboard/admin/eventos",
    "/dashboard/admin/leads",
    "/dashboard/admin/unidades",
    "/dashboard/admin/equipamentos",
    "/dashboard/agenda",
    "/dashboard/cursos",
    "/dashboard/turmas",
    "/dashboard/material",
    "/dashboard/material/novo",
    `/dashboard/material/${ids.material}`,
    `/dashboard/material/cursos/${ids.material}`,
    "/dashboard/mural",
    "/dashboard/notificacoes",
    `/dashboard/perfil/${ids.admin}`,
  ],
  professor: [
    "/dashboard/professor",
    "/dashboard/professor/alunos",
    "/dashboard/professor/professores",
    "/dashboard/professor/evento",
    "/dashboard/agenda",
    "/dashboard/cursos",
    "/dashboard/turmas",
    "/dashboard/material",
    "/dashboard/material/novo",
    `/dashboard/material/${ids.material}`,
    `/dashboard/material/cursos/${ids.material}`,
    "/dashboard/mural",
    "/dashboard/notificacoes",
    `/dashboard/perfil/${ids.professor}`,
  ],
  student: [
    "/dashboard/student",
    "/dashboard/student/perfil",
    "/dashboard/student/agendar",
    "/dashboard/student/evento",
    "/dashboard/student/professores",
    "/dashboard/turmas",
    "/dashboard/material",
    `/dashboard/material/${ids.material}`,
    `/dashboard/material/cursos/${ids.material}`,
    "/dashboard/mural",
    "/dashboard/notificacoes",
  ],
};

const navigationLabels: Record<PortalRole, string[]> = {
  admin: [
    "Início",
    "Alunos",
    "Professores",
    "Eventos",
    "Mural",
    "Contatos",
    "Unidades",
    "Equipamentos",
    "Agenda",
    "Material",
    "Cursos",
    "Turmas",
  ],
  professor: [
    "Início",
    "Agenda",
    "Meus Eventos",
    "Mural",
    "Alunos",
    "Professores",
    "Material",
    "Cursos",
    "Turmas",
  ],
  student: [
    "Início",
    "Agenda",
    "Meus Eventos",
    "Mural",
    "Professores",
    "Material",
    "Cursos",
  ],
};

async function expectMobileMenu(page: Page, role: PortalRole) {
  const openButton = page.getByRole("button", {
    name: "Abrir menu",
    exact: true,
  });
  await expect(openButton).toBeVisible();
  await openButton.click();

  const menu = page.getByRole("dialog", { name: "Menu do portal" });
  const navigation = page.getByRole("navigation", {
    name: "Navegação do portal",
  });
  await expect(menu).toBeVisible();
  await expect(openButton).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fechar menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  const geometry = await menu.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.top).toBeCloseTo(64, 0);
  expect(geometry.bottom).toBeCloseTo(geometry.viewportHeight, 0);
  expect(geometry.height).toBeCloseTo(geometry.viewportHeight - 64, 0);

  const expectedLabels = navigationLabels[role];
  await expect(navigation.getByRole("link")).toHaveCount(expectedLabels.length);
  for (const label of expectedLabels) {
    await expect(
      navigation.getByRole("link", { name: label, exact: true }),
    ).toHaveCount(1);
  }

  const lastLink = navigation.getByRole("link", {
    name: expectedLabels.at(-1),
    exact: true,
  });
  await lastLink.scrollIntoViewIfNeeded();
  await expect(lastLink).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
}

async function expectMobileHeaderPanels(page: Page) {
  const notificationsButton = page.getByRole("button", {
    name: "Notificações",
  });
  await notificationsButton.click();
  await expect(notificationsButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Nenhuma notificação.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(notificationsButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Nenhuma notificação.")).toBeHidden();

  const searchButton = page.getByRole("button", { name: "Buscar" });
  await searchButton.click();
  await expect(searchButton).toHaveAttribute("aria-expanded", "true");
  const searchInput = page.getByPlaceholder(
    "Buscar alunos, professores, eventos...",
  );
  await expect(searchInput).toBeVisible();
  await searchInput.fill("zz");
  await expect(page.getByText('Nenhum resultado para "zz"')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(searchButton).toHaveAttribute("aria-expanded", "false");
  await expect(searchInput).toBeHidden();

  const accountButton = page.getByRole("button", {
    name: "Abrir menu da conta",
  });
  await accountButton.click();
  await expect(accountButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Acessar site" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Meu perfil" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(accountButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("link", { name: "Meu perfil" })).toBeHidden();
}

async function expectContainedModal(
  page: Page,
  path: string,
  triggerName: string,
  headingName: string,
) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", {
    name: triggerName,
    exact: true,
  }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const heading = page.getByRole("heading", {
    name: headingName,
    exact: true,
  });
  await expect(heading).toBeVisible();
  const overlay = heading.locator(
    "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' fixed ')][1]",
  );
  const panel = heading.locator(
    "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' djon-scroll ')][1]",
  );
  await expect(overlay).toBeVisible();
  await expect(panel).toBeVisible();
  await page.waitForTimeout(400);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  const geometry = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      overflowY: getComputedStyle(element).overflowY,
    };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(["auto", "scroll"]).toContain(geometry.overflowY);

  await panel
    .locator("button")
    .filter({ has: page.locator("svg.lucide-x") })
    .first()
    .click();
  await expect(heading).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
}

async function expectCoreMobileModals(page: Page, role: PortalRole) {
  const sharedAuthoring = [
    ["/dashboard/agenda", "NOVO", "Agendamento"],
    ["/dashboard/cursos", "NOVO CURSO", "Curso"],
  ] as const;
  const scenarios =
    role === "admin"
      ? ([
          ["/dashboard/admin/alunos", "NOVO ALUNO", "Cadastrar Aluno"],
          [
            "/dashboard/admin/professores",
            "NOVO PROFESSOR",
            "Cadastrar Professor",
          ],
          ["/dashboard/admin/eventos", "NOVO EVENTO", "Novo Evento"],
          ["/dashboard/admin/unidades", "NOVA UNIDADE", "Nova unidade"],
          [
            "/dashboard/admin/equipamentos",
            "NOVO EQUIPAMENTO",
            "Equipamento",
          ],
          ...sharedAuthoring,
        ] as const)
      : role === "professor"
        ? ([
            [
              "/dashboard/professor/alunos",
              "NOVO ALUNO",
              "Cadastrar aluno",
            ],
            [
              "/dashboard/professor/evento",
              "NOVO EVENTO",
              "Cadastrar Evento",
            ],
            ...sharedAuthoring,
          ] as const)
        : ([
            [
              "/dashboard/student/agendar",
              "SOLICITAR TREINO",
              "Solicitar treino",
            ],
            [
              "/dashboard/student/evento",
              "NOVO EVENTO",
              "Cadastrar Evento",
            ],
          ] as const);

  for (const [path, trigger, heading] of scenarios) {
    await expectContainedModal(page, path, trigger, heading);
  }
}

async function expectMobilePage(page: Page, path: string) {
  const errors: string[] = [];
  const onPageError = (error: Error) => errors.push(error.message);
  const onConsole = (message: { type(): string; text(): string }) => {
    if (
      message.type() === "error" &&
      message.text() !== "Failed to load resource: net::ERR_FAILED"
    ) {
      errors.push(message.text());
    }
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.waitForTimeout(350);

  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const overflowing = Array.from(document.body.querySelectorAll("*"))
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.position === "fixed" || style.position === "absolute") return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && (rect.right > viewport + 1 || rect.left < -1);
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className?.toString().slice(0, 140) ?? "",
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
      }));
    const clippedControls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "a[href], button, input, select, textarea, [role='button']",
      ),
    )
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 1 &&
          rect.height > 1 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          (rect.right > viewport + 1 || rect.left < -1)
        );
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className?.toString().slice(0, 140) ?? "",
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
      }));
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      overflowing,
      clippedControls,
      notFound: document.body.innerText.includes("This page could not be found."),
    };
  });

  expect.soft(layout.notFound, `${path} não deve renderizar 404`).toBe(false);
  expect
    .soft(layout.documentWidth, `${path} excedeu a largura mobile: ${JSON.stringify(layout.overflowing)}`)
    .toBeLessThanOrEqual(layout.viewport + 1);
  expect
    .soft(layout.bodyWidth, `${path} fez o body exceder a largura mobile`)
    .toBeLessThanOrEqual(layout.viewport + 1);
  expect.soft(layout.clippedControls, `${path} recortou controles interativos`).toEqual([]);
  expect.soft(errors, `${path} gerou erro no console`).toEqual([]);

  page.off("pageerror", onPageError);
  page.off("console", onConsole);
}

async function expectPublicMobileMenu(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.waitForTimeout(300);
  const openButton = page.getByRole("button", {
    name: "Abrir menu",
    exact: true,
  });
  await openButton.click();
  await expect(
    page.getByRole("button", { name: "Fechar menu", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("dialog", { name: "Menu do site" });
  await expect(menu).toBeVisible();
  await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  await expect
    .poll(() => menu.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(64, 0);
  await expect
    .poll(() =>
      menu.evaluate(
        (element) =>
          Math.abs(element.getBoundingClientRect().bottom - window.innerHeight),
      ),
    )
    .toBeLessThan(0.5);

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");
}

test.describe("PWA real", () => {
  test.use({ serviceWorkers: "allow" });

  test("registra o service worker e entrega um manifest PWA coerente", async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        configurable: true,
        get: () => false,
      });
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        (message.type() === "error" || message.type() === "warning") &&
        message.text() !== "Failed to load resource: net::ERR_FAILED"
      ) {
        errors.push(message.text());
      }
    });

    await page.goto("/login");
    await expect
      .poll(async () =>
        page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration("/"))),
      )
      .toBe(true);

    const serviceWorker = await request.get("/sw.js");
    expect(serviceWorker.ok()).toBe(true);
    expect(serviceWorker.headers()["content-type"]).toContain("application/javascript");
    expect(serviceWorker.headers()["cache-control"]).toContain("no-store");
    const serviceWorkerSource = await serviceWorker.text();
    expect(serviceWorkerSource).not.toContain('addEventListener("fetch"');
    expect(serviceWorkerSource).not.toContain("respondWith");

    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = (await manifestResponse.json()) as {
      start_url: string;
      display: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
      screenshots: Array<{ src: string; sizes: string }>;
    };
    expect(manifest.start_url).toBe("/login");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/djon-icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icons/djon-icon-512.png", sizes: "512x512" }),
      ]),
    );
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(false);
    expect(manifest.screenshots).toEqual([
      expect.objectContaining({ src: "/djon-screenshot2.png", sizes: "1280x577" }),
    ]);
    expect(errors).toEqual([]);
  });
});

test("dashboard recupera uma falha transitória da API", async ({ page }) => {
  let currentUserAttempts = 0;
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-retry-audit");
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    if (path === "/users/me") {
      currentUserAttempts += 1;
      if (currentUserAttempts === 1) {
        await route.abort("connectionfailed");
        return;
      }
      await route.fulfill({ json: user("admin") });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({ json: { items: [user("admin")], total: 1, page: 1, limit: 100 } });
      return;
    }
    if (path === "/events" || path === "/bookings" || path === "/materials") {
      await route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.goto("/dashboard/admin");

  await expect(page.getByText("PAINEL ADMINISTRATIVO")).toBeVisible();
  expect(currentUserAttempts).toBe(2);
  await expect(page.getByText("Failed to fetch")).toHaveCount(0);
});

test.describe("landing em iPhone", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    hasTouch: true,
    isMobile: true,
  });

  test("adia o Spline até a ativação sem fallback visual", async ({ page }) => {
    const splineRequests: string[] = [];
    await page.route("https://prod.spline.design/**", async (route) => {
      splineRequests.push(route.request().url());
      await route.continue();
    });
    await page.route("**/api/v1/**", (route) => route.fulfill({ json: [] }));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_500);
    expect(splineRequests).toHaveLength(0);
    await expect(
      page.locator('iframe[title="Sincronização da sessão do portal"]'),
    ).toHaveCount(0);

    const activate3d = page.getByRole("button", { name: "ATIVAR EXPERIÊNCIA 3D" });
    await expect(activate3d).toBeVisible();
    await activate3d.click();
    await expect
      .poll(() => splineRequests.length, { timeout: 20_000 })
      .toBeGreaterThan(0);

    await expect(page.locator("[data-spline-fallback]")).toHaveCount(0);
  });
});

for (const viewport of [
  { name: "320x568", width: 320, height: 568 },
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
]) {
  test.describe(`portal mobile ${viewport.name}`, () => {
    test.use({ viewport });

    test("páginas públicas", async ({ page }) => {
      await page.route("**/api/v1/**", (route) => route.fulfill({ json: [] }));
      for (const path of [
        "/",
        "/login",
        "/recuperar-senha",
        "/redefinir-senha?token=mobile-audit",
        "/brand",
      ]) {
        await expectMobilePage(page, path);
      }
      await expectPublicMobileMenu(page);
    });

    for (const role of ["admin", "professor", "student"] as const) {
      test(`${role}: rotas e subtelas`, async ({ page }) => {
        test.setTimeout(150_000);
        await mockPortal(page, role);
        for (const path of routes[role]) await expectMobilePage(page, path);
        await expectMobileMenu(page, role);
        await expectMobileHeaderPanels(page);
        await expectCoreMobileModals(page, role);
      });
    }
  });
}
