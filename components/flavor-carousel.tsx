"use client"

import type React from "react"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

const courses = [
  {
    id: 1,
    name: "Formação DJ",
    tagline: "Do Zero ao Profissional",
    description: "Aqui você vai aprender tudo que precisa para se tornar um DJ. Por hobby ou profissão, nossa metodologia prática e teórica abrange tudo o que você vai precisar para discotecar de maneira profissional e com confiança.",
    image: "/images/djon-course-dj.png",
    bgColor: "from-[#AFFF00]/15 via-[#AFFF00]/5 to-transparent",
    accentColor: "#AFFF00",
    items: [
      "Mixagem de Música Eletrônica",
      "Todas as funções do mixer e do CDJ",
      "Play Match e Beat Match",
      "Mixagem com fone de ouvido",
      "Pitch e BPM / Frequências",
      "Software Rekordbox & Mixed in Key",
      "Elaboração de repertório",
      "Introdução ao marketing",
    ],
  },
  {
    id: 2,
    name: "Produção Musical",
    tagline: "Do Beat à Track Final",
    description: "O curso de produção musical vai elevar suas habilidades criativas e transformar sua paixão pela música em resultados extraordinários. Explore técnicas incríveis e domine as ferramentas indispensáveis.",
    image: "/images/djon-course-producao.png",
    bgColor: "from-[#00D4FF]/15 via-[#00D4FF]/5 to-transparent",
    accentColor: "#00D4FF",
    items: [
      "Software Ableton Live 11",
      "Construção da sua primeira track do zero",
      "Construção de baterias",
      "Arranjo / Storytelling",
      "Basslines & Síntese",
      "Teoria musical",
      "VSTs & Processamentos",
    ],
  },
  {
    id: 3,
    name: "Mentoria de Marketing",
    tagline: "Construa sua Carreira",
    description: "A mentoria de marketing especializada para DJs vai impulsionar sua carreira e expandir sua presença no mercado da música eletrônica. Aprenda a promover sua imagem e conquistar novas oportunidades.",
    image: "/images/djon-course-marketing.png",
    bgColor: "from-[#FF6B35]/15 via-[#FF6B35]/5 to-transparent",
    accentColor: "#FF6B35",
    items: [
      "Mindset de artista",
      "Dominar as redes sociais",
      "Conquistar novos contratantes",
      "Como ter uma agenda lotada",
      "Performance de palco",
      "Plano de carreira",
      "Comunicação & Produza seu primeiro evento",
    ],
  },
]

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [[page, direction], setPage] = useState([0, 0])
  const currentCourse = courses[currentIndex]

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
    <section id="cursos" className="relative py-16 bg-[#121212] overflow-hidden">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${currentCourse.bgColor}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        key={currentCourse.id}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
          className="text-center mb-10"
        >
          <motion.span
            className="text-xs tracking-wide font-bold"
            style={{ color: currentCourse.accentColor }}
            animate={{ color: currentCourse.accentColor }}
            transition={{ duration: 0.5 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            NOSSOS CURSOS
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-black text-white tracking-tighter mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.2 }}
          >
            Escolha seu Módulo
          </motion.h2>
          <motion.div
            className="h-[3px] w-10 mx-auto mt-3 rounded-full"
            style={{ backgroundColor: currentCourse.accentColor }}
            animate={{ backgroundColor: currentCourse.accentColor }}
            transition={{ duration: 0.5 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
          />
          <motion.p
            className="text-sm text-white/50 mt-3 max-w-xl mx-auto leading-relaxed"
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
              onClick={() => paginate(-1)}
              className="cursor-pointer hidden md:flex w-12 h-12 rounded-full border-2 border-white/20 items-center justify-center hover:border-[#AFFF00] hover:text-[#AFFF00] text-white transition-colors"
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
                  className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl"
                  style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid md:grid-cols-2 gap-6 items-stretch">
                    <motion.div
                      className="relative rounded-2xl overflow-hidden min-h-[260px]"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                    >
                      <Image
                        src={currentCourse.image}
                        alt={currentCourse.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/60 to-transparent" />
                    </motion.div>

                    <div className="space-y-4">
                      <div>
                        <motion.span
                          className="text-xs tracking-wide font-bold"
                          style={{ color: currentCourse.accentColor }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {currentCourse.tagline}
                        </motion.span>
                        <motion.h3
                          className="text-2xl md:text-3xl font-black text-white tracking-tighter mt-1"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, type: "spring" as const, stiffness: 100 }}
                        >
                          {currentCourse.name}
                        </motion.h3>
                      </div>

                      <motion.p
                        className="text-xs text-white/60 leading-relaxed"
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
                        <p className="text-xs font-black tracking-widest" style={{ color: currentCourse.accentColor }}>
                          O QUE VOCÊ VAI APRENDER:
                        </p>
                        <div className="space-y-1 mt-1">
                          {currentCourse.items.map((item, i) => (
                            <motion.div
                              key={item}
                              className="flex items-start gap-2 text-xs text-white/60"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.04 }}
                            >
                              <span style={{ color: currentCourse.accentColor }} className="mt-0.5 shrink-0">•</span>
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      <motion.a
                        href="https://www.djonacademy.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm tracking-widest relative overflow-hidden"
                        style={{ backgroundColor: currentCourse.accentColor, color: "#121212" }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <motion.span
                          className="absolute inset-0 bg-white/20"
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
              onClick={() => paginate(1)}
              className="cursor-pointer hidden md:flex w-12 h-12 rounded-full border-2 border-white/20 items-center justify-center hover:border-[#AFFF00] hover:text-[#AFFF00] text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex md:hidden justify-center gap-4 mt-6">
            <motion.button
              onClick={() => paginate(-1)}
              className="cursor-pointer w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => paginate(1)}
              className="cursor-pointer w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {courses.map((course, index) => (
              <motion.button
                key={course.id}
                onClick={() => {
                  const newDirection = index > currentIndex ? 1 : -1
                  setCurrentIndex(index)
                  setPage([index, newDirection])
                }}
                className="cursor-pointer h-2 rounded-full transition-all"
                style={{ backgroundColor: index === currentIndex ? course.accentColor : "rgba(255,255,255,0.2)" }}
                animate={{ width: index === currentIndex ? 28 : 10 }}
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
