import { expect, test, type Page, type Route } from "@playwright/test";

const currentUser = {
  id: "507f1f77bcf86cd799439001", name: "Pessoa de Teste",
  email: "loading@example.test", role: "admin", active: true,
  permissions: ["admin.access"], createdAt: "2026-09-01T12:00:00.000Z",
};
const booking = {
  id: "507f1f77bcf86cd799439002", title: "Agendamento atualizado",
  studentId: currentUser, professorId: currentUser, date: "2026-09-10",
  time: "16:00", durationMinutes: 60, type: "aula", status: "confirmado",
  createdAt: "2026-09-01T12:00:00.000Z",
};
const detailId = "507f1f77bcf86cd799439003";
const material = {
  id: detailId, title: "Material completo", body: "<p>Conteudo recuperado.</p>",
  categoryId: { id: "category", name: "Biblioteca" }, authorId: currentUser,
  status: "published", attachments: [], createdAt: "2026-09-01T12:00:00.000Z",
};
const profile = { ...currentUser, id: detailId, projectName: "Perfil recuperado" };

async function mockPortal(
  page: Page,
  override: (route: Route, path: string) => Promise<boolean>,
  role = "admin",
) {
  await page.addInitScript(() => {
    localStorage.setItem("djon_access_token", "loading-test-token");
    Object.defineProperty(navigator, "standalone", { value: true });
  });
  await page.context().route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    if (await override(route, path)) return;
    if (path === "/users/me") return route.fulfill({ json: { ...currentUser, role } });
    if (["/users", "/events", "/bookings", "/materials"].includes(path)) {
      return route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } });
    }
    if (path === "/bookings/training-balance") return route.fulfill({ json: { limitHours: 8, reservedHours: 0, remainingHours: 8 } });
    if (path === `/materials/${detailId}`) return route.fulfill({ json: material });
    if (path === `/users/${detailId}`) return route.fulfill({ json: profile });
    if (path.startsWith("/portal-content/")) return route.fulfill({ json: null });
    return route.fulfill({ json: [] });
  });
}

test("agenda waits for fresh data on navigation without a cache expiry interval", async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.clock.setFixedTime(new Date("2026-09-10T12:00:00-03:00"));
  await mockPortal(page, async (route, path) => {
    if (path !== "/bookings") return false;
    requests += 1;
    if (requests > 1) await gate;
    const items = requests > 1 ? [booking] : [];
    await route.fulfill({ json: { items, total: items.length, page: 1, limit: 100 } });
    return true;
  });
  try {
    await page.goto("/dashboard/cursos");
    await expect(page.getByRole("heading", { name: "Cursos", exact: true })).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-09-10T12:00:01-03:00"));
    await page.locator('a[href="/dashboard/agenda"]').first().click();
    await expect.poll(() => requests).toBe(2);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(1);
    await expect(page.getByRole("status")).toBeVisible();
    release();
    await expect(page.getByRole("button", { name: `16:00 ${currentUser.name}`, exact: true })).toBeVisible();
    expect(requests).toBeGreaterThanOrEqual(2);
  } finally {
    release();
  }
});

test("courses recover from a failed request without an endless skeleton", async ({ page }) => {
  let fail = true;
  let failures = 0;
  await mockPortal(page, async (route, path) => {
    if (path !== "/courses") return false;
    if (fail) failures += 1;
    await route.fulfill({ status: fail ? 503 : 200, json: fail ? { message: "Unavailable" } : [{ id: "course", name: "Curso recuperado", active: true }] });
    return true;
  });
  await page.goto("/dashboard/cursos");
  await expect.poll(() => failures).toBeGreaterThanOrEqual(6);
  await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
  await expect(page.getByText("Nenhum curso cadastrado", { exact: true })).toHaveCount(0);
  fail = false;
  await expect(page.getByRole("link", { name: "Acessar curso Curso recuperado", exact: true })).toBeVisible();
});

for (const routeCase of [
  { page: "/dashboard/turmas", endpoint: "/courses/cohorts", role: "admin", empty: "Nenhuma turma disponível." },
  { page: "/dashboard/student/agendar", endpoint: "/bookings/training-balance", role: "student", empty: "Nenhum agendamento solicitado" },
]) {
  test(`${routeCase.page} distinguishes a network failure from an empty list`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let fail = true;
    let failures = 0;
    await mockPortal(page, async (route, path) => {
      if (path !== routeCase.endpoint || !fail) return false;
      failures += 1;
      await route.abort("failed");
      return true;
    }, routeCase.role);
    await page.goto(routeCase.page);
    await expect.poll(() => failures).toBeGreaterThanOrEqual(6);
    await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
    await expect(page.getByText(routeCase.empty, { exact: true })).toHaveCount(0);
    fail = false;
    await expect(page.getByText(routeCase.empty, { exact: true })).toBeVisible();
  });
}

