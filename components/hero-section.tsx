"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { SplineScene } from "@/components/spline-scene"
import { LandingEditButton } from "@/components/landing/landing-edit-button"
import { useLandingSection } from "@/components/landing/landing-content-provider"


export function HeroSection() {
  const { data, canEdit, edit } = useLandingSection("hero")
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hero3dEnabled, setHero3dEnabled] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [])

  const revealSpline = () => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    revealTimeoutRef.current = setTimeout(() => setSplineLoaded(true), 800)
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-djon-ink noise-overlay"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/djon-hero.png"
          alt="DJ ON Academy"
          fill
          className="hidden object-cover opacity-30 sm:block"
          sizes="100vw"
          quality={50}
          loading="lazy"
          fetchPriority="low"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/80 to-djon-black/40" />
      </div>



      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-12 w-full sm:px-6 lg:pt-24">
        <div className="grid lg:grid-cols-[5fr_7fr] gap-4 items-center">
          {/* Text Content */}
          <motion.div className="space-y-6 relative z-20">
            <div className="space-y-1 overflow-hidden">
              <motion.h1 className="djon-hero-title font-black">
                {data.title.split("\n").map((line, index) => (
                  <motion.span
                    key={`${index}:${line}`}
                    className={`block ${index === 0 ? "text-djon-text" : "text-djon-accent"}`}
                  >
                    {line}
                  </motion.span>
                ))}
              </motion.h1>
              <motion.p
                className="text-base md:text-lg text-djon-text/60 tracking-tight pt-3 max-w-md leading-relaxed"
              >
                {data.description}
              </motion.p>
            </div>

            <motion.div
              className="flex flex-wrap gap-3 pt-2"
            >
              <motion.a
                href="#contato"
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-djon-accent px-7 py-3 text-sm font-black tracking-widest text-djon-ink group sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">DESBLOQUEAR</span>
                <motion.svg
                  className="w-4 h-4 relative z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </motion.a>
              <motion.button
                className="relative w-full cursor-pointer overflow-hidden rounded-full border-2 border-djon-text/30 px-7 py-3 text-sm font-black tracking-widest text-djon-text transition-[filter] hover:brightness-110 sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                onClick={() => {
                  const el = document.querySelector("#cursos")
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }}
              >
                VER CURSOS
              </motion.button>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-4 pt-2"
            >
              {data.tags.map((benefit) => (
                <motion.div
                  key={benefit}
                  className="flex items-center gap-2 text-xs text-djon-text/50"
                >
                  <div className="w-1.5 h-1.5 bg-djon-accent rounded-full" />
                  {benefit}
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="relative !-mt-6 h-[300px] w-full overflow-visible min-[390px]:h-[330px] sm:!-mt-4 sm:h-[390px] lg:hidden"
            >
              {!splineLoaded ? (
                <button
                  type="button"
                  disabled={hero3dEnabled}
                  onClick={() => setHero3dEnabled(true)}
                  className="absolute left-1/2 top-1/2 z-10 min-h-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-djon-accent/45 bg-djon-black/75 px-5 text-[10px] font-black tracking-[0.18em] text-djon-accent backdrop-blur-sm transition-opacity hover:opacity-80 disabled:cursor-wait"
                >
                  {hero3dEnabled ? "CARREGANDO 3D..." : "ATIVAR EXPERIÊNCIA 3D"}
                </button>
              ) : null}
              {hero3dEnabled ? (
                <motion.div
                  className="absolute left-1/2 top-[40%] h-[650px] w-[820px] -translate-x-1/2 -translate-y-1/2 scale-[0.42] transform-gpu min-[360px]:scale-[0.46] min-[390px]:top-[42%] min-[390px]:scale-[0.5] sm:top-[44%] sm:scale-[0.58]"
                  initial={false}
                  animate={{ opacity: splineLoaded ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <SplineScene
                    scene="https://prod.spline.design/aToMIxq-essPCx39/scene.splinecode"
                    lazyThreshold={0.01}
                    onLoad={revealSpline}
                    style={{ width: "100%", height: "100%" }}
                  />
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>

          {/* Right side — Spline 3D scene */}
          <div className="relative hidden lg:block" style={{ height: "calc(100vh - 80px)" }}>
            {!splineLoaded ? (
              <button
                type="button"
                disabled={hero3dEnabled}
                onClick={() => setHero3dEnabled(true)}
                className="absolute left-1/2 top-1/2 z-10 min-h-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-djon-accent/45 bg-djon-black/75 px-5 text-[10px] font-black tracking-[0.18em] text-djon-accent backdrop-blur-sm transition-opacity hover:opacity-80 disabled:cursor-wait"
              >
                {hero3dEnabled ? "CARREGANDO 3D..." : "ATIVAR EXPERIÊNCIA 3D"}
              </button>
            ) : null}
            {hero3dEnabled ? (
              <motion.div
                className="h-full w-full"
                initial={false}
                animate={{ opacity: splineLoaded ? 1 : 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <SplineScene
                  scene="https://prod.spline.design/aToMIxq-essPCx39/scene.splinecode"
                  lazyThreshold={0.01}
                  onLoad={revealSpline}
                  style={{ width: "100%", height: "100%" }}
                />
              </motion.div>
            ) : null}
          </div>
        </div>


      </div>
      {canEdit ? <LandingEditButton onClick={edit} /> : null}
    </section>
  )
}
