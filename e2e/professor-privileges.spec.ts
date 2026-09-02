import { expect, test, type Page, type Route } from "@playwright/test";

const allPermissions = [
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
  "site.edit",
] as const;

type Permission = (typeof allPermissions)[number];

const adminRoutes: Array<[string, Permission]> = [
  ["/dashboard/admin", "admin.access"],
  ["/dashboard/admin/config", "admin.access"],
  ["/dashboard/admin/alunos", "users.manage"],
  ["/dashboard/admin/professores", "users.manage"],
  ["/dashboard/admin/eventos", "events.manage"],
  ["/dashboard/admin/leads", "leads.manage"],
  ["/dashboard/admin/unidades", "units.manage"],
  ["/dashboard/admin/equipamentos", "equipments.manage"],
];

const nativeProfessorRoutes = [
  "/dashboard/professor",
  "/dashboard/professor/alunos",
  "/dashboard/professor/professores",
  "/dashboard/professor/evento",
  "/dashboard/agenda",
  "/dashboard/cursos",
  "/dashboard/turmas",
  "/dashboard/material",
  "/dashboard/mural",
];

const professor = {
  id: "507f1f77bcf86cd799439011",
  name: "Professor E2E",
  email: "professor-e2e@teste.com",
  role: "professor",
  unitId: {
    id: "507f1f77bcf86cd799439021",
    label: "Porto Alegre / RS",
    shortLabel: "POA",
  },
  active: true,
  createdAt: "2026-08-31T12:00:00.000Z",
};

const targetProfessor = {
  ...professor,
  id: "507f1f77bcf86cd799439012",
  name: "Professor Alvo",
  email: "professor-alvo@teste.com",
  permissions: [],
};

async function mockPortal(
  page: Page,
  getPermissions: () => Permission[],
  onPermissionUpdate?: (permissions: Permission[]) => void,
) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
  });
  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const current = { ...professor, permissions: getPermissions() };

    if (path === "/users/me") {
      await route.fulfill({ json: current });
      return;
    }
    if (
      path === `/users/${targetProfessor.id}/permissions` &&
      request.method() === "PATCH"
    ) {
      const payload = request.postDataJSON() as { permissions: Permission[] };
      onPermissionUpdate?.(payload.permissions);
      await route.fulfill({ json: { ...targetProfessor, ...payload } });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: {
          items: [current, targetProfessor],
          total: 2,
          page: 1,
          limit: 100,
        },
      });
      return;
    }
    if (path === "/units" || path === "/units/admin/all") {
      await route.fulfill({
        json: [
          {
            id: professor.unitId.id,
            key: "poa",
            label: professor.unitId.label,
            shortLabel: professor.unitId.shortLabel,
            address: "Unidade E2E",
            active: true,
          },
        ],
      });
      return;
    }
    if (
      path === "/materials/categories" ||
      path === "/notifications" ||
      path === "/equipments" ||
      path === "/equipments/admin/all" ||
      path === "/leads" ||
      path === "/courses" ||
      path === "/courses/cohorts"
    ) {
      await route.fulfill({ json: [] });
      return;
    }
    if (path === "/audit-logs") {
      await route.fulfill({ json: { items: [], total: 0, page: 1, limit: 50 } });
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
    await route.fulfill({ json: [] });
  });
}

test("mantém os recursos nativos e bloqueia páginas administrativas sem privilégio", async ({
  page,
}) => {
  let permissions: Permission[] = [];
  await mockPortal(page, () => permissions);

  for (const path of nativeProfessorRoutes) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}/?$`));
  }

  for (const [path] of adminRoutes) {
    permissions = [];
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard\/professor\/?$/);
  }
});

test("libera cada página administrativa somente com o privilégio correspondente", async ({
  page,
}) => {
  let permissions: Permission[] = [];
  await mockPortal(page, () => permissions);

  for (const [path, permission] of adminRoutes) {
    permissions = [permission];
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}/?$`));
  }
});

