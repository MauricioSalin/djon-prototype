"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { SplineScene } from "@/components/spline-scene"


const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  }),
}


export function HeroSection() {
  const ref = useRef(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const rawY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y = useSpring(rawY, springConfig)

  const rawTextX1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const textX1 = useSpring(rawTextX1, springConfig)

  const rawTextX2 = useTransform(scrollYProgress, [0, 1], [0, 100])
  const textX2 = useSpring(rawTextX2, springConfig)

  const rawScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const scale = useSpring(rawScale, springConfig)

  const rawOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const opacity = useSpring(rawOpacity, springConfig)

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [])

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#121212] noise-overlay"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/djon-hero.png"
          alt="DJ ON Academy"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/80 to-[#121212]/40" />
      </div>



      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12 w-full">
        <div className="grid lg:grid-cols-[5fr_7fr] gap-4 items-center">
          {/* Text Content */}
          <motion.div style={{ opacity }} className="space-y-6 relative z-20">
            <div className="space-y-1 overflow-hidden">
              <motion.h1
                style={{ x: textX1 }}
                className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9]"
              >
                <motion.span
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  className="inline-block"
                >
                  SEU SONHO
                </motion.span>
              </motion.h1>
              <motion.h1
                style={{ x: textX2 }}
                className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]"
              >
                <motion.span
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                  className="inline-block text-[#AFFF00]"
                >
                  COMEÇA AQUI!
                </motion.span>
              </motion.h1>
              <motion.p
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={3}
                className="text-base md:text-lg text-white/60 tracking-tight pt-3 max-w-md leading-relaxed"
              >
                Nós somos a fronteira entre o sonho e a realização. Se o seu sonho é ser DJ ou Produtor Musical, a DJ ON Academy vai descomplicar tudo para você.
              </motion.p>
            </div>

            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap gap-3 pt-2"
            >
              <motion.a
                href="https://www.djonacademy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#AFFF00] text-[#121212] px-7 py-3 rounded-full font-black text-sm tracking-widest flex items-center gap-2 group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
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
                className="cursor-pointer border-2 border-white/30 text-white px-7 py-3 rounded-full font-black text-sm tracking-widest relative overflow-hidden"
                whileHover={{ scale: 1.02, borderColor: "#AFFF00", color: "#AFFF00" }}
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
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              custom={5}
              className="flex flex-wrap gap-4 pt-2"
            >
              {["Formação DJ", "Produção Musical", "Mentoria de Marketing", "Evento Showcase"].map((benefit, i) => (
                <motion.div
                  key={benefit}
                  className="flex items-center gap-2 text-xs text-white/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <div className="w-1.5 h-1.5 bg-[#AFFF00] rounded-full" />
                  {benefit}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right side — Spline 3D scene */}
          <div className="relative hidden lg:block" style={{ height: "calc(100vh - 80px)" }}>
            <motion.div
              aria-hidden="true"
              className="h-full w-full"
              initial={false}
              animate={{ opacity: splineLoaded ? 1 : 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <SplineScene
                scene="https://prod.spline.design/aToMIxq-essPCx39/scene.splinecode"
                globalEvents
                lazy={false}
                onLoad={() => {
                  if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
                  revealTimeoutRef.current = setTimeout(() => setSplineLoaded(true), 800)
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </motion.div>
          </div>
        </div>


      </div>
    </section>
  )
}
