import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "507f1f77bcf86cd799439001", name: "Artista Teste", projectName: "Projeto inicial",
  email: "live@example.test", role: "admin", active: true, bio: "Bio inicial",
  createdAt: "2026-09-01T12:00:00Z", socials: {},
};
const id = "507f1f77bcf86cd799439002";

async function installStream(page: Page, pwa = false) {
  await page.addInitScript(({ pwa }) => {
    localStorage.setItem("djon_access_token", "live-test-token");
    Object.defineProperty(navigator, "standalone", { value: pwa });
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      if (!String(input).endsWith("/sync/stream")) return nativeFetch(input, options);
      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          const send = (event: Event) => {
            const resources = (event as CustomEvent<string[]>).detail;
            controller.enqueue(encoder.encode(`event: invalidate\ndata: ${JSON.stringify({ resources })}\n\n`));
          };
          const close = () => {
            window.removeEventListener("test:server-change", send);
            window.removeEventListener("test:stream-close", close);
            controller.close();
          };
          window.addEventListener("test:server-change", send);
          window.addEventListener("test:stream-close", close);
          options?.signal?.addEventListener("abort", close, { once: true });
          controller.enqueue(encoder.encode('event: ready\ndata: {"revision":"test"}\n\n'));
        },
      });
      return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
    };
  }, { pwa });
}

async function changed(page: Page, resources: string[]) {
  await page.evaluate((resources) => window.dispatchEvent(new CustomEvent("test:server-change", { detail: resources })), resources);
}

async function mock(page: Page, override: (route: Route, path: string) => Promise<boolean>) {
  await page.context().route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    if (await override(route, path)) return;
    if (path === "/users/me") return route.fulfill({ json: user });
    if (["/users", "/events", "/bookings", "/materials"].includes(path)) {
      return route.fulfill({ json: { items: [], total: 0, page: 1, limit: 100 } });
    }
    if (path.startsWith("/portal-content/")) return route.fulfill({ json: null });
    return route.fulfill({ json: [] });
  });
}

test("a profile saved in the browser updates an open PWA without replacing its draft", async ({ browser, page }) => {
  const pwaContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pwa = await pwaContext.newPage();
  let profile = { ...user };
  const pages = [page, pwa];
  for (const current of pages) {
    await installStream(current, current === pwa);
    await mock(current, async (route, path) => {
      if (path !== "/users/me" && path !== `/users/${user.id}`) return false;
      if (route.request().method() === "PATCH") {
        profile = { ...profile, ...route.request().postDataJSON() };
        await route.fulfill({ json: profile });
        await changed(pwa, ["users"]);
      } else await route.fulfill({ json: profile });
      return true;
    });
    await current.goto(`/dashboard/perfil/${user.id}`);
    await expect(current.getByRole("heading", { name: profile.projectName, exact: true })).toBeVisible();
  }
  await pwa.getByRole("button", { name: "EDITAR PERFIL", exact: true }).click();
  await pwa.locator("#profile-editor textarea").fill("Rascunho ainda nao salvo");
  await page.getByRole("button", { name: "EDITAR", exact: true }).first().click();
  await page.locator("#profile-editor input").nth(1).fill("Projeto salvo em outro acesso");
  await page.locator("#profile-editor button[type=submit]").click();
  await expect(pwa.getByRole("heading", { name: "Projeto salvo em outro acesso", exact: true })).toBeVisible();
  await expect(pwa.locator("#profile-editor textarea")).toHaveValue("Rascunho ainda nao salvo");
  await pwaContext.close();
});