test("não intercala o skeleton da landing antes do skeleton administrativo", async ({
  page,
}) => {
  const permissions: Permission[] = ["equipments.manage"];
  await mockPortal(page, () => permissions);
  await page.addInitScript(() => {
    const state = window as Window & { sawLandingSkeleton?: boolean };
    state.sawLandingSkeleton = false;
    const detectLandingSkeleton = () => {
      if (document.querySelector("main > div > header")) {
        state.sawLandingSkeleton = true;
      }
    };
    new MutationObserver(detectLandingSkeleton).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  await page.goto("/dashboard/admin/equipamentos");
  await expect(
    page.getByRole("heading", { name: "Equipamentos", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { sawLandingSkeleton?: boolean })
            .sawLandingSkeleton,
      ),
    )
    .toBe(false);
});

test("mostra o skeleton de turmas com o hero da página atual", async ({
  page,
}) => {
  await mockPortal(page, () => []);
  await page.route("**/api/v1/courses/cohorts", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: [] });
  });

  await page.goto("/dashboard/turmas");

  const loading = page.getByRole("status");
  await expect(loading).toBeVisible();
  await expect(loading.locator(".djon-portal-hero")).toBeVisible();
  await expect(loading.locator("article")).toHaveCount(4);

  await expect(page.getByLabel("Buscar turmas")).toBeVisible();
});

test("mostra o skeleton de contatos enquanto os leads carregam", async ({
  page,
}) => {
  await mockPortal(page, () => ["leads.manage"]);
  await page.route("**/api/v1/leads", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: [] });
  });

  await page.goto("/dashboard/admin/leads");

  const loading = page.getByRole("status");
  await expect(loading).toBeVisible();
  await expect(loading.locator("section")).toHaveCount(4);
  await expect(page.getByText("Nenhum contato encontrado.")).toHaveCount(0);

  await expect(page.getByText("Nenhum contato encontrado.")).toBeVisible();
});

test("mostra somente privilégios configuráveis e salva acesso total", async ({
  page,
}) => {
  let permissions: Permission[] = ["users.manage", "permissions.manage"];
  let savedPermissions: Permission[] = [];
  await mockPortal(
    page,
    () => permissions,
    (updated) => {
      savedPermissions = updated;
      permissions = updated;
    },
  );

  await page.goto("/dashboard/admin/professores");
  await page.getByLabel("Configurar privilégios de Professor Alvo").click();

  await expect(page.getByText("Permissões nativas", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Privilégios adicionais", { exact: true })).toHaveCount(0);
  await expect(page.locator('input[type="checkbox"]:disabled:checked')).toHaveCount(0);
  await expect(page.getByText("0/15 ativos", { exact: true })).toBeVisible();

  const totalAccessButton = page.getByRole("button", { name: "Acesso total" });
  await expect(totalAccessButton).toHaveAttribute("aria-pressed", "false");
  await totalAccessButton.click();
  await expect(page.getByText("15/15 ativos", { exact: true })).toBeVisible();
  await expect(totalAccessButton).toHaveAttribute("aria-pressed", "true");

  await page.getByText("Painel administrativo", { exact: true }).click();
  await expect(page.getByText("14/15 ativos", { exact: true })).toBeVisible();
  await expect(totalAccessButton).toHaveAttribute("aria-pressed", "false");

  await totalAccessButton.click();
  await expect(page.getByText("15/15 ativos", { exact: true })).toBeVisible();
  await expect(totalAccessButton).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "SALVAR PRIVILÉGIOS" }).click();

  expect([...savedPermissions].sort()).toEqual(
    [...allPermissions].sort(),
  );
});

test("com todos os privilégios usa a navegação e todas as rotas do admin", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const permissions: Permission[] = [...allPermissions];
  await mockPortal(page, () => permissions);

  await page.goto("/dashboard/admin");
  for (const label of [
    "Início",
    "Alunos",
    "Professores",
    "Eventos",
    "Contatos",
    "Unidades",
    "Equipamentos",
    "Agenda",
    "Material",
    "Cursos",
    "Turmas",
    "Mural",
  ]) {
    await expect(page.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "Auditoria", exact: true }),
  ).toHaveCount(0);

  for (const [path] of adminRoutes) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}/?$`));
  }

  await page.goto("/dashboard/admin/auditoria");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "This page could not be found." }),
  ).toBeVisible();

  await page.goto("/dashboard/chave-de-auditoria-nao-configurada");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
