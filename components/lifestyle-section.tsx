"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { LandingEditButton } from "@/components/landing/landing-edit-button"
import { useLandingSection } from "@/components/landing/landing-content-provider"
import {
  passthroughImageLoader,
  shouldBypassImageOptimization,
} from "@/lib/image-optimization"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

export function LifestyleSection() {
  const { data, canEdit, edit } = useLandingSection("lifestyle")
  const titleWords = data.title.trim().split(/\s+/)
  const accentWord = titleWords.pop() ?? ""
  return (
    <section className="relative py-16 bg-djon-text overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image grid 2×2 */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0 }}
          >
            {data.images.map((item) => (
              <motion.div
                key={item.label}
                variants={imageVariants}
                whileHover={{ scale: 1.03 }}
                className="relative aspect-square rounded-2xl overflow-hidden"
              >
                <Image
                  loader={shouldBypassImageOptimization(item.image) ? passthroughImageLoader : undefined}
                  unoptimized={shouldBypassImageOptimization(item.image)}
                  src={item.image}
                  alt={`${item.label} — DJ ON Academy`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-djon-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-djon-text font-black text-xs tracking-wide">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Text */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-djon-ink text-djon-text px-3 py-1.5 rounded-full text-xs font-black tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <motion.span
                className="w-2 h-2 bg-djon-accent rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              {data.badge}
            </motion.div>

            <motion.h2
            className="djon-section-title font-black text-djon-ink pb-1"
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.15 }}
            >
              {titleWords.join(" ")}{" "}
              <span
                style={{
                  color: "var(--djon-color-accent)",
                  WebkitTextStroke: "2px var(--djon-color-ink)",
                  paintOrder: "stroke fill",
                }}
              >
                {accentWord}
              </span>
            </motion.h2>

            <motion.p
              className="text-sm text-djon-ink/60 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {data.description}
            </motion.p>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {data.items.map((item, i) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-3 text-sm text-djon-ink/70"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                >
                  <div className="w-2 h-2 bg-djon-accent rounded-full shrink-0" />
                  {item}
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              className="w-full rounded-full bg-djon-ink px-7 py-3 text-sm font-black tracking-wide text-djon-accent sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              onClick={() => {
                const el = document.querySelector("#cursos")
                if (el) el.scrollIntoView({ behavior: "smooth" })
              }}
            >
              QUERO CONHECER
            </motion.button>
          </motion.div>
        </div>
      </div>
      {canEdit ? <LandingEditButton onClick={edit} /> : null}
    </section>
  )
}
