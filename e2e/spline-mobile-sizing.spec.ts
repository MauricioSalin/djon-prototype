import { expect, test } from "@playwright/test"

for (const width of [369, 390]) {
  test.describe(`Spline framing at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })

    test("preserves the authored frame when CSS scales the mobile headphones", async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      await page.route("**/api/v1/**", (route) => route.fulfill({ json: [] }))
      await page.goto("/", { waitUntil: "domcontentloaded" })
      const scene = page.locator('#hero [data-spline-scene]:visible')
      // Only spacing changed: move the existing frame down 32px (-24px -> 8px).
      await expect(scene.locator("../..")).toHaveCSS("margin-top", "8px")
      await expect(scene).toHaveAttribute("data-spline-state", "ready", { timeout: 60_000 })
      const canvas = scene.locator("canvas")
      await expect(canvas).toHaveCSS("opacity", "1")
      await expect(scene.locator("..")).toHaveCSS("opacity", "1", { timeout: 30_000 })
      await scene.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath("mobile-headphones.png") })

      // The Spline camera uses layout pixels for framing. Shrinking this frame
      // and enlarging the surface again crops/zooms the model on touch devices.
      await expect(canvas).toHaveCSS("width", "820px")
      await expect(canvas).toHaveCSS("height", "650px")
      const frame = await scene.boundingBox()
      const rendered = await canvas.boundingBox()
      expect(rendered!.width).toBeCloseTo(frame!.width, 0)
      expect(rendered!.height).toBeCloseTo(frame!.height, 0)
      expect(rendered!.width).toBeLessThan(450)
      await page.locator("#cursos").scrollIntoViewIfNeeded()
      await expect(page.locator("#hero canvas")).toHaveCount(0)
      await scene.scrollIntoViewIfNeeded()
      await expect(scene).toHaveAttribute("data-spline-state", "ready", { timeout: 60_000 })
      await expect(canvas).toHaveCSS("width", "820px")
    })
  })
}
