import { expect, test, type Page, type Route } from "@playwright/test";

const professor = {
  id: "507f1f77bcf86cd799439011",
  name: "Professor E2E",
  email: "professor-e2e@teste.com",
  role: "professor",
  permissions: ["portal.edit"],
  active: true,
  createdAt: "2026-08-31T12:00:00.000Z",
};

const student = {
  ...professor,
  id: "507f1f77bcf86cd799439012",
  name: "Aluno E2E",
  email: "aluno-e2e@teste.com",
  role: "student",
};

const admin = {
  ...professor,
  id: "507f1f77bcf86cd799439013",
  name: "Admin E2E",
  email: "admin-e2e@teste.com",
  role: "admin",
};

const heroes = {
  "student-home": {
    key: "student-home",
    label: "BEM-VINDO DE VOLTA",
    title: "{{nome}},\no que vamos\nfazer hoje?",
    description:
      "Explore seus cursos, acompanhe sua evolução e continue desenvolvendo sua identidade como DJ.",
    banner: "/images/student-old.png",
  },
  "professor-home": {
    key: "professor-home",
    label: "{{nome}}",
    title: "{{nome}},\npronto pra\nensinar?",
    description:
      "Conduza suas turmas, acompanhe seus alunos e compartilhe sua experiência com a próxima geração de DJs.",
    banner: "/images/professor-old.png",
  },
  "admin-home": {
    key: "admin-home",
    label: "PAINEL ADMINISTRATIVO",
    title: "DJ ON\nAcademy.",
    description: "Gerencie a academia.",
    banner: "/images/djon-showcase.png",
  },
  "student-courses": {
    key: "student-courses",
    label: "CURSOS DO ALUNO",
    title: "Cursos",
    description: "Formação do aluno.",
    banner: "/images/djon-hero.png",
  },
  "staff-courses": {
    key: "staff-courses",
    label: "TURMAS DA EQUIPE",
    title: "Turmas",
    description: "Gestão das turmas.",
    banner: "/images/staff-old.png",
  },
  mural: {
    key: "mural",
    label: "COMUNIDADE",
    title: "Mural de\nEventos.",
    description: "Eventos da comunidade.",
    banner: "/images/mural-hero.png",
  },
  "student-events": {
    key: "student-events",
    label: "EVENTOS DO ALUNO",
    title: "Meus eventos",
    description: "Eventos publicados pelo aluno.",
    banner: "/images/student-events-old.png",
  },
  "professor-events": {
    key: "professor-events",
    label: "EVENTOS DO PROFESSOR",
    title: "Meus eventos",
    description: "Eventos publicados pelo professor.",
    banner: "/images/professor-events-old.png",
  },
  "admin-events": {
    key: "admin-events",
    label: "EVENTOS DA ADMINISTRAÇÃO",
    title: "Gerenciar eventos",
    description: "Gestão dos eventos.",
    banner: "/images/admin-events-old.png",
  },
  "student-bookings": {
    key: "student-bookings",
    label: "AGENDA DO ALUNO",
    title: "Agendamentos",
    description: "Solicite seus treinos.",
    banner: "/images/bookings-old.png",
  },
} as const;

type HeroKey = keyof typeof heroes;
type HeroPayload = {
  label?: string;
  title?: string;
  description?: string;
  banner?: string | null;
};

const cohort = {
  id: "507f1f77bcf86cd799439020",
  name: "Turma 1.0",
  courseId: { id: "507f1f77bcf86cd799439021", name: "Formação DJ" },
  unitId: { id: "507f1f77bcf86cd799439022", label: "Porto Alegre" },
  professorId: { id: professor.id, name: professor.name },
  equipmentId: { id: "507f1f77bcf86cd799439023", name: "Setup principal" },
  studentIds: [],
  lessonCount: 5,
  durationMinutes: 90,
  status: "ativa",
  progress: { completed: 1, total: 5, percent: 20 },
};

const portalEvent = {
  id: "507f1f77bcf86cd799439024",
  title: "DJ ON Open Air",
  date: "2026-09-20",
  time: "16:00",
  location: "Cais Embarcadero",
  type: "djOn",
  createdBy: admin.id,
  createdByName: "DJ ON Academy",
};

