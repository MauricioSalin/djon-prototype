"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  academyLocationChangeEvent,
  academyLocationStorageKey,
  academyLocations,
  isAcademyLocationKey,
  type AcademyLocationKey,
} from "@/lib/locations"


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

const highlights = [
  { year: "2018", label: "Fundação da DJ ON" },
  { year: "2019", label: "Início das atividades" },
  { year: "2022", label: "Expansão dos cursos" },
  { year: "2024", label: "Novo espaço e equipe" },
]

export function SocialSection() {
  const [selectedLocation, setSelectedLocation] = useState<AcademyLocationKey>("poa")
  const location = academyLocations[selectedLocation]

  useEffect(() => {
    const storedLocation = window.localStorage.getItem(academyLocationStorageKey)
    if (isAcademyLocationKey(storedLocation)) {
      setSelectedLocation(storedLocation)
    }

    const handleLocationChange = (event: Event) => {
      const nextLocation = (event as CustomEvent<{ location?: AcademyLocationKey }>).detail?.location
      if (isAcademyLocationKey(nextLocation)) {
        setSelectedLocation(nextLocation)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === academyLocationStorageKey && isAcademyLocationKey(event.newValue)) {
        setSelectedLocation(event.newValue)
      }
    }

    window.addEventListener(academyLocationChangeEvent, handleLocationChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener(academyLocationChangeEvent, handleLocationChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])


  return (
    <section id="historia" className="relative py-16 bg-djon-text overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
          >
            <div>
              <motion.span
                className="text-djon-ink/50 text-xs tracking-wide uppercase"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                QUEM SOMOS
              </motion.span>
              <motion.h2
                className="djon-section-title font-black text-djon-ink mt-2 pb-1"
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
              >
                <span className="block">NOSSA</span>
                <span
                  className="block"
                  style={{
                    color: "var(--djon-color-accent)",
                    WebkitTextStroke: "2px var(--djon-color-ink)",
                    paintOrder: "stroke fill",
                  }}
                >
                  HISTÓRIA.
                </span>
              </motion.h2>
            </div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-djon-ink/60 leading-relaxed">
                A DJ ON foi criada em 2018 e iniciou atividades em 2019 para atender a demanda de pessoas interessadas em aprender de forma técnica e profissional sobre a profissão de DJ.
              </p>
              <p className="text-sm text-djon-ink/60 leading-relaxed">
                A proposta era facilitar o ensino para iniciantes, proporcionando uma jornada acessível e divertida. Com a formação em turmas, os alunos têm a oportunidade de se conectar, colaborar em projetos e eventos, e receber acompanhamento intensivo para dominar as habilidades necessárias.
              </p>
              <p className="text-sm text-djon-ink/60 leading-relaxed">
                A DJ ON funciona como uma academia, oferecendo suporte contínuo aos alunos. Mesmo depois de formados, os alunos têm acesso à infraestrutura da escola para treinar, além da possibilidade de tocar nos eventos que a escola organiza, mantendo-se assim a grande comunidade da DJ ON Academy.
              </p>
            </motion.div>

            <motion.a
              href="https://www.djonacademy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-djon-ink px-7 py-3 text-sm font-black tracking-wide text-djon-accent sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              AGENDAR VISITA
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.a>
          </motion.div>

          {/* Right: Timeline + info card */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
          >
            <motion.div
              className="grid grid-cols-2 gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
            >
              {highlights.map((item) => (
                <motion.div
                  key={item.year}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                  className="bg-djon-ink rounded-2xl p-5 group cursor-pointer"
                >
                  <div className="text-2xl font-black text-djon-accent tracking-tighter">
                    {item.year}
                  </div>
                  <p className="text-djon-text/60 text-xs mt-1 leading-relaxed">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Interactive map card */}
            <motion.div
              className="rounded-2xl overflow-hidden relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              style={{ height: 200 }}
            >
              {/* OpenStreetMap embed — no API key required */}
              <iframe
                title={`DJ ON Academy — ${location.label}`}
                src={location.mapSrc}
                className="w-full h-full border-0 grayscale contrast-[1.1]"
                loading="lazy"
              />


              <div className="pointer-events-none absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-full">
                <div className="relative">
                  <div className="absolute left-1/2 top-full h-3 w-7 -translate-x-1/2 rounded-full bg-djon-accent/30 blur-sm" />
                  <svg
                    viewBox="0 0 32 44"
                    className="h-11 w-8 drop-shadow-djon-soft"
                    aria-hidden="true"
                  >
                    <path
                      d="M16 43s13-13.5 13-26.5C29 7.4 23.2 1 16 1S3 7.4 3 16.5C3 29.5 16 43 16 43Z"
                      fill="var(--djon-color-accent)"
                    />
                    <circle cx="16" cy="16.5" r="5.5" fill="var(--djon-color-ink)" />
                  </svg>
                </div>
              </div>

              {/* Overlay info card pinned to bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-djon-ink/90 px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-djon-text text-xs font-bold leading-snug truncate">
                    {location.address}
                  </p>
                  <p className="text-djon-accent text-djon-label mt-0.5">
                    Seg – Sex &nbsp;·&nbsp; 9h às 18h
                  </p>
                </div>
                <motion.a
                  href={location.mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto shrink-0 rounded-full bg-djon-accent px-3 py-1.5 text-djon-label font-black tracking-wide text-djon-ink"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ABRIR
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
