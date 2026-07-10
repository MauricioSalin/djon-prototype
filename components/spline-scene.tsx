"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Application } from "@splinetool/runtime"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

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
}: SplineSceneProps) {
  const [ready, setReady] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const [isMemorySensitive, setIsMemorySensitive] = useState(false)
  const [isVisible, setIsVisible] = useState(!lazy)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sceneKey = scene

  useEffect(() => {
    const ua = window.navigator.userAgent
    const platform = window.navigator.platform
    const maxTouchPoints = window.navigator.maxTouchPoints || 0
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1)
    const isSmallTouchDevice = window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches

    setIsMemorySensitive(isIOS || isSmallTouchDevice)
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
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)

        if (entry.isIntersecting) {
          setShouldLoad(true)
        }
      },
      { rootMargin: isMemorySensitive ? "80px 0px" : "220px 0px", threshold: lazyThreshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isMemorySensitive, lazy, lazyThreshold])

  useEffect(() => {
    if (!unloadWhenHidden || !isMemorySensitive || isVisible) return

    const timeout = window.setTimeout(() => {
      setReady(false)
      setShouldLoad(false)
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [isMemorySensitive, isVisible, unloadWhenHidden])

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
