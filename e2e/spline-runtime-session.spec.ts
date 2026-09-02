import { expect, test } from "@playwright/test"
import type { Application } from "@splinetool/runtime"
import { createSplineRuntimeSession } from "../lib/spline-runtime-session"

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

function fixture(startGate?: Promise<void>) {
  const events: string[] = []
  let lost = false
  const context = {
    isContextLost: () => lost,
    getExtension: () => ({ loseContext: () => { lost = true; events.push("lose-context") } }),
  }
  const canvas = {
    width: 820, height: 650,
    getContext: () => context,
    remove: () => events.push("remove-canvas"),
  } as unknown as HTMLCanvasElement
  class FakeApplication {
    constructor() { events.push("construct") }
    async start() {
      events.push("start")
      canvas.getContext("webgl2")
      await startGate
      events.push("started")
    }
    stop() { events.push("stop") }
    dispose() { events.push("dispose") }
  }
  const options = {
    canvas,
    scene: "https://prod.spline.design/test/scene.splinecode",
    exclusive: true,
    loadRuntime: async () => ({ Application: FakeApplication as unknown as typeof Application }),
    fetchScene: (async () => new Response(new Uint8Array([1]))) as typeof fetch,
    onLoad: () => { events.push("on-load") },
    onError: () => { events.push("error") },
  }
  return { options, events, canvas, isLost: () => lost }
}

test("Spline session releases GPU, runtime and canvas before the next scene", async () => {
  const first = fixture()
  const second = fixture()
  const a = createSplineRuntimeSession(first.options)
  const b = createSplineRuntimeSession(second.options)
  try {
    await a.settled
    expect(first.events).toContain("on-load")
    expect(second.events).not.toContain("construct")
    a.dispose()
    await b.settled
    expect(first.isLost()).toBe(true)
    expect(first.events.filter((event) => event === "dispose")).toHaveLength(1)
    expect(first.canvas.width).toBe(1)
    expect(first.canvas.height).toBe(1)
    expect(second.events).toContain("on-load")
  } finally {
    a.dispose()
    b.dispose()
    await Promise.all([a.settled, b.settled])
  }
})

test("Spline session cancels download without allocating a runtime", async () => {
  const f = fixture()
  const started = deferred()
  const session = createSplineRuntimeSession({
    ...f.options,
    fetchScene: (async (_url, options) => {
      started.resolve()
      return new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true })
      })
    }) as typeof fetch,
  })
  await started.promise
  session.dispose()
  await session.settled
  expect(session.signal.aborted).toBe(true)
  expect(f.events).not.toContain("construct")
  expect(f.events).not.toContain("on-load")
  expect(f.events).not.toContain("error")
})

test("Spline session waits for cancelled decoding and ignores stale callbacks", async () => {
  const gate = deferred()
  const first = fixture(gate.promise)
  const skipped = fixture()
  const next = fixture()
  const a = createSplineRuntimeSession(first.options)
  const b = createSplineRuntimeSession(skipped.options)
  const c = createSplineRuntimeSession(next.options)
  try {
    await expect.poll(() => first.events.includes("start")).toBe(true)
    a.dispose()
    b.dispose()
    expect(first.isLost()).toBe(true)
    expect(first.canvas.getContext("webgl2")).toBeNull()
    expect(first.events).not.toContain("dispose")
    expect(next.events).not.toContain("construct")
    gate.resolve()
    await Promise.all([a.settled, b.settled, c.settled])
    expect(first.events).not.toContain("on-load")
    expect(first.events).toContain("dispose")
    expect(skipped.events).not.toContain("construct")
    expect(next.events).toContain("on-load")
    expect(first.events).not.toContain("error")
  } finally {
    gate.resolve()
    a.dispose()
    b.dispose()
    c.dispose()
    await Promise.all([a.settled, b.settled, c.settled])
  }
})

test("Spline session releases its slot on failure and can load again", async () => {
  const failed = fixture()
  const retry = fixture()
  const a = createSplineRuntimeSession({
    ...failed.options,
    fetchScene: (async () => new Response(null, { status: 503 })) as typeof fetch,
  })
  const b = createSplineRuntimeSession(retry.options)
  try {
    await Promise.all([a.settled, b.settled])
    expect(failed.events).toContain("error")
    expect(failed.events).not.toContain("construct")
    expect(retry.events).toContain("on-load")
  } finally {
    a.dispose()
    b.dispose()
  }
})
