"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Application } from "@splinetool/runtime"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

const DESKTOP_LOAD_MARGIN = 220
const DESKTOP_PREFETCH_MARGIN = "600px 0px"
const scenePrefetches = new Map<string, Promise<boolean>>()

type NetworkInformation = {
  effectiveType?: string
  saveData?: boolean
}

function isMemorySensitiveDevice() {
  const ua = window.navigator.userAgent
  const platform = window.navigator.platform
  const maxTouchPoints = window.navigator.maxTouchPoints || 0
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1)
  const isSmallTouchDevice = window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches

  return isIOS || isSmallTouchDevice
}

function prefetchScene(scene: string) {
  const existingPrefetch = scenePrefetches.get(scene)
  if (existingPrefetch) return existingPrefetch

  const prefetch = fetch(scene, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to prefetch Spline scene: ${response.status}`)
      return response.arrayBuffer()
    })
    .then(() => true)
    .catch(() => {
      scenePrefetches.delete(scene)
      return false
    })

  scenePrefetches.set(scene, prefetch)
  return prefetch
}

type SplineSceneProps = {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (spline: Application) => void
  transparent?: boolean
  revealDelay?: number
  lazy?: boolean
  lazyThreshold?: number
  unloadWhenHidden?: boolean
  globalEvents?: boolean
  preloadOnIdle?: boolean
  preloadIdleTimeout?: number
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
  lazy = true,
  lazyThreshold = 0.12,
  unloadWhenHidden = true,
  globalEvents = false,
  preloadOnIdle = false,
  preloadIdleTimeout = 2500,
  rotationObject,
  rotationSpeed = 0.45,
}: SplineSceneProps) {
  const [ready, setReady] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const [isMemorySensitive, setIsMemorySensitive] = useState(false)
  const [isVisible, setIsVisible] = useState(!lazy)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const splineRef = useRef<Application | null>(null)
  const hasEnteredLoadZoneRef = useRef(!lazy)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sceneKey = scene

  useEffect(() => {
    setIsMemorySensitive(isMemorySensitiveDevice())
  }, [])

  useEffect(() => {
    setReady(false)
    splineRef.current = null
    hasEnteredLoadZoneRef.current = !lazy
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [lazy, sceneKey])

  useEffect(() => {
    if (!lazy) {
      setShouldLoad(true)
      return
    }

    const element = wrapperRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)

        if (entry.isIntersecting) {
          hasEnteredLoadZoneRef.current = true
          setShouldLoad(true)
        }
      },
      { rootMargin: isMemorySensitive ? "80px 0px" : "220px 0px", threshold: lazyThreshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isMemorySensitive, lazy, lazyThreshold])

  useEffect(() => {
    if (!lazy || shouldLoad || isMemorySensitive || isMemorySensitiveDevice()) return

    const connection = (
      window.navigator as Navigator & {
        connection?: NetworkInformation
      }
    ).connection
    if (connection?.saveData || connection?.effectiveType?.includes("2g")) return

    const element = wrapperRef.current
    if (!element) return

    let cancelled = false
    let fetchIdleCallback: number | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const rect = element.getBoundingClientRect()
        const isAlreadyInLoadZone =
          rect.bottom >= -DESKTOP_LOAD_MARGIN && rect.top <= window.innerHeight + DESKTOP_LOAD_MARGIN
        if (isAlreadyInLoadZone) return

        fetchIdleCallback = window.requestIdleCallback(
          () => {
            if (!cancelled && !hasEnteredLoadZoneRef.current) void prefetchScene(scene)
          },
          { timeout: 1500 },
        )
      },
      { rootMargin: DESKTOP_PREFETCH_MARGIN, threshold: 0 },
    )

    observer.observe(element)
    return () => {
      cancelled = true
      observer.disconnect()
      if (fetchIdleCallback !== null) window.cancelIdleCallback(fetchIdleCallback)
    }
  }, [isMemorySensitive, lazy, scene, shouldLoad])

  useEffect(() => {
    if (!preloadOnIdle || !lazy || shouldLoad || isMemorySensitive) return
    if (hasEnteredLoadZoneRef.current) return

    const loadScene = () => setShouldLoad(true)
    const idleCallback = window.requestIdleCallback(loadScene, { timeout: preloadIdleTimeout })
    return () => window.cancelIdleCallback(idleCallback)
  }, [isMemorySensitive, lazy, preloadIdleTimeout, preloadOnIdle, shouldLoad])

  useEffect(() => {
    const spline = splineRef.current
    if (!spline) return

    if (isVisible) {
      spline.play()
    } else if (!preloadOnIdle || hasEnteredLoadZoneRef.current) {
      spline.stop()
    }

    if (!isVisible || !rotationObject) return

    const object = spline.findObjectByName(rotationObject)
    if (!object) return

    let previousTime = performance.now()
    let animationFrame = 0
    const rotate = (currentTime: number) => {
      const elapsedSeconds = Math.min((currentTime - previousTime) / 1000, 0.05)
      previousTime = currentTime
      object.rotation.y += rotationSpeed * elapsedSeconds
      animationFrame = requestAnimationFrame(rotate)
    }

    animationFrame = requestAnimationFrame(rotate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isVisible, preloadOnIdle, ready, rotationObject, rotationSpeed])

  useEffect(() => {
    if (!unloadWhenHidden || isVisible || !shouldLoad) return
    if (preloadOnIdle && !hasEnteredLoadZoneRef.current) return
    const timeout = window.setTimeout(() => {
      splineRef.current?.stop()
      splineRef.current = null
      setReady(false)
      setShouldLoad(false)
    }, isMemorySensitive ? 900 : 3200)

    return () => window.clearTimeout(timeout)
  }, [isMemorySensitive, isVisible, preloadOnIdle, shouldLoad, unloadWhenHidden])

  const handleLoad = useCallback(
    (spline: Application) => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)

      splineRef.current = spline
      spline.setGlobalEvents(globalEvents)

      if (!isVisible && (!preloadOnIdle || hasEnteredLoadZoneRef.current)) spline.stop()

      if (transparent) {
        spline.canvas.style.background = "transparent"
        spline.canvas.style.backgroundColor = "transparent"

        requestAnimationFrame(() => {
          spline.canvas.style.background = "transparent"
          spline.canvas.style.backgroundColor = "transparent"
        })
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          spline.canvas.style.background = "transparent"
          spline.canvas.style.backgroundColor = "transparent"
          window.dispatchEvent(new Event("resize"))

          revealTimeoutRef.current = setTimeout(() => {
            setReady(true)
            onLoad?.(spline)
          }, revealDelay)
        })
      })
    },
    [globalEvents, isVisible, onLoad, preloadOnIdle, revealDelay, transparent],
  )

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        ...style,
        background: "transparent",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {shouldLoad && (
          <Spline
            key={sceneKey}
            scene={scene}
            onLoad={handleLoad}
            renderOnDemand
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              opacity: ready ? 1 : 0,
              transition: "opacity 350ms ease",
            }}
          />
        )}
      </div>
    </div>
  )
}
