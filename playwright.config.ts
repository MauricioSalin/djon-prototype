import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3199);
const baseURL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${String(port)}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next dev --hostname 127.0.0.1 --port ${String(port)}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
