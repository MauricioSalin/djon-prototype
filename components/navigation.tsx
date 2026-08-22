"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useLenis } from "lenis/react"
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react"
import { LocationDropdown } from "@/components/location-dropdown"
import { store, type User } from "@/lib/store"

function portalHomeForRole(role: User["role"]) {
  if (role === "admin") return "/dashboard/admin"
  if (role === "professor") return "/dashboard/professor"
  return "/dashboard/student"
}

function roleLabelFor(role: User["role"]) {
  if (role === "admin") return "Admin"
  if (role === "professor") return "Professor"
  return "Aluno"
}

function UserIdentity({ user }: { user: User }) {
  return (
    <>
      <div className="djon-avatar-fallback flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-djon-accent">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-black text-djon-text">
            {user.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="max-w-[120px] truncate text-xs font-bold leading-tight text-djon-text">
          {user.name.split(" ").slice(0, 2).join(" ")}
        </p>
        <p className="text-djon-caption font-black uppercase leading-tight tracking-widest text-djon-accent">
          {roleLabelFor(user.role)}
        </p>
      </div>
    </>
  )
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    let active = true
    void store
      .restoreSession()
      .then((sessionUser) => {
        if (active) setUser(sessionUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }
    window.addEventListener("pointerdown", handlePointerDown)
    return () => window.removeEventListener("pointerdown", handlePointerDown)
  }, [accountOpen])

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

  const handleLogout = () => {
    store.logout()
    setUser(null)
    setAccountOpen(false)
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: "EVENTO OFICIAL", href: "#showcase" },
    { label: "CURSOS", href: "#cursos" },
    { label: "NOSSO TIME", href: "#time" },
    { label: "HISTÓRIA", href: "#historia" },
    { label: "CONTATO", href: "#contato" },
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
        <button onClick={() => scrollToSection("#hero")} className="cursor-pointer transition-opacity hover:opacity-80">
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
              className="cursor-pointer text-xs font-bold tracking-widest transition-colors relative text-djon-text/80 hover:brightness-110"
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
          {sessionLoading ? (
            <div
              aria-hidden="true"
              className="h-10 w-40 animate-pulse rounded-full border border-djon-text/10 bg-djon-text/5"
            />
          ) : user ? (
            <div ref={accountRef} className="relative">
              <motion.button
                type="button"
                aria-expanded={accountOpen}
                aria-label="Abrir menu da conta"
                onClick={() => setAccountOpen((open) => !open)}
                className="cursor-pointer flex items-center gap-2.5 rounded-full border border-djon-text/15 bg-djon-text/6 py-1 pl-1 pr-3 transition-colors hover:brightness-110"
                whileTap={{ scale: 0.97 }}
              >
                <UserIdentity user={user} />
                <ChevronDown
                  size={12}
                  className={`text-djon-text/40 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-djon-text/12 bg-djon-surface py-2 shadow-2xl"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href={portalHomeForRole(user.role)}
                      onClick={() => setAccountOpen(false)}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-wide text-djon-text opacity-[0.65] transition-opacity hover:opacity-100"
                    >
                      <LayoutDashboard size={14} />
                      Acessar portal
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-wide text-djon-warning-red opacity-75 transition-opacity hover:opacity-100"
                    >
                      <LogOut size={14} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login">
              <motion.div
                className="flex items-center gap-1.5 border border-djon-text/20 text-djon-text/70 hover:brightness-110 px-4 py-2.5 rounded-full font-black text-xs tracking-widest transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
              >
                <LogIn size={13} />
                LOGIN
              </motion.div>
            </Link>
          )}
        </div>

        <motion.button
          className="cursor-pointer p-2 transition-opacity hover:opacity-70 md:hidden"
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
                  className="cursor-pointer block w-full text-left text-djon-text/80 hover:brightness-110 text-base font-black tracking-widest py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <LocationDropdown align="left" mobile />
              {sessionLoading ? (
                <div className="mt-2 h-12 w-full animate-pulse rounded-full border border-djon-text/10 bg-djon-text/5" />
              ) : user ? (
                <motion.div
                  className="mt-2 rounded-2xl border border-djon-text/12 bg-djon-text/5 p-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className="flex items-center gap-2.5 px-2 py-2">
                    <UserIdentity user={user} />
                  </div>
                  <div className="mt-2 grid gap-2">
                    <Link
                      href={portalHomeForRole(user.role)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90"
                    >
                      <LayoutDashboard size={14} />
                      ACESSAR PORTAL
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-full border border-djon-warning-red/25 px-6 py-3 text-xs font-black tracking-widest text-djon-warning-red transition-[filter] hover:brightness-110"
                    >
                      <LogOut size={14} />
                      SAIR
                    </button>
                  </div>
                </motion.div>
              ) : (
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
