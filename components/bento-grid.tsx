"use client"

import type React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef, useState } from "react"
import { Music, Users, Trophy } from "lucide-react"

const features = [
  {
    icon: Music,
    title: "3",
    subtitle: "Módulos de Curso",
    description: "DJ, Produção Musical e Marketing",
    accent: "#AFFF00",
  },
  {
    icon: Users,
    title: "+1000",
    subtitle: "Alunos Formados",
    description: "DJs e produtores prontos para o mercado",
    accent: "#00D4FF",
  },
  {
    icon: Trophy,
    title: "2018",
    subtitle: "Fundada em",
    description: "8 anos de experiência formando talentos",
    accent: "#FF6B35",
  },
]

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"])

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
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
          background: `linear-gradient(135deg, ${feature.accent}40, transparent, ${feature.accent}40)`,
          filter: "blur(8px)",
        }}
      />
      <div className="relative bg-[#1a1a1a] rounded-2xl p-5 border border-white/10 overflow-hidden h-full">
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={false}
          animate={
            isHovered
              ? {
                  background: [
                    "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 25%, transparent 30%)",
                    "linear-gradient(105deg, transparent 70%, rgba(255,255,255,0.03) 75%, transparent 80%)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <div className="relative z-10 flex flex-col h-full min-h-[140px]">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
            style={{ backgroundColor: `${feature.accent}20` }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: feature.accent }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
            <feature.icon className="w-5 h-5 relative z-10" style={{ color: feature.accent }} />
          </motion.div>
          <div className="flex-1">
            <motion.div
              className="text-3xl font-black tracking-tight text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.2 + index * 0.1 }}
            >
              <span style={{ color: feature.accent }}>{feature.title}</span>
            </motion.div>
            <h3 className="text-sm font-semibold text-white mt-1">{feature.subtitle}</h3>
            <p className="text-xs text-white/50 mt-1">{feature.description}</p>
          </div>
          <motion.div
            className="h-[2px] rounded-full mt-4"
            style={{ backgroundColor: feature.accent }}
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
  return (
    <section id="formula" className="relative py-16 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#0a0a0a] to-[#121212]" />
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <motion.span
            className="inline-block text-[#AFFF00] text-xs tracking-wide uppercase font-bold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.1 }}
          >
            A ACADEMIA
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-black text-white tracking-tighter mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.15 }}
          >
            DJ ON em Números
          </motion.h2>
          <motion.div
            className="h-[3px] w-10 bg-[#AFFF00] mx-auto mt-3 rounded-full"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
