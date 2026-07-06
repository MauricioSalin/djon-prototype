"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Application } from "@splinetool/runtime"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

type SplineSceneProps = {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (spline: Application) => void
  transparent?: boolean
  bustCache?: boolean
  revealDelay?: number
  lazy?: boolean
  lazyThreshold?: number
  globalEvents?: boolean
}

export function SplineScene({
  scene,
  className,
  style,
  onLoad,
  transparent = true,
  bustCache = true,
  revealDelay = 650,
  lazy = true,
  lazyThreshold = 0.12,
  globalEvents = true,
}: SplineSceneProps) {
  const [ready, setReady] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sceneKey = useMemo(() => (bustCache ? `${scene}-${Date.now()}` : scene), [bustCache, scene])

  useEffect(() => {
    setReady(false)
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [sceneKey])

  useEffect(() => {
    if (!lazy) {
      setShouldLoad(true)
      return
    }

    const element = wrapperRef.current
    if (!element || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { threshold: lazyThreshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [lazy, lazyThreshold, shouldLoad])

  const handleLoad = useCallback(
    (spline: Application) => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)

      if (globalEvents) {
        spline.setGlobalEvents(true)
      }

      spline.canvas.style.pointerEvents = "auto"
      spline.canvas.style.touchAction = "none"
      spline.canvas.style.overscrollBehavior = "contain"
      spline.canvas.style.userSelect = "none"

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
          spline.canvas.style.pointerEvents = "auto"
          spline.canvas.style.touchAction = "none"
          spline.canvas.style.overscrollBehavior = "contain"
          spline.canvas.style.userSelect = "none"
          window.dispatchEvent(new Event("resize"))

          revealTimeoutRef.current = setTimeout(() => {
            setReady(true)
            onLoad?.(spline)
          }, revealDelay)
        })
      })
    },
    [globalEvents, onLoad, revealDelay, transparent],
  )

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        ...style,
        background: "transparent",
        pointerEvents: "auto",
        touchAction: "none",
        overscrollBehavior: "contain",
        userSelect: "none",
      }}
    >
      {shouldLoad && (
        <Spline
          key={sceneKey}
          scene={scene}
          onLoad={handleLoad}
          renderOnDemand={false}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            touchAction: "none",
            overscrollBehavior: "contain",
            userSelect: "none",
            opacity: ready ? 1 : 0,
            transition: "opacity 350ms ease",
          }}
        />
      )}
    </div>
  )
}
