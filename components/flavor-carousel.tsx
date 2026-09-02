"use client"

import type React from "react"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LandingEditButton } from "@/components/landing/landing-edit-button"
import { useLandingSection } from "@/components/landing/landing-content-provider"
import { landingColor } from "@/lib/landing-content"
import {
  passthroughImageLoader,
  shouldBypassImageOptimization,
} from "@/lib/image-optimization"

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.9,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  }),
}

export function FlavorCarousel() {
  const { data, canEdit, edit } = useLandingSection("courses")
  const courses = data.courses
  const [currentIndex, setCurrentIndex] = useState(0)
  const [[page, direction], setPage] = useState([0, 0])
  const currentCourse = courses[currentIndex] ?? courses[0]
  const palette = landingColor(currentCourse.color)

  useEffect(() => {
    if (currentIndex >= courses.length) {
      setCurrentIndex(0)
      setPage([0, 0])
    }
  }, [courses.length, currentIndex])

  const rotateX = useSpring(0, { stiffness: 150, damping: 20 })
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)
    rotateY.set(x * 4)
    rotateX.set(-y * 4)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const paginate = (newDirection: number) => {
    const newIndex = (currentIndex + newDirection + courses.length) % courses.length
    setCurrentIndex(newIndex)
    setPage([page + newDirection, newDirection])
  }

  return (
    <section id="cursos" className="relative py-16 bg-djon-ink overflow-hidden">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${palette.gradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
          key={currentCourse.id}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
          className="text-center mb-10"
        >
          <motion.span
            className="text-xs tracking-wide font-bold"
            style={{ color: palette.color }}
            animate={{ color: palette.color }}
            transition={{ duration: 0.5 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            NOSSOS CURSOS
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.2 }}
          >
            Escolha seu Módulo
          </motion.h2>
          <motion.div
            className="h-[3px] w-10 mx-auto mt-3 rounded-full"
            style={{ backgroundColor: palette.color }}
            animate={{ backgroundColor: palette.color }}
            transition={{ duration: 0.5 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
          />
          <motion.p
            className="text-sm text-djon-text/50 mt-3 max-w-xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            Seja você um DJ iniciante ou avançado, descubra os três módulos de conhecimento musical que você vai desbloquear na DJ ON Academy.
          </motion.p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="flex items-center justify-center gap-6">
            <motion.button
              aria-label="Curso anterior"
              onClick={() => paginate(-1)}
              className="cursor-pointer hidden md:flex w-12 h-12 rounded-full border-2 border-djon-text/20 items-center justify-center hover:brightness-110 text-djon-text transition-colors"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentCourse.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative w-full max-w-3xl"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="rounded-3xl border border-djon-text/10 bg-djon-surface-3 p-4 shadow-2xl sm:p-6 md:p-8"
                  style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid md:grid-cols-2 gap-6 items-stretch">
                    <motion.div
                      className="relative min-h-[220px] overflow-hidden rounded-2xl sm:min-h-[260px]"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                    >
                      <Image
                        src={currentCourse.image}
                        alt={currentCourse.title}
                        fill
                        loader={shouldBypassImageOptimization(currentCourse.image) ? passthroughImageLoader : undefined}
                        unoptimized={shouldBypassImageOptimization(currentCourse.image)}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-djon-black/60 to-transparent" />
                    </motion.div>

                    <div className="space-y-4">
                      <div>
                        <motion.span
                          className="text-xs tracking-wide font-bold"
                          style={{ color: palette.color }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {currentCourse.label}
                        </motion.span>
                        <motion.h3
                          className="text-2xl md:text-3xl font-black text-djon-text tracking-tighter mt-1"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, type: "spring" as const, stiffness: 100 }}
                        >
                          {currentCourse.title}
                        </motion.h3>
                      </div>

                      <motion.p
                        className="text-xs text-djon-text/60 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {currentCourse.description}
                      </motion.p>

                      <motion.div
                        className="space-y-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                      >
                        <p className="text-xs font-black tracking-widest" style={{ color: palette.color }}>
                          O QUE VOCÊ VAI APRENDER:
                        </p>
                        <div className="space-y-1 mt-1">
                          {currentCourse.items.map((item, i) => (
                            <motion.div
                              key={item}
                              className="flex items-start gap-2 text-xs text-djon-text/60"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.04 }}
                            >
                              <span style={{ color: palette.color }} className="mt-0.5 shrink-0">•</span>
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      <motion.a
                        href="#contato"
                        className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-black tracking-widest sm:w-auto"
                        style={{ backgroundColor: palette.color, color: "var(--djon-color-ink)" }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <motion.span
                          className="absolute inset-0 bg-djon-text/20"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="relative z-10">DESBLOQUEAR</span>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              aria-label="Próximo curso"
              onClick={() => paginate(1)}
              className="cursor-pointer hidden md:flex w-12 h-12 rounded-full border-2 border-djon-text/20 items-center justify-center hover:brightness-110 text-djon-text transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex md:hidden justify-center gap-4 mt-6">
            <motion.button
              aria-label="Curso anterior"
              onClick={() => paginate(-1)}
              className="cursor-pointer w-10 h-10 rounded-full border-2 border-djon-text/20 flex items-center justify-center text-djon-text transition-opacity hover:opacity-70"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              aria-label="Próximo curso"
              onClick={() => paginate(1)}
              className="cursor-pointer w-10 h-10 rounded-full border-2 border-djon-text/20 flex items-center justify-center text-djon-text transition-opacity hover:opacity-70"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="flex justify-center mt-6">
            {courses.map((course, index) => (
              <motion.button
                key={course.id}
                type="button"
                aria-label={`Mostrar curso ${course.title}`}
                aria-current={index === currentIndex ? "true" : undefined}
                onClick={() => {
                  const newDirection = index > currentIndex ? 1 : -1
                  setCurrentIndex(index)
                  setPage([index, newDirection])
                }}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              >
                <motion.span
                  className="h-2 rounded-full"
                  style={{ backgroundColor: index === currentIndex ? landingColor(course.color).color : "color-mix(in srgb, var(--djon-color-white) 20%, transparent)" }}
                  animate={{ width: index === currentIndex ? 28 : 10 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      {canEdit ? <LandingEditButton onClick={edit} /> : null}
    </section>
  )
}
