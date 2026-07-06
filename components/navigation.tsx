"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useLenis } from "lenis/react"
import { Menu, X, LogIn } from "lucide-react"
import { LocationDropdown } from "@/components/location-dropdown"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const closeOnDesktop = () => {
      if (media.matches) {
        setMobileMenuOpen(false)
      }
    }

    closeOnDesktop()
    media.addEventListener("change", closeOnDesktop)

    return () => media.removeEventListener("change", closeOnDesktop)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.querySelector<HTMLElement>(id)
    if (element && lenis) {
      lenis.scrollTo(element, { offset: -100 })
    }
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: "EVENTO OFICIAL", href: "#showcase" },
    { label: "CURSOS", href: "#cursos" },
    { label: "NOSSO TIME", href: "#time" },
    { label: "HISTÓRIA", href: "#historia" },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        mobileMenuOpen
          ? "bg-djon-page border-b border-djon-text/10"
          : scrolled
            ? "bg-djon-ink/95 backdrop-blur-md border-b border-djon-text/10"
            : "bg-djon-ink/60 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between sm:px-6">
        <button onClick={() => scrollToSection("#hero")} className="cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            <Image
              src="/images/djon-verde.png"
              alt="DJ ON Academy"
              width={100}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </motion.div>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item, i) => (
            <motion.button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="cursor-pointer text-xs font-bold tracking-widest transition-colors relative text-djon-text/80 hover:text-djon-accent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
              <motion.span
                className="absolute -bottom-1 left-0 w-full h-0.5 bg-djon-accent origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
              />
            </motion.button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LocationDropdown />
          <motion.button
            onClick={() => scrollToSection("#contato")}
            className="cursor-pointer bg-djon-accent text-djon-ink px-6 py-2.5 rounded-full font-black text-xs tracking-widest relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
            />
            <span className="relative z-10">CONTATO</span>
          </motion.button>
          <Link href="/login">
            <motion.div
              className="flex items-center gap-1.5 border border-djon-text/20 text-djon-text/70 hover:text-djon-text hover:border-djon-text/40 px-4 py-2.5 rounded-full font-black text-xs tracking-widest transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              <LogIn size={13} />
              LOGIN
            </motion.div>
          </Link>
        </div>

        <motion.button
          className="cursor-pointer md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="text-djon-text" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="text-djon-text" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="djon-scroll fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-djon-text/10 bg-djon-page md:hidden"
            data-lenis-prevent
          >
            <div className="min-h-full space-y-5 px-4 py-6 pb-10 sm:px-6">
              {navLinks.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="cursor-pointer block w-full text-left text-djon-text/80 hover:text-djon-accent text-base font-black tracking-widest py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <LocationDropdown align="left" mobile />
              <motion.button
                onClick={() => scrollToSection("#contato")}
                className="cursor-pointer w-full bg-djon-accent text-djon-ink px-6 py-3 rounded-full font-black text-xs tracking-widest mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                CONTATO
              </motion.button>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <motion.div
                  className="w-full flex items-center justify-center gap-2 border border-djon-text/20 text-djon-text/70 px-6 py-3 rounded-full font-black text-xs tracking-widest mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <LogIn size={13} />
                  LOGIN
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