test("an obsolete detail response is discarded after an external update", async ({ page }) => {
  await installStream(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  let projectName = "Perfil antigo";
  await mock(page, async (route, path) => {
    if (path !== `/users/${id}`) return false;
    requests += 1;
    const snapshot = { ...user, id, projectName };
    if (requests === 1) await gate;
    await route.fulfill({ json: snapshot });
    return true;
  });
  try {
    await page.goto(`/dashboard/perfil/${id}`);
    await expect.poll(() => requests).toBeGreaterThanOrEqual(1);
    projectName = "Perfil correto mais recente";
    await changed(page, ["users"]);
    release();
    await expect(page.getByRole("heading", { name: projectName, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Perfil antigo", exact: true })).toHaveCount(0);
    expect(requests).toBeGreaterThanOrEqual(2);
  } finally { release(); }
});

test("stream reconnect re-reads changes missed while the PWA was disconnected", async ({ page }) => {
  await installStream(page, true);
  let profile = { ...user };
  await mock(page, async (route, path) => {
    if (path !== "/users/me" && path !== `/users/${user.id}`) return false;
    await route.fulfill({ json: profile }); return true;
  });
  await page.goto(`/dashboard/perfil/${user.id}`);
  await expect(page.getByRole("heading", { name: profile.projectName, exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("test:stream-close")));
  profile = { ...profile, projectName: "Atualizado durante desconexao" };
  await expect(page.getByRole("heading", { name: profile.projectName, exact: true })).toBeVisible();
});

for (const scenario of [
  { resource: "users", path: "/dashboard/admin/alunos", endpoint: "/users", paginated: true,
    record: { ...user, id, role: "student", name: "Aluno inicial" }, field: "name", next: "Aluno atualizado" },
  { resource: "events", path: "/dashboard/mural", endpoint: "/events", paginated: true,
    record: { id, title: "Evento inicial", date: "2026-10-10", time: "16:00", type: "djOn", createdBy: user, location: "Porto Alegre" }, field: "title", next: "Evento atualizado" },
  { resource: "materials", path: "/dashboard/material", endpoint: "/materials", paginated: true,
    record: { id, title: "Material inicial", categoryId: { id: "category", name: "Biblioteca" }, authorId: user, status: "published", createdAt: "2026-09-01T12:00:00Z" }, field: "title", next: "Material atualizado" },
  { resource: "courses", path: "/dashboard/cursos", endpoint: "/courses", paginated: false,
    record: { id, name: "Curso inicial", description: "Curso de teste", active: true, workloadHours: 12 }, field: "name", next: "Curso atualizado" },
  { resource: "notifications", path: "/dashboard/notificacoes", endpoint: "/notifications", paginated: false,
    record: { id, title: "Aviso inicial", body: "Mensagem de teste", type: "update", url: "/dashboard/admin", createdAt: "2026-09-02T12:00:00Z" }, field: "title", next: "Aviso atualizado" },
  { resource: "bookings", path: "/dashboard/admin", endpoint: "/bookings", paginated: true,
    record: { id, title: "Agendamento inicial", studentId: user, professorId: user, date: "2026-10-10", time: "16:00", durationMinutes: 60, type: "aula", status: "confirmado", createdAt: "2026-09-01T12:00:00Z" }, field: "title", next: "Agendamento atualizado" },
  { resource: "units", path: "/dashboard/admin/unidades", endpoint: "/units/admin/all", paginated: false,
    record: { id, label: "Unidade inicial", key: "test", shortLabel: "TEST", address: "Rua de teste", active: true }, field: "label", next: "Unidade atualizada" },
]) {
  test(`${scenario.resource}: updates and deletions reach the currently open page`, async ({ page }) => {
    await installStream(page);
    let records = [scenario.record];
    await mock(page, async (route, path) => {
      if (path !== scenario.endpoint) return false;
      await route.fulfill({ json: scenario.paginated ? { items: records, total: records.length, page: 1, limit: 100 } : records });
      return true;
    });
    await page.goto(scenario.path);
    const original = String(scenario.record[scenario.field as keyof typeof scenario.record]);
    await expect(page.getByText(original, { exact: true }).first()).toBeVisible();
    records = [{ ...scenario.record, [scenario.field]: scenario.next }];
    await changed(page, [scenario.resource]);
    await expect(page.getByText(scenario.next, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(original, { exact: true })).toHaveCount(0);
    records = [];
    await changed(page, [scenario.resource]);
    await expect(page.getByText(scenario.next, { exact: true })).toHaveCount(0);
  });
}


test("a material removed elsewhere disappears from its open detail page", async ({ page }) => {
  await installStream(page);
  let deleted = false;
  await mock(page, async (route, path) => {
    if (path !== `/materials/${id}`) return false;
    await route.fulfill({ status: deleted ? 404 : 200, json: deleted ? { message: "Not found" } : {
      id, title: "Material removivel", body: "<p>Conteudo de teste</p>", categoryId: { id: "category", name: "Biblioteca" }, authorId: user, status: "published", attachments: [], createdAt: "2026-09-01T12:00:00Z",
    } });
    return true;
  });
  await page.goto(`/dashboard/material/${id}`);
  await expect(page.getByRole("heading", { name: "Material removivel", exact: true })).toBeVisible();
  deleted = true;
  await changed(page, ["materials"]);
  await expect(page.getByText("Material n\u00e3o encontrado", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Material removivel", exact: true })).toHaveCount(0);
});
