import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "507f1f77bcf86cd799439003",
  name: "Aluno Push",
  email: "aluno-push@teste.com",
  role: "student",
  permissions: [],
  unitId: {
    id: "507f1f77bcf86cd799439004",
    label: "Porto Alegre / RS",
    shortLabel: "POA",
  },
  active: true,
  createdAt: "2026-09-02T12:00:00.000Z",
};

async function mockPortal(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("djon_access_token", "token-push-alerts");
    window.sessionStorage.clear();
  });

  await page.context().route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    if (path === "/users/me") {
      await route.fulfill({ json: user });
      return;
    }
    if (path === "/notifications/push-subscriptions") {
      await route.fulfill({ json: { saved: true } });
      return;
    }
    if (path === "/users" || path.startsWith("/users?")) {
      await route.fulfill({
        json: { items: [user], total: 1, page: 1, limit: 100 },
      });
      return;
    }
    if (
      path === "/materials" ||
      path.startsWith("/materials?") ||
      path === "/events" ||
      path.startsWith("/events?") ||
      path === "/bookings" ||
      path.startsWith("/bookings?")
    ) {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, limit: 100 },
      });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

async function mockPushPlatform(
  page: Page,
  options: { userAgent: string; standalone: boolean },
) {
  await page.addInitScript(({ userAgent, standalone }) => {
    const audit = {
      permissionRequests: 0,
      readySubscriptions: 0,
      prematureSubscriptions: 0,
    };
    Object.assign(window, { __pushAudit: audit });

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get: () => userAgent,
    });
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      get: () => (userAgent.includes("iPhone") ? "iPhone" : "Linux armv8l"),
    });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get: () => standalone,
    });

    let permission: NotificationPermission = "granted";
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        get permission() {
          return permission;
        },
        async requestPermission() {
          audit.permissionRequests += 1;
          permission = "granted";
          return permission;
        },
      },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });

    let subscription: PushSubscription | null = null;
    const readyRegistration = {
      pushManager: {
        getSubscription: async () => subscription,
        subscribe: async () => {
          audit.readySubscriptions += 1;
          subscription = {
            endpoint: "https://web.push.apple.com/mock-device",
            options: { applicationServerKey: null },
            toJSON: () => ({
              endpoint: "https://web.push.apple.com/mock-device",
              keys: { p256dh: "mock-p256dh", auth: "mock-auth" },
            }),
            unsubscribe: async () => true,
          } as unknown as PushSubscription;
          return subscription;
        },
      },
    } as ServiceWorkerRegistration;
    const installingRegistration = {
      update: async () => undefined,
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => {
          audit.prematureSubscriptions += 1;
          throw new Error("service worker ainda não está ativo");
        },
      },
    } as unknown as ServiceWorkerRegistration;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: async () => installingRegistration,
        getRegistration: async () => readyRegistration,
        ready: Promise.resolve(readyRegistration),
      },
    });
  }, options);
}

async function openNotifications(page: Page) {
  await page.goto("/dashboard/student", { waitUntil: "domcontentloaded" });
  const bell = page.getByRole("button", { name: "Notificações" });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(bell).toHaveAttribute("aria-expanded", "true");
}

for (const platform of [
  {
    name: "iPhone instalado",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    standalone: true,
  },
  {
    name: "Android",
    userAgent:
      "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
    standalone: false,
  },
]) {
  test(`ativa alertas no ${platform.name} somente após o service worker ficar pronto`, async ({
    page,
  }) => {
    let subscriptionBody: unknown;
    await mockPushPlatform(page, platform);
    await mockPortal(page);
    await page.context().route(
      "**/api/v1/notifications/push-subscriptions",
      async (route) => {
        subscriptionBody = route.request().postDataJSON();
        await route.fulfill({ json: { saved: true } });
      },
    );

    await openNotifications(page);
    const activate = page.getByRole("button", {
      name: "ATIVAR ALERTAS NESTE DISPOSITIVO",
    });
    await expect(activate).toBeVisible();
    await activate.click();

    await expect(page.getByText("Alertas ativados")).toBeVisible();
    await expect(activate).toHaveCount(0);
    expect(subscriptionBody).toEqual({
      endpoint: "https://web.push.apple.com/mock-device",
      p256dh: "mock-p256dh",
      auth: "mock-auth",
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & {
              __pushAudit: {
                readySubscriptions: number;
                prematureSubscriptions: number;
              };
            }).__pushAudit,
        ),
      )
      .toEqual({
        permissionRequests: 0,
        readySubscriptions: 1,
        prematureSubscriptions: 0,
      });
  });
}

test("orienta a instalação antes de pedir alertas no Safari do iPhone", async ({
  page,
}) => {
  await mockPushPlatform(page, {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
    standalone: false,
  });
  await mockPortal(page);

  await openNotifications(page);
  const install = page.getByRole("button", {
    name: "INSTALE A PWA PARA ATIVAR ALERTAS",
  });
  await expect(install).toBeVisible();
  await install.click();

  await expect(page.getByText("Abra o DJ ON pela Tela de Início")).toBeVisible();
  await expect(
    page.getByText(/Compartilhar.*Adicionar à Tela de Início/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & {
          __pushAudit: { readySubscriptions: number };
        }).__pushAudit.readySubscriptions,
    ),
  ).toBe(0);
});