for (const detail of [
  { path: "material", endpoint: "materials", title: material.title, missing: "Material não encontrado" },
  { path: "perfil", endpoint: "users", title: profile.projectName, missing: "Perfil não encontrado." },
]) {
  test(`${detail.path} retries a failed detail request without claiming the record is missing`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let fail = true;
    let failures = 0;
    await mockPortal(page, async (route, path) => {
      if (path !== `/${detail.endpoint}/${detailId}` || !fail) return false;
      failures += 1;
      await route.fulfill({ status: 503, json: { message: "Unavailable" } });
      return true;
    });
    await page.goto(`/dashboard/${detail.path}/${detailId}`);
    await expect.poll(() => failures).toBeGreaterThanOrEqual(6);
    await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
    await expect(page.getByText(detail.missing, { exact: true })).toHaveCount(0);
    fail = false;
    await expect(page.getByRole("heading", { name: detail.title, exact: true })).toBeVisible();
  });

  test(`${detail.path} preserves the not-found state for an actual 404`, async ({ page }) => {
    await mockPortal(page, async (route, path) => {
      if (path !== `/${detail.endpoint}/${detailId}`) return false;
      await route.fulfill({ status: 404, json: { message: "Not found" } });
      return true;
    });
    await page.goto(`/dashboard/${detail.path}/${detailId}`);
    await expect(page.getByText(detail.missing, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
  });

  test(`${detail.path} reads the current record instead of an older directory snapshot`, async ({ page }) => {
    let detailRequests = 0;
    await mockPortal(page, async (route, path) => {
      if (path === `/${detail.endpoint}/${detailId}`) detailRequests += 1;
      if (path !== `/${detail.endpoint}`) return false;
      const item = detail.path === "perfil"
        ? { ...profile, projectName: "Nome antigo", bio: "" }
        : { ...material, title: "Titulo antigo", body: "" };
      await route.fulfill({ json: { items: [item], total: 1, page: 1, limit: 100 } });
      return true;
    });
    await page.goto(`/dashboard/${detail.path}/${detailId}`);
    await expect(page.getByRole("heading", { name: detail.title, exact: true })).toBeVisible();
    expect(detailRequests).toBeGreaterThan(0);
  });
}

test("portal completes its initial load after a connection failure without user intervention", async ({ page }) => {
  let meRequests = 0;
  await mockPortal(page, async (route, path) => {
    if (path !== "/users/me") return false;
    meRequests += 1;
    if (meRequests > 3) return false;
    await route.abort("failed");
    return true;
  }, "student");
  await page.goto("/dashboard/student/perfil");
  await expect(page.getByRole("heading", { name: currentUser.name, exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
  expect(meRequests).toBe(4);
});

for (const destination of [
  { path: "/dashboard/agenda", role: "admin" },
  { path: "/dashboard/admin", role: "admin" },
  { path: "/dashboard/professor", role: "professor" },
]) {
  test(`${destination.path} recovers when an expired bootstrap fails`, async ({ page }) => {
    let fail = false;
    let requests = 0;
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date("2026-09-10T12:00:00-03:00"));
    await mockPortal(page, async (route, path) => {
      if (path !== "/bookings") return false;
      requests += 1;
      await route.fulfill({ status: fail ? 503 : 200, json: fail ? { message: "Unavailable" } : { items: [booking], total: 1, page: 1, limit: 100 } });
      return true;
    }, destination.role);
    await page.goto(`/dashboard/perfil/${currentUser.id}`);
    await expect(page.getByRole("heading", { name: currentUser.name, exact: true })).toBeVisible();
    fail = true;
    await page.clock.setFixedTime(new Date("2026-09-10T12:00:01-03:00"));
    await page.locator(`a[href="${destination.path}"]`).first().click();
    await expect.poll(() => requests).toBeGreaterThanOrEqual(4);
    await expect(page.getByRole("button", { name: "TENTAR NOVAMENTE" })).toHaveCount(0);
    fail = false;
    if (destination.path === "/dashboard/agenda") {
      await expect(page.getByRole("button", { name: `16:00 ${currentUser.name}`, exact: true })).toBeVisible();
    } else {
      await expect(page.getByText(booking.title, { exact: true }).first()).toBeVisible();
    }
    expect(requests).toBeGreaterThanOrEqual(3);
    expect(errors).toEqual([]);
  });
}