async function mockPortalHero(
  page: Page,
  onUpdate: (key: HeroKey, payload: HeroPayload) => void,
  authenticatedUser: typeof professor = professor,
) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-e2e");
  });
  await page.context().route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "");

    if (path === "/users/me") {
      await route.fulfill({ json: authenticatedUser });
      return;
    }
    if (path.startsWith("/portal-content/")) {
      const key = path.slice("/portal-content/".length) as HeroKey;
      const hero = heroes[key];
      if (hero) {
        if (request.method() === "PATCH") {
          const payload = request.postDataJSON() as HeroPayload;
          onUpdate(key, payload);
          await route.fulfill({ json: { ...hero, ...payload } });
          return;
        }
        await route.fulfill({ json: hero });
        return;
      }
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [authenticatedUser], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/events") {
      await route.fulfill({
        json: { items: [portalEvent], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/bookings" || path === "/materials") {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    if (path === "/courses/cohorts") {
      await route.fulfill({ json: [cohort] });
      return;
    }
    if (path === "/courses") {
      await route.fulfill({ json: [] });
      return;
    }
    if (
      path === "/materials/categories" ||
      path === "/notifications" ||
      path === "/units" ||
      path === "/equipments"
    ) {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

test("edita as seções da home com um único banner", async ({ page }) => {
  const saved: Array<{ key: HeroKey; payload: HeroPayload }> = [];
  await mockPortalHero(page, (key, payload) => {
    saved.push({ key, payload });
  });

  await page.goto("/dashboard/professor");
  const editButton = page.getByRole("button", { name: "EDITAR", exact: true });
  await expect(editButton).toHaveClass(/\bmt-5\b/);
  await expect(editButton).not.toHaveClass(/\babsolute\b/);
  await expect(editButton).toHaveClass(/bg-djon-black\/40/);
  await expect(editButton).toHaveCSS("opacity", "0.75");
  await editButton.hover();
  await expect(editButton).toHaveCSS("opacity", "1");
  await expect(page.locator(".djon-portal-hero img").first()).toHaveAttribute(
    "src",
    /djon-showcase\.png/,
  );
  await expect(
    page.getByText(
      "Conduza suas turmas, acompanhe seus alunos e compartilhe sua experiência com a próxima geração de DJs.",
      { exact: true },
    ),
  ).toBeVisible();
  await editButton.click();

  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveClass(
    /bg-djon-black\/85/,
  );
  await expect(page.getByText("Recomendado: 1920 × 720 px")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Aluno" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Professor" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("LABEL")).toHaveValue("Professor");

  await page.getByLabel("LABEL").fill("ÁREA DO PROFESSOR");
  await page.getByRole("tab", { name: "Aluno" }).click();
  await page.getByLabel("LABEL").fill("ÁREA DO ALUNO");
  await page.getByRole("button", { name: "REMOVER BANNER" }).click();
  await expect(page.getByText("FUNDO PRETO")).toBeVisible();
  await page.getByRole("button", { name: "SALVAR ALTERAÇÕES" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  expect(saved).toHaveLength(3);
  expect(saved.find(({ key }) => key === "student-home")?.payload).toMatchObject({
    label: "ÁREA DO ALUNO",
  });
  expect(
    saved.find(({ key }) => key === "professor-home")?.payload,
  ).toMatchObject({ label: "ÁREA DO PROFESSOR" });
  expect(saved.find(({ key }) => key === "admin-home")?.payload).toMatchObject({
    banner: null,
  });
  expect(
    Object.hasOwn(
      saved.find(({ key }) => key === "professor-home")?.payload ?? {},
      "banner",
    ),
  ).toBe(false);
  await expect(
    page.getByText("ÁREA DO PROFESSOR", { exact: true }),
  ).toBeVisible();
});

test("professor vê hero de turmas com o banner configurado pelo aluno", async ({
  page,
}) => {
  await mockPortalHero(page, () => undefined);

  await page.goto("/dashboard/turmas");

  await expect(
    page.getByText("TURMAS DA EQUIPE", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".djon-portal-hero img").first()).toHaveAttribute(
    "src",
    /djon-hero\.png/,
  );
  await expect(
    page.getByRole("heading", { name: "Turmas", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("searchbox", { name: "Buscar turmas" })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Filtrar turmas por status" }),
  ).toBeVisible();
  await expect(page.getByText("Turma 1.0", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar turmas" }).fill("inexistente");
  await expect(page.getByText("Turma 1.0", { exact: true })).toBeHidden();
  await expect(
    page.getByText("Nenhuma turma corresponde aos filtros.", { exact: true }),
  ).toBeVisible();
});

test("eventos do professor herdam o banner do mural e expõem todas as seções", async ({
  page,
}) => {
  await mockPortalHero(page, () => undefined);

  await page.goto("/dashboard/professor/evento");

  await expect(
    page.getByText("EVENTOS DO PROFESSOR", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".djon-portal-hero img").first()).toHaveAttribute(
    "src",
    /mural-hero\.png/,
  );
  await page.getByRole("button", { name: "EDITAR", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Mural" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Aluno" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Professor" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Administração" })).toBeVisible();
});

test("administração de eventos também apresenta o hero do grupo", async ({
  page,
}) => {
  await mockPortalHero(page, () => undefined, admin);

  await page.goto("/dashboard/admin/eventos");

  await expect(
    page.getByText("EVENTOS DA ADMINISTRAÇÃO", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".djon-portal-hero img").first()).toHaveAttribute(
    "src",
    /mural-hero\.png/,
  );
  await expect(
    page.getByRole("heading", { name: "Gerenciar eventos", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "EVENTOS DJ ON" })).toBeVisible();
  await expect(page.getByRole("button", { name: "NOVO EVENTO" })).toBeVisible();
  await expect(page.getByText("DJ ON Open Air", { exact: true })).toBeVisible();
});

test("agenda do aluno herda o banner do início e não permite edição", async ({
  page,
}) => {
  await mockPortalHero(page, () => undefined, student);

  await page.goto("/dashboard/student/agendar");

  await expect(page.getByText("AGENDA DO ALUNO", { exact: true })).toBeVisible();
  await expect(page.locator(".djon-portal-hero img").first()).toHaveAttribute(
    "src",
    /djon-showcase\.png/,
  );
  await expect(
    page.getByRole("button", { name: "EDITAR", exact: true }),
  ).toHaveCount(0);
});
