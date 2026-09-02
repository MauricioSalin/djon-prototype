import { defineConfig, devices } from "@playwright/test"
import base from "./playwright.config"

export default defineConfig({
  ...base,
  projects: [
    { name: "lifecycle-unit", testMatch: "**/spline-runtime-session.spec.ts" },
    {
      name: "chromium",
      testMatch: "**/spline-scroll-lifecycle.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      testMatch: "**/spline-scroll-lifecycle.spec.ts",
      use: { ...devices["Desktop Safari"] },
    },
  ],
})
