"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

export function LifestyleSection() {
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
            {[
              { src: "/images/djon-course-dj.png", label: "Formação DJ", alt: "Formação DJ" },
              { src: "/images/djon-course-producao.png", label: "Produção Musical", alt: "Produção Musical" },
              { src: "/images/djon-course-marketing.png", label: "Marketing", alt: "Marketing" },
              { src: "/images/djon-showcase.png", label: "Mentoria", alt: "Mentoria" },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={imageVariants}
                whileHover={{ scale: 1.03 }}
                className="relative aspect-square rounded-2xl overflow-hidden"
              >
                <Image src={item.src} alt={`${item.alt} — DJ ON Academy`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-djon-ink/80 to-transparent" />
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
              BEM-VINDO!
            </motion.div>

            <motion.h2
            className="djon-section-title font-black text-djon-ink pb-1"
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.15 }}
            >
              A FRONTEIRA ENTRE O SONHO E A{" "}
              <span
                style={{
                  color: "var(--djon-color-accent)",
                  WebkitTextStroke: "2px var(--djon-color-ink)",
                  paintOrder: "stroke fill",
                }}
              >
                REALIZAÇÃO
              </span>
            </motion.h2>

            <motion.p
              className="text-sm text-djon-ink/60 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Nós somos a fronteira entre o sonho e a realização! Se o seu sonho é ser DJ ou Produtor Musical, a DJ ON Academy vai descomplicar tudo para você chegar cada vez mais perto dos seus objetivos!
            </motion.p>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {[
                "Aprenda com profissionais da cena eletrônica",
                "Metodologia prática e teórica completa",
                "Turmas pequenas com atenção individualizada",
                "Comunidade ativa após a formação",
              ].map((item, i) => (
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
    </section>
  )
}
