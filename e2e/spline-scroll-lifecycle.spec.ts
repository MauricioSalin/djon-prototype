import { expect, test, type Page } from "@playwright/test"

const HERO = "aToMIxq-essPCx39"
const SHOWCASE = "AUAj4HtJL15gKfTA"
const TEAM = "OduYuH7Y3CXDo9Ga"
type Audit = { contexts: (WebGLRenderingContext | WebGL2RenderingContext)[]; peak: number }

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const audit: Audit = { contexts: [], peak: 0 }
    Object.assign(window, { splineAudit: audit })
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: unknown) {
      const result = original.call(this, kind, options)
      if ((kind === "webgl" || kind === "webgl2") && result && this.closest("[data-spline-scene]")) {
        const context = result as WebGLRenderingContext | WebGL2RenderingContext
        if (!audit.contexts.includes(context)) audit.contexts.push(context)
        audit.peak = Math.max(audit.peak, audit.contexts.filter((item) => !item.isContextLost()).length)
      }
      return result
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: [] }))
}

async function metrics(page: Page) {
  return page.evaluate(() => {
    const audit = (window as unknown as { splineAudit: Audit }).splineAudit
    return {
      created: audit.contexts.length,
      live: audit.contexts.filter((item) => !item.isContextLost()).length,
      peak: audit.peak,
    }
  })
}

const scene = (page: Page, id: string) => page.locator(`[data-spline-scene*="${id}"]:visible`)

async function scrollToScene(page: Page, id: string) {
  const target = scene(page, id)
  const viewportHeight = page.viewportSize()!.height
  let stableSamples = 0
  let previousCenter: number | null = null
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const box = await target.boundingBox()
    if (box) {
      const center = box.y + box.height / 2
      const visibleHeight = Math.max(
        0,
        Math.min(box.y + box.height, viewportHeight) - Math.max(box.y, 0),
      )
      if (visibleHeight / box.height >= 0.5) {
        stableSamples = previousCenter !== null && Math.abs(center - previousCenter) < 2
          ? stableSamples + 1
          : 0
        previousCenter = center
        if (stableSamples >= 5) break
        await page.waitForTimeout(100)
        continue
      }
      stableSamples = 0
      previousCenter = center
      const distance = center - viewportHeight / 2
      await page.mouse.wheel(0, Math.sign(distance) * Math.min(700, Math.max(120, Math.abs(distance))))
    }
    await page.waitForTimeout(100)
  }
  await expect(scene(page, id)).toBeInViewport({ ratio: 0.5 })
}

