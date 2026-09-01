"use client"

import type React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef, useState } from "react"
import { LandingEditButton } from "@/components/landing/landing-edit-button"
import { useLandingSection } from "@/components/landing/landing-content-provider"
import { LandingIconView } from "@/components/landing/landing-options"
import { landingColor, type StatsLandingData } from "@/lib/landing-content"

function FeatureCard({ feature, index }: { feature: StatsLandingData["items"][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"])
  const accent = landingColor(feature.color).color

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.4, 0.25, 1] as const }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative group cursor-pointer"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 25%, transparent), transparent, color-mix(in srgb, ${accent} 25%, transparent))`,
          filter: "blur(8px)",
        }}
      />
      <div className="relative bg-djon-surface-3 rounded-2xl p-5 border border-djon-text/10 overflow-hidden h-full">
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={false}
          animate={
            isHovered
              ? {
                  background: [
                    "linear-gradient(105deg, transparent 20%, color-mix(in srgb, var(--djon-color-white) 3%, transparent) 25%, transparent 30%)",
                    "linear-gradient(105deg, transparent 70%, color-mix(in srgb, var(--djon-color-white) 3%, transparent) 75%, transparent 80%)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <div className="relative z-10 flex flex-col h-full min-h-[140px]">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: accent }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
            <LandingIconView name={feature.icon} className="relative z-10 h-5 w-5" style={{ color: accent }} />
          </motion.div>
          <div className="flex-1">
            <motion.div
              className="text-3xl font-black tracking-tight text-djon-text"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.2 + index * 0.1 }}
            >
              <span style={{ color: accent }}>{feature.value}</span>
            </motion.div>
            <h3 className="text-sm font-semibold text-djon-text mt-1">{feature.title}</h3>
            <p className="text-xs text-djon-text/50 mt-1">{feature.description}</p>
          </div>
          <motion.div
            className="h-[2px] rounded-full mt-4"
            style={{ backgroundColor: accent }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 + index * 0.1, ease: [0.25, 0.4, 0.25, 1] as const }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function BentoGrid() {
  const { data, canEdit, edit } = useLandingSection("stats")
  return (
    <section id="formula" className="relative py-16 bg-djon-page overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-djon-ink via-djon-page to-djon-ink" />
      <div className="max-w-5xl mx-auto px-4 relative z-10 sm:px-6">
        <div className="text-center mb-10">
          <motion.span
            className="inline-block text-djon-accent text-xs tracking-wide uppercase font-bold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.1 }}
          >
            {data.label}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.15 }}
          >
            {data.title}
          </motion.h2>
          <motion.div
            className="h-[3px] w-10 bg-djon-accent mx-auto mt-3 rounded-full"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.items.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
      {canEdit ? <LandingEditButton onClick={edit} /> : null}
    </section>
  )
}
