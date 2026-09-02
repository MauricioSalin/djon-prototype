"use client"

import type { CSSProperties } from "react"
import { useEffect, useRef, useState } from "react"
import type { Application } from "@splinetool/runtime"
import { createSplineRuntimeSession } from "@/lib/spline-runtime-session"

function isMemorySensitiveDevice() {
  const { userAgent, platform, maxTouchPoints } = window.navigator
  return /iPad|iPhone|iPod/.test(userAgent)
    || (platform === "MacIntel" && maxTouchPoints > 1)
    || window.matchMedia("(pointer: coarse)").matches
}

type SplineSceneProps = {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (spline: Application) => void
  transparent?: boolean
  revealDelay?: number
  lazyThreshold?: number
  globalEvents?: boolean
  rotationObject?: string
  rotationSpeed?: number
}

export function SplineScene({
  scene,
  className,
  style,
  onLoad,
  transparent = true,
  revealDelay = 650,
  lazyThreshold = 0.12,
  globalEvents = false,
  rotationObject,
  rotationSpeed = 0.45,
}: SplineSceneProps) {
  const [{ active: visible, version }, setVisibility] = useState({ active: false, version: 0 })
  const [state, setState] = useState<{
    version: number; scene: string; status: "loading" | "ready" | "error"
  }>({ version: -1, scene: "", status: "loading" })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const onLoadRef = useRef(onLoad)
  const sessionRef = useRef<ReturnType<typeof createSplineRuntimeSession> | null>(null)

  useEffect(() => { onLoadRef.current = onLoad }, [onLoad])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    let intersecting = false
    let pageActive = true
    const updateVisibility = () => {
      const active = intersecting && pageActive && !document.hidden
      // A hiding/freezing page must release resources before React gets another turn.
      if (!active) sessionRef.current?.dispose()
      setVisibility((previous) => previous.active === active
        ? previous
        : { active, version: previous.version + 1 })
    }
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting && entry.intersectionRatio > 0
      updateVisibility()
    }, { rootMargin: "0px", threshold: [0, lazyThreshold] })
    const hide = () => { pageActive = false; updateVisibility() }
    const show = () => { pageActive = true; updateVisibility() }

    observer.observe(element)
    document.addEventListener("visibilitychange", updateVisibility)
    window.addEventListener("pagehide", hide)
    window.addEventListener("pageshow", show)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", updateVisibility)
      window.removeEventListener("pagehide", hide)
      window.removeEventListener("pageshow", show)
    }
  }, [lazyThreshold])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!visible || !surface) return

    setState({ version, scene, status: "loading" })
    const exclusive = isMemorySensitiveDevice()
    // Preserve the authored layout frame: Spline uses it to frame the camera.
    // The section's CSS transform already scales the complete scene for mobile.
    const canvas = document.createElement("canvas")
    Object.assign(canvas.style, {
      display: "block", width: "100%", height: "100%",
      background: transparent ? "transparent" : undefined,
      opacity: "0", transition: "opacity 350ms ease",
    })
    surface.appendChild(canvas)
    let revealTimer: ReturnType<typeof setTimeout> | undefined
    let revealFrame = 0
    let rotationFrame = 0

    const session = createSplineRuntimeSession({
      canvas,
      scene,
      exclusive,
      onError: (error) => {
        console.error("[Spline] Scene lifecycle failed", scene, error)
        if (!session.signal.aborted) setState({ version, scene, status: "error" })
      },
      onLoad: (application) => {
        application.setGlobalEvents(globalEvents)
        if (transparent) application.setBackgroundColor("transparent")
        revealFrame = requestAnimationFrame(() => {
          if (session.signal.aborted) return
          revealTimer = setTimeout(() => {
            if (session.signal.aborted) return
            canvas.style.opacity = "1"
            setState({ version, scene, status: "ready" })
            onLoadRef.current?.(application)
          }, revealDelay)
        })

        const object = rotationObject ? application.findObjectByName(rotationObject) : null
        if (object) {
          let previousTime = performance.now()
          const rotate = (time: number) => {
            if (session.signal.aborted) return
            object.rotation.y += rotationSpeed * Math.min((time - previousTime) / 1000, 0.05)
            previousTime = time
            application.requestRender()
            rotationFrame = requestAnimationFrame(rotate)
          }
          rotationFrame = requestAnimationFrame(rotate)
        }
      },
    })
    sessionRef.current = session

    return () => {
      clearTimeout(revealTimer)
      cancelAnimationFrame(revealFrame)
      cancelAnimationFrame(rotationFrame)
      session.dispose()
      if (sessionRef.current === session) sessionRef.current = null
    }
  }, [globalEvents, revealDelay, rotationObject, rotationSpeed, scene, transparent, version, visible])

  return (
    <div
      ref={wrapperRef}
      data-spline-scene={scene}
      data-spline-state={!visible ? "idle" : state.version === version && state.scene === scene ? state.status : "loading"}
      className={className}
      style={{ ...style, background: "transparent" }}
    >
      <div ref={surfaceRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
