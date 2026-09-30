import type { Application } from "@splinetool/runtime"

type RuntimeModule = Pick<typeof import("@splinetool/runtime"), "Application">

export type SplineRuntimePhase =
  | "queued"
  | "slot-acquired"
  | "fetching"
  | "buffered"
  | "runtime-loaded"
  | "application-created"
  | "starting"
  | "started"
  | "aborted"

// Hold the mobile slot until cancelled decoding finishes and its runtime is disposed.
export function createSplineSlotQueue() {
  let tail = Promise.resolve()
  return async (signal: AbortSignal) => {
    let release!: () => void
    const occupied = new Promise<void>((resolve) => { release = resolve })
    const previous = tail
    tail = previous.then(() => occupied)
    await previous
    if (signal.aborted) {
      release()
      return null
    }
    return release
  }
}

const acquireMobileSlot = createSplineSlotQueue()

type SessionOptions = {
  canvas: HTMLCanvasElement
  scene: string
  exclusive: boolean
  onLoad: (application: Application) => void
  onError: (error: unknown) => void
  onPhase?: (phase: SplineRuntimePhase) => void
  maxDevicePixelRatio?: number
  loadRuntime?: () => Promise<RuntimeModule>
  fetchScene?: typeof fetch
}

export function createSplineRuntimeSession({
  canvas,
  scene,
  exclusive,
  onLoad,
  onError,
  onPhase = () => undefined,
  maxDevicePixelRatio,
  loadRuntime = () => import("@splinetool/runtime"),
  fetchScene = fetch,
}: SessionOptions) {
  const controller = new AbortController()
  const { signal } = controller
  let application: Application | null = null
  let releaseSlot: (() => void) | null = null
  let loading = true
  let cleaned = false
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null
  const originalGetContext = canvas.getContext

  // Guard only this canvas. Capture the existing context; never create one to dispose it.
  canvas.getContext = ((kind: string, options?: unknown) => {
    if (signal.aborted) return null
    const result = originalGetContext.call(canvas, kind, options)
    if (kind === "webgl" || kind === "webgl2" || kind === "experimental-webgl") {
      context = result as WebGLRenderingContext | WebGL2RenderingContext | null
    }
    return result
  }) as typeof canvas.getContext

  const releaseContext = () => {
    if (context && !context.isContextLost()) {
      context.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }

  const releaseExclusiveSlot = () => {
    releaseSlot?.()
    releaseSlot = null
  }

  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    try {
      application?.dispose()
    } catch (error) {
      onError(error)
    } finally {
      application = null
      releaseContext()
      context = null
      canvas.width = 1
      canvas.height = 1
      canvas.remove()
      canvas.getContext = originalGetContext
      releaseExclusiveSlot()
    }
  }

  const settled = (async () => {
    onPhase("queued")
    if (exclusive) releaseSlot = await acquireMobileSlot(signal)
    if (signal.aborted) return
    onPhase("slot-acquired")
    // Cancelled downloads allocate no Application or GPU resources.
    onPhase("fetching")
    const response = await fetchScene(scene, { signal, cache: "force-cache" })
    if (!response.ok) throw new Error(`Unable to load Spline scene: ${response.status}`)
    let data: ArrayBuffer | null = await response.arrayBuffer()
    if (signal.aborted) return
    onPhase("buffered")
    const runtime = await loadRuntime()
    if (signal.aborted) return
    onPhase("runtime-loaded")
    application = new runtime.Application(canvas, { renderMode: "auto" })
    onPhase("application-created")
    // Runtime 1.12.98 start() is async, although its declaration returns void.
    onPhase("starting")
    const shouldClampPixelRatio = maxDevicePixelRatio !== undefined
      && typeof window !== "undefined"
      && window.devicePixelRatio > maxDevicePixelRatio
    const originalPixelRatio = shouldClampPixelRatio
      ? Object.getOwnPropertyDescriptor(window, "devicePixelRatio")
      : undefined
    if (shouldClampPixelRatio) {
      Object.defineProperty(window, "devicePixelRatio", {
        configurable: true,
        value: maxDevicePixelRatio,
      })
    }
    try {
      const starting = application.start(data)
      data = null
      await starting
    } finally {
      if (shouldClampPixelRatio) {
        if (originalPixelRatio) {
          Object.defineProperty(window, "devicePixelRatio", originalPixelRatio)
        } else {
          Reflect.deleteProperty(window, "devicePixelRatio")
        }
      }
    }
    onPhase("started")
    if (!signal.aborted) onLoad(application)
  })().catch((error: unknown) => {
    if (!signal.aborted) onError(error)
    controller.abort()
  }).finally(() => {
    loading = false
    if (signal.aborted) cleanup()
  })

  return {
    signal,
    settled,
    dispose() {
      if (signal.aborted) return
      controller.abort()
      onPhase("aborted")
      try {
        application?.stop()
      } catch (error) {
        onError(error)
      } finally {
        // Release GPU resources now; late decode callbacks cannot revive this canvas.
        releaseContext()
        canvas.remove()
        // Once the context is synchronously lost, a decoder that ignores abort
        // can no longer consume the exclusive GPU slot or block the next scene.
        releaseExclusiveSlot()
        if (!loading) cleanup()
      }
    },
  }
}
