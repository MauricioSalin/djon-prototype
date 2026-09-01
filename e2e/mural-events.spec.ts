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

const muralEvent = {
  id: "507f1f77bcf86cd799439041",
  title: "Evento carregado da API",
  date: "2026-12-20",
  time: "22:00",
  location: "DJ ON Porto Alegre",
  authorId: {
    id: student.id,
    name: student.name,
  },
  type: "student",
  createdAt: "2026-09-01T12:00:00.000Z",
};

const muralHero = {
  key: "mural",
  label: "COMUNIDADE",
  title: "Mural de\nEventos.",
  description: "Eventos da comunidade DJ ON.",
  banner: null,
};

type MuralApiState = {
  failEvents: boolean;
  eventRequests: number;
};

async function mockMuralApi(page: Page, state: MuralApiState) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");

    const selector = '[role="status"][aria-busy="true"]';
    const seen = new WeakSet<Element>();
    const loadingState = { rootsCreated: 0, maxConcurrent: 0 };
    Object.defineProperty(window, "__djonLoadingState", {
      value: loadingState,
      configurable: false,
    });

    const collect = () => {
      const roots = Array.from(document.querySelectorAll(selector));
      loadingState.maxConcurrent = Math.max(
        loadingState.maxConcurrent,
        roots.length,
      );
      for (const root of roots) {
        if (seen.has(root)) continue;
        seen.add(root);
        loadingState.rootsCreated += 1;
      }
    };

    new MutationObserver(collect).observe(document, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("DOMContentLoaded", collect, { once: true });
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "");

    if (path === "/users/me") {
      await route.fulfill({ json: student });
      return;
    }
    if (path === "/events") {
      state.eventRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (state.failEvents) {
        await route.fulfill({
          status: 503,
          json: { message: "Eventos temporariamente indisponíveis." },
        });
        return;
      }
      await route.fulfill({
        json: { items: [muralEvent], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/users" || path === "/bookings" || path === "/materials") {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/portal-content/mural") {
      await route.fulfill({ json: muralHero });
      return;
    }
    if (path === "/notifications") {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

async function expectSingleLoadingBoundary(page: Page) {
  const loadingState = await page.evaluate(
    () =>
      (
        window as unknown as Window & {
          __djonLoadingState: { rootsCreated: number; maxConcurrent: number };
        }
      ).__djonLoadingState,
  );
  expect(loadingState.rootsCreated).toBeLessThanOrEqual(1);
  expect(loadingState.maxConcurrent).toBeLessThanOrEqual(1);
}

test("consulta os eventos no acesso direto e novamente após recarregar", async ({
  page,
}) => {
  const state: MuralApiState = { failEvents: false, eventRequests: 0 };
  await mockMuralApi(page, state);

  await page.goto("/dashboard/mural");
  await expect(page.getByText(muralEvent.title, { exact: true })).toBeVisible();
  await expect(page.getByText("1 evento", { exact: true })).toBeVisible();
  await expect(page.getByText("Nenhum evento para mostrar.")).toHaveCount(0);
  expect(state.eventRequests).toBe(1);
  await expectSingleLoadingBoundary(page);

  const requestsBeforeReload = state.eventRequests;
  await page.reload();
  await expect(page.getByText(muralEvent.title, { exact: true })).toBeVisible();
  expect(state.eventRequests).toBe(requestsBeforeReload + 1);
  await expectSingleLoadingBoundary(page);
});

test("mostra erro e permite tentar novamente sem fingir que a lista está vazia", async ({
  page,
}) => {
  const state: MuralApiState = { failEvents: true, eventRequests: 0 };
  await mockMuralApi(page, state);

  await page.goto("/dashboard/mural");
  await expect(
    page.getByText("Eventos temporariamente indisponíveis.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Nenhum evento para mostrar.")).toHaveCount(0);

  state.failEvents = false;
  await page.getByRole("button", { name: "TENTAR NOVAMENTE" }).click();
  await expect(page.getByText(muralEvent.title, { exact: true })).toBeVisible();
  await expect(page.getByText("1 evento", { exact: true })).toBeVisible();
});
