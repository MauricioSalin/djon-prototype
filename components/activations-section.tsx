"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import Image from "next/image"
import { Mic2, Star, Users, Music, MousePointerClick } from "lucide-react"
import { SplineScene } from "@/components/spline-scene"

const teamMembers = [
  {
    name: "Segredo",
    role: "Diretor, DJ, Produtor Musical",
    description: "Professor Curso Formação de DJ e Produção Musical",
    image: "/images/djon-team-segredo.png",
    accent: "var(--djon-color-accent)",
  },
  {
    name: "Kampff",
    role: "DJ, Adm e Professor",
    description: "Curso Formação DJ e Mentor de Marketing para DJs",
    image: "/images/djon-team-kampff.png",
    accent: "var(--djon-color-cyan)",
  },
  {
    name: "Xinddy",
    role: "DJ, Produtora Musical",
    description: "Professora Curso Formação DJ (Psytrance) e Designer",
    image: "/images/djon-team-xinddy.png",
    accent: "var(--djon-color-orange)",
  },
  {
    name: "Guilherme",
    role: "DJ e Gestor",
    description: "Gestão e suporte aos alunos da academia",
    image: "/images/djon-team-gui.png",
    accent: "var(--djon-color-accent)",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

export function ActivationsSection() {
  const teamRef = useRef(null)
  const isInView = useInView(teamRef, { once: true, margin: "-100px" })
  const [showcaseSplineLoaded, setShowcaseSplineLoaded] = useState(false)

  return (
    <>
      {/* SHOWCASE SECTION */}
      <section id="showcase" className="relative py-16 bg-djon-text overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              className="relative rounded-3xl overflow-hidden aspect-[4/3]"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
            >
              <Image
                src="/images/djon-showcase.png"
                alt="SHOWCASE — Evento Oficial DJ ON"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-djon-ink/80 via-djon-ink/20 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-djon-accent text-djon-ink px-4 py-1.5 rounded-full font-black text-xs tracking-widest">
                  EVENTO OFICIAL
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <motion.span
                  className="text-djon-ink/50 text-xs tracking-wide inline-block font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  EVENTO OFICIAL DA DJ ON
                </motion.span>
                <h2 className="text-3xl md:text-5xl font-black text-djon-ink tracking-tighter mt-2 leading-[0.9]">
                  SHOWCASE
                </h2>
              </div>

              <p className="text-sm text-djon-ink/60 leading-relaxed">
                Aqui, depois de formado, você terá a oportunidade de sentir a experiência de tocar num palco real, expandindo as suas possibilidades de networking e iniciando a sua base de fãs!
              </p>
              <p className="text-sm text-djon-ink/60 leading-relaxed">
                Você será preparado durante o curso para chegar confiante, com seu Set pronto e todas as dicas necessárias para arrasar na sua primeira performance!
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mic2, label: "Palco Real" },
                  { icon: Star, label: "Primeira Performance" },
                  { icon: Users, label: "Networking" },
                  { icon: Music, label: "Set Completo" },
                ].map(({ icon: Icon, label }) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-2 bg-djon-ink rounded-xl px-4 py-3"
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-4 h-4 text-djon-accent" />
                    <span className="text-djon-text font-black text-xs tracking-wide">{label}</span>
                  </motion.div>
                ))}
              </div>

              <motion.a
                href="https://www.djonacademy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-djon-ink px-7 py-3 text-sm font-black tracking-wide text-djon-accent sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                SAIBA MAIS
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>
            </motion.div>
          </div>

          <motion.div
            className="relative mt-8 h-[420px] overflow-hidden bg-transparent min-[390px]:h-[460px] sm:h-[520px] md:mt-12 md:h-[560px]"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const }}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 h-[620px] w-[900px] -translate-x-1/2 -translate-y-1/2 scale-[0.34] transform-gpu min-[360px]:scale-[0.38] min-[390px]:scale-[0.42] sm:scale-[0.52] md:static md:h-full md:w-full md:translate-x-0 md:translate-y-0 md:scale-100"
              initial={false}
              animate={{ opacity: showcaseSplineLoaded ? 1 : 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <SplineScene
                scene="https://prod.spline.design/AUAj4HtJL15gKfTA/scene.splinecode"
                lazyThreshold={0.01}
                onLoad={() => setShowcaseSplineLoaded(true)}
                style={{ width: "100%", height: "100%" }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="relative z-10 -mt-8 flex justify-center pb-2 sm:-mt-10 md:-mt-12"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.55, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
          >
            <motion.div
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-djon-ink/10 bg-djon-ink px-5 py-3 text-djon-text shadow-djon-soft"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="absolute inset-y-0 -left-16 w-16 bg-djon-accent/18 blur-xl"
                animate={{ x: ["0%", "420%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative flex size-8 items-center justify-center rounded-full bg-djon-accent text-djon-ink">
                <motion.span
                  className="absolute inset-0 rounded-full border border-djon-accent"
                  animate={{ scale: [1, 1.55], opacity: [0.65, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  animate={{ x: [0, 5, -3, 0], rotate: [0, -8, 6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <MousePointerClick size={16} strokeWidth={2.8} />
                </motion.span>
              </span>
              <span className="relative text-xs font-black tracking-[0.22em] text-djon-text">
                ARRASTE PARA INTERAGIR
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section id="time" className="relative py-16 bg-djon-ink overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="text-center mb-10"
          >
            <motion.span
              className="text-djon-accent text-xs tracking-wide font-bold inline-block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              QUEM FAZ ACONTECER
            </motion.span>
            <motion.h2
              className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mt-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.2 }}
            >
              Nosso Time
            </motion.h2>
            <motion.div
              className="h-[3px] w-10 bg-djon-accent mx-auto mt-3 rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
            />
            <motion.p
              className="text-sm text-djon-text/50 mt-3 max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Esse é o time de profissionais que vai te acompanhar durante a grande jornada rumo ao seu sonho. Cada professor traz consigo uma bagagem única de experiência, talento e paixão pela música eletrônica.
            </motion.p>
          </motion.div>

          <motion.div
            ref={teamRef}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {teamMembers.map((member) => (
              <motion.div
                key={member.name}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02, transition: { type: "spring" as const, stiffness: 400, damping: 17 } }}
                className="group relative bg-djon-surface-3 rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to top, ${member.accent}60, transparent)` }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-black text-djon-text text-base tracking-tight">{member.name}</h3>
                  <p className="text-xs mt-0.5 font-bold" style={{ color: member.accent }}>{member.role}</p>
                  <p className="text-xs text-djon-text/50 mt-1 leading-relaxed">{member.description}</p>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: member.accent }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="relative mt-14 h-[300px] overflow-hidden bg-transparent min-[390px]:h-[330px] md:h-[420px]"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const }}
          >
            <div className="absolute left-1/2 top-1/2 h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 scale-[0.4] transform-gpu min-[360px]:scale-[0.44] min-[390px]:scale-[0.48] sm:scale-[0.62] md:static md:h-full md:w-full md:translate-x-0 md:translate-y-0 md:scale-100">
              <SplineScene
                scene="https://prod.spline.design/OduYuH7Y3CXDo9Ga/scene.splinecode"
                lazyThreshold={0.01}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
