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
}: SplineSceneProps) {
  const [ready, setReady] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const [isIOS, setIsIOS] = useState<boolean | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sceneUrl = useMemo(() => {
    if (!bustCache) return scene

    const separator = scene.includes("?") ? "&" : "?"
    return `${scene}${separator}v=${Date.now()}`
  }, [bustCache, scene])
  const sceneKey = sceneUrl

  useEffect(() => {
    const ua = window.navigator.userAgent
    const platform = window.navigator.platform
    const maxTouchPoints = window.navigator.maxTouchPoints || 0
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1))
  }, [])

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
    [onLoad, revealDelay, transparent],
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
        {shouldLoad && isIOS === false && (
          <Spline
            key={sceneKey}
            scene={sceneUrl}
            onLoad={handleLoad}
            renderOnDemand={false}
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
