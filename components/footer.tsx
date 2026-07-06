"use client"

import type React from "react"
import { motion, useInView } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react"
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
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
}

export function Footer() {
  const [formData, setFormData] = useState({ nome: "", sobrenome: "", email: "", mensagem: "" })
  const [selectedLocation, setSelectedLocation] = useState<AcademyLocationKey>("poa")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const footerRef = useRef(null)
  const isInView = useInView(footerRef, { once: true, margin: "-100px" })
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <footer ref={footerRef} id="contato" className="relative bg-[#121212] pt-16 pb-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] overflow-hidden">
            <motion.span
              className="block"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
            >
              VAMOS COMEÇAR?
            </motion.span>
            <motion.span
              className="block"
              style={{
                color: "#AFFF00",
                WebkitTextStroke: "2px transparent",
                paintOrder: "stroke fill",
              }}
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
            >
              SUA JORNADA?
            </motion.span>
          </h2>
        </motion.div>

        {/* Contact Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-14">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter mb-1">CONTATO</h3>
              <motion.div className="h-0.5 w-10 bg-[#AFFF00] rounded-full" />
            </div>

            <div className="space-y-4">
              <motion.div
                className="flex items-start gap-3"
                whileHover={{ x: 4 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <MapPin className="w-4 h-4 text-[#AFFF00] mt-0.5 shrink-0" />
                <p className="text-white/60 text-sm leading-relaxed">
                  {location.lines[0]}<br />
                  {location.lines[1]}
                </p>
              </motion.div>
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ x: 4 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <Phone className="w-4 h-4 text-[#AFFF00] shrink-0" />
                <a href="tel:+555199700-7846" className="text-white/60 text-sm hover:text-[#AFFF00] transition-colors">
                  +55 51 99700-7846
                </a>
              </motion.div>
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ x: 4 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <Mail className="w-4 h-4 text-[#AFFF00] shrink-0" />
                <a href="mailto:contato@djonacademy.com" className="text-white/60 text-sm hover:text-[#AFFF00] transition-colors">
                  contato@djonacademy.com
                </a>
              </motion.div>
            </div>

            <div className="flex gap-3 pt-2">
              <motion.a
                href="https://www.instagram.com/djonacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#AFFF00] hover:text-[#121212] transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Instagram className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="https://www.facebook.com/djonacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#AFFF00] hover:text-[#121212] transition-colors"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
            </div>

            {/* Visit info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <p className="text-[#AFFF00] font-black text-xs tracking-widest">VISITE</p>
              <p className="text-white/60 text-sm">Segunda à sexta das 9h às 18h</p>
              <p className="text-white/60 text-sm">{location.lines[0]}</p>
              <p className="text-white/60 text-sm">{location.lines[1]}</p>
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const, delay: 0.1 }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-black text-white tracking-tighter mb-1">FALE CONOSCO</h3>
              <motion.div className="h-0.5 w-10 bg-[#AFFF00] rounded-full" />
              <p className="text-white/50 text-xs mt-2 leading-relaxed">
                Utilize este espaço para falar com a gente, agendar um horário ou dar uma sugestão para que possamos lhe atender ainda melhor!
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#AFFF00]/10 border border-[#AFFF00]/30 rounded-2xl p-8 text-center"
              >
                <motion.div
                  className="text-[#AFFF00] text-4xl font-black mb-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ✓
                </motion.div>
                <p className="text-white font-black">Mensagem enviada!</p>
                <p className="text-white/60 text-xs mt-1">Entraremos em contato em breve.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div whileFocus={{ scale: 1.01 }}>
                    <label className="block text-xs text-white/50 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Seu nome"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#AFFF00] transition-all duration-300"
                    />
                  </motion.div>
                  <motion.div whileFocus={{ scale: 1.01 }}>
                    <label className="block text-xs text-white/50 mb-1">Sobrenome</label>
                    <input
                      type="text"
                      value={formData.sobrenome}
                      onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                      placeholder="Seu sobrenome"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#AFFF00] transition-all duration-300"
                    />
                  </motion.div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#AFFF00] transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Mensagem</label>
                  <textarea
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    placeholder="Escreva sua mensagem..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#AFFF00] transition-all duration-300 resize-none"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#AFFF00] text-[#121212] py-3 rounded-xl font-black text-sm tracking-widest relative overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative z-10">
                    {isSubmitting ? "ENVIANDO..." : "ENVIAR"}
                  </span>
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/10 gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/djon-verde.png"
              alt="DJ ON Academy"
              style={{ height: "28px", width: "auto" }}
            />
          </motion.div>

          <p className="text-white/40 text-xs text-center">
            © 2026 DJ ON Academy. Todos os direitos reservados. Porto Alegre - RS
          </p>

          <div className="flex gap-4">
            <a href="https://www.instagram.com/djonacademy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#AFFF00] text-xs transition-colors">Instagram</a>
            <a href="https://www.facebook.com/djonacademy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#AFFF00] text-xs transition-colors">Facebook</a>
          </div>
        </motion.div>
      </div>


    </footer>
  )
}