async function waitReady(page: Page, id: string) {
  try {
    await expect(scene(page, id)).toHaveAttribute("data-spline-state", "ready", { timeout: 45_000 })
  } catch (error) {
    const phase = await scene(page, id).getAttribute("data-spline-phase").catch(() => null)
    throw new Error(`Spline ${id} stopped at phase ${phase ?? "unknown"}`, { cause: error })
  }
  await expect(scene(page, id).locator("canvas")).toBeVisible()
  await expect(scene(page, id).locator("canvas")).toHaveCSS("opacity", "1")
  await expect(scene(page, id).locator("..")).toHaveCSS("opacity", "1", { timeout: 30_000 })
  const frame = await scene(page, id).evaluate((element) => {
    const canvas = element.querySelector("canvas")!
    return {
      width: element.clientWidth, height: element.clientHeight,
      canvasWidth: canvas.clientWidth, canvasHeight: canvas.clientHeight,
      bitmapPixels: canvas.width * canvas.height,
    }
  })
  // CSS may scale the section, but changing Spline's layout frame changes its camera.
  expect(frame.canvasWidth).toBe(frame.width)
  expect(frame.canvasHeight).toBe(frame.height)
  if (page.viewportSize()!.width < 500) {
    expect(frame.bitmapPixels).toBeLessThanOrEqual(1_500_000)
  }
}

  test.describe("Spline scroll lifecycle - iPhone", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
      hasTouch: true,
      isMobile: true,
    })

    test("automatically reloads on reverse scroll with at most one live WebGL scene", async ({ page }, testInfo) => {
      // Six bounded scene loads plus real Lenis scrolling can exceed the sum
      // of the individual 45 s guards on a software-rendered CI GPU.
      test.setTimeout(300_000)
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("console", (message) => {
        if (message.type() === "error" && message.text().includes("[Spline]")) errors.push(message.text())
      })
      await instrument(page)
      await page.goto("/", { waitUntil: "domcontentloaded" })
      await waitReady(page, HERO)
      await expect(page.getByRole("button", { name: /ATIVAR.*3D/ })).toHaveCount(0)

      for (const id of [SHOWCASE, TEAM, SHOWCASE, HERO]) {
        await scrollToScene(page, id)
        await waitReady(page, id)
        await expect.poll(async () => (await metrics(page)).live).toBe(1)
        expect((await metrics(page)).peak).toBe(1)
        await page.screenshot({ path: testInfo.outputPath(`${id}.png`) })
      }
      await page.locator("#cursos").scrollIntoViewIfNeeded()
      await expect.poll(async () => (await metrics(page)).live).toBe(0)
      await expect(page.locator("[data-spline-scene] canvas")).toHaveCount(0)

      await scrollToScene(page, HERO)
      await waitReady(page, HERO)
      const result = await metrics(page)
      expect(result.created).toBeGreaterThanOrEqual(6)
      expect(result.peak).toBe(1)
      expect(errors).toEqual([])
      await testInfo.attach("webgl-lifecycle", { body: JSON.stringify(result), contentType: "application/json" })
      await page.screenshot({ path: testInfo.outputPath("hero-return.png") })
    })

    test("cancels an offscreen download and resumes after pagehide/pageshow", async ({ page }) => {
      test.setTimeout(120_000)
      await instrument(page)
      let requests = 0
      let releaseResponse!: () => void
      const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve })
      await page.route(`https://prod.spline.design/${HERO}/**`, async (route) => {
        requests += 1
        if (requests === 1) await responseGate
        await route.continue().catch(() => {})
      })
      try {
        await page.goto("/", { waitUntil: "domcontentloaded" })
        await expect.poll(() => requests).toBe(1)
        await page.locator("#cursos").scrollIntoViewIfNeeded()
        await expect(page.locator("#hero canvas")).toHaveCount(0)
        releaseResponse()
        expect((await metrics(page)).live).toBe(0)

        await scrollToScene(page, HERO)
        await waitReady(page, HERO)
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })))
        await expect.poll(async () => (await metrics(page)).live).toBe(0)
        await expect(page.locator("[data-spline-scene] canvas")).toHaveCount(0)
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })))
        await waitReady(page, HERO)
        expect((await metrics(page)).peak).toBe(1)
      } finally {
        releaseResponse()
      }
    })

    test("brand also loads only the visible scene and reloads its rotating scene", async ({ page }) => {
      test.setTimeout(150_000)
      const rotatingScene = "mZzZrAV9qXxQ452n"
      let rotatingRequests = 0
      await instrument(page)
      page.on("request", (request) => {
        if (request.url().includes(rotatingScene)) rotatingRequests += 1
      })
      await page.goto("/brand", { waitUntil: "domcontentloaded" })
      await expect(scene(page, rotatingScene)).toHaveAttribute("data-spline-state", "idle")
      expect(rotatingRequests).toBe(0)
      await scrollToScene(page, rotatingScene)
      await waitReady(page, rotatingScene)
      await scrollToScene(page, "SPNH95ca1bV6ceH1")
      await waitReady(page, "SPNH95ca1bV6ceH1")
      await scrollToScene(page, rotatingScene)
      await waitReady(page, rotatingScene)
      expect(rotatingRequests).toBeGreaterThanOrEqual(2)
      expect((await metrics(page)).peak).toBe(1)
    })
  })

test("Spline desktop still opens automatically and releases offscreen contexts", async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await instrument(page)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await waitReady(page, HERO)
  await page.locator("#cursos").scrollIntoViewIfNeeded()
  await expect.poll(async () => (await metrics(page)).live).toBe(0)
  await scrollToScene(page, HERO)
  await waitReady(page, HERO)
  expect((await metrics(page)).live).toBe(1)
})
