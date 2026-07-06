"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  CalendarPlus, Users, Newspaper, User, LogOut, Music2,
  ChevronDown, Home, Menu, X, Calendar, GraduationCap,
  Search, BookOpen, Bell, CheckCircle, Clock,
} from "lucide-react"
import { store, type User as StoreUser, type DJEvent, type Booking } from "@/lib/store"

const studentNav = [
  { label: "Início", href: "/dashboard/student", icon: Home },
  { label: "Agendar", href: "/dashboard/student/agendar", icon: CalendarPlus },
  { label: "Meus Eventos", href: "/dashboard/student/evento", icon: Music2 },
  { label: "Professores", href: "/dashboard/student/professores", icon: GraduationCap },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Mural de GIGs", href: "/dashboard/mural", icon: Newspaper },
]

const adminNav = [
  { label: "Início", href: "/dashboard/admin", icon: Home },
  { label: "Alunos", href: "/dashboard/admin/alunos", icon: Users },
  { label: "Professores", href: "/dashboard/admin/professores", icon: GraduationCap },
  { label: "Eventos", href: "/dashboard/admin/eventos", icon: Music2 },
  { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Mural de GIGs", href: "/dashboard/mural", icon: Newspaper },
]

const professorNav = [
  { label: "Início", href: "/dashboard/professor", icon: Home },
  { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { label: "Alunos", href: "/dashboard/professor/alunos", icon: Users },
  { label: "Professores", href: "/dashboard/professor/professores", icon: GraduationCap },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Mural de GIGs", href: "/dashboard/mural", icon: Newspaper },
]

function getNav(role: string) {
  if (role === "admin") return adminNav
  if (role === "professor") return professorNav
  return studentNav
}

function getPerfilHref(user: StoreUser) {
  if (user.role === "admin") return `/dashboard/perfil/${user.id}`
  if (user.role === "professor") return `/dashboard/perfil/${user.id}`
  return `/dashboard/student/perfil`
}

type SearchResult =
  | { kind: "user"; item: StoreUser }
  | { kind: "event"; item: DJEvent }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<StoreUser | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchBarOpen, setSearchBarOpen] = useState(false)
  const [requestsOpen, setRequestsOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const requestsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadPendingRequests = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requests = store.getBookings()
      .filter((b) => b.type === "treino" && b.status === "pendente" && new Date(b.date + "T00:00:00") >= today)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    setPendingRequests(requests)
  }, [])

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)
  }, [router])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (requestsRef.current && !requestsRef.current.contains(e.target as Node)) {
        setRequestsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
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

  useEffect(() => {
    if (!user || user.role === "student") return
    loadPendingRequests()
    const interval = window.setInterval(loadPendingRequests, 5000)
    return () => window.clearInterval(interval)
  }, [user, loadPendingRequests])

  // Close search bar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchBarOpen(false)
        setSearchQuery("")
        setSearchResults([])
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const openSearch = useCallback(() => {
    setRequestsOpen(false)
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    setSearchBarOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchBarOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((v) => {
      const next = !v
      if (next) {
        closeSearch()
        setRequestsOpen(false)
        setDropdownOpen(false)
      }
      return next
    })
  }, [closeSearch])

  const runSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    const lq = q.toLowerCase()
    const allUsers = store.getUsers().filter(
      (u) => u.name.toLowerCase().includes(lq) || u.email.toLowerCase().includes(lq)
    )
    const allEvents = store.getEvents().filter(
      (e) => e.title.toLowerCase().includes(lq) || e.location.toLowerCase().includes(lq)
    )
    const results: SearchResult[] = [
      ...allUsers.slice(0, 5).map((item) => ({ kind: "user" as const, item })),
      ...allEvents.slice(0, 5).map((item) => ({ kind: "event" as const, item })),
    ]
    setSearchResults(results)
  }, [])

  if (!user) return null

  const nav = getNav(user.role)
  const perfilHref = getPerfilHref(user)

  const handleLogout = () => {
    store.logout()
    router.push("/")
  }

  const handleApproveRequest = (id: string) => {
    store.updateBooking(id, { status: "confirmado" })
    loadPendingRequests()
  }

  const handleRejectRequest = (id: string) => {
    store.updateBooking(id, { status: "cancelado" })
    loadPendingRequests()
  }

  const roleLabel = user.role === "admin" ? "Admin" : user.role === "professor" ? "Professor" : "Aluno"
  const canReviewRequests = user.role === "admin" || user.role === "professor"

  return (
    <div className="min-h-screen bg-djon-page">
      <header className="fixed top-0 left-0 right-0 z-50 bg-djon-page/95 backdrop-blur-xl border-b border-djon-text/8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 sm:mr-2">
            <Image
              src="/images/djon-verde.png"
              alt="DJ ON Academy"
              width={88}
              height={28}
              className="h-6 w-auto sm:h-7"
            />
            <span className="text-djon-caption text-djon-accent font-black tracking-[0.2em] uppercase hidden sm:block">Portal</span>
          </Link>

          <button
            className="cursor-pointer md:hidden text-djon-text/60 hover:text-djon-text p-2"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {nav.map((item) => {
              const isHome = item.label === "Início"
              const active = isHome
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                    active
                      ? "bg-djon-accent text-djon-ink"
                      : "text-djon-text/50 hover:text-djon-text hover:bg-djon-text/8"
                  }`}
                >
                  <item.icon size={13} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Search icon + avatar */}
          <div className="ml-auto flex items-center gap-2 relative">

          {/* Search icon button */}
          {canReviewRequests && (
            <div className="relative" ref={requestsRef}>
              <button
                onClick={() => {
                  loadPendingRequests()
                  setMobileMenuOpen(false)
                  setDropdownOpen(false)
                  setRequestsOpen((v) => {
                    const next = !v
                    if (next) closeSearch()
                    return next
                  })
                }}
                className={`cursor-pointer relative p-2 rounded-full transition-all ${requestsOpen ? "bg-djon-accent text-djon-ink" : "text-djon-text/40 hover:text-djon-text hover:bg-djon-text/8"}`}
                aria-label="Solicitações pendentes"
              >
                <Bell size={16} />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-djon-accent text-djon-ink text-djon-caption font-black flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {requestsOpen && (
                  <motion.div
                    className="absolute right-0 top-[calc(100%+18px)] z-50 w-[min(360px,calc(100vw-1rem))] rounded-2xl overflow-hidden border border-djon-text/10 bg-djon-calendar-cell/95 backdrop-blur-xl shadow-2xl max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.5rem] max-sm:w-auto"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <div className="px-4 py-3 border-b border-djon-text/8">
                      <p className="text-djon-text text-sm font-black tracking-tight">Solicitações de treino</p>
                      <p className="text-djon-text/30 text-djon-meta font-bold mt-0.5">
                        {pendingRequests.length === 0 ? "Nenhuma pendência agora" : `${pendingRequests.length} aguardando aprovação`}
                      </p>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <CheckCircle size={24} className="text-djon-accent/60 mx-auto mb-2" />
                        <p className="text-djon-text/30 text-xs font-bold">Tudo em dia.</p>
                      </div>
                    ) : (
                      <div
                        className="djon-scroll max-h-[360px] overflow-y-auto overscroll-contain p-2 pr-1.5 space-y-1"
                        data-lenis-prevent="true"
                        data-lenis-prevent-wheel="true"
                        data-lenis-prevent-touch="true"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        {pendingRequests.map((request) => {
                          const student = store.getUserById(request.userId)
                          return (
                            <div key={request.id} className="rounded-xl px-3 py-3 bg-djon-text/4 border border-djon-text/6">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-djon-accent/15 flex items-center justify-center shrink-0">
                                  <span className="text-djon-accent text-xs font-black">{student?.name.charAt(0) ?? "?"}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-djon-text text-xs font-black truncate">{request.title}</p>
                                  <p className="text-djon-text/35 text-djon-meta font-bold mt-0.5 truncate">{student?.name ?? "Aluno"}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-djon-text/35 text-djon-label font-bold">
                                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(request.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} />{request.time}</span>
                                  </div>
                                  {request.notes && (
                                    <p className="text-djon-text/25 text-djon-meta leading-relaxed mt-2 line-clamp-2">{request.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="cursor-pointer flex-1 bg-djon-accent text-djon-ink rounded-lg py-2 text-djon-label font-black tracking-widest"
                                >
                                  APROVAR
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="cursor-pointer flex-1 border border-djon-danger/20 text-djon-danger/70 hover:text-djon-danger hover:bg-djon-danger/10 rounded-lg py-2 text-djon-label font-black tracking-widest text-center"
                                >
                                  RECUSAR
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={searchBarOpen ? closeSearch : openSearch}
            className={`cursor-pointer p-2 rounded-full transition-all ${searchBarOpen ? "bg-djon-accent text-djon-ink" : "text-djon-text/40 hover:text-djon-text hover:bg-djon-text/8"}`}
            aria-label="Buscar"
          >
            {searchBarOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Search dropdown panel — anchored to right side */}
          <AnimatePresence>
            {searchBarOpen && (
              <motion.div
                className="absolute right-0 top-[calc(100%+18px)] z-50 w-[min(480px,calc(100vw-1rem))] rounded-2xl overflow-hidden max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.5rem] max-sm:w-auto"
                style={{ background: "rgba(12,12,12,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <div className="px-3 py-3">
                  {/* Input pill */}
                  <div className="flex items-center gap-3 bg-djon-surface-3 rounded-full px-4 py-2.5">
                    <Search size={14} className="text-djon-text/30 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => runSearch(e.target.value)}
                      placeholder="Buscar alunos, professores, eventos..."
                      className="bg-transparent text-djon-text text-sm font-medium placeholder:text-djon-text/25 outline-none flex-1"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setSearchResults([]); searchInputRef.current?.focus() }}
                        className="cursor-pointer text-djon-text/25 hover:text-djon-text transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      className="djon-scroll max-h-[360px] overflow-y-auto overscroll-contain px-2 pb-2 pr-1.5 flex flex-col"
                      data-lenis-prevent="true"
                      data-lenis-prevent-wheel="true"
                      data-lenis-prevent-touch="true"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {searchResults.map((r, i) => {
                        if (r.kind === "user") {
                          const u = r.item
                          const rLabel = u.role === "admin" ? "Admin" : u.role === "professor" ? "Professor" : "Aluno"
                          const href = u.role === "student" ? `/dashboard/admin/alunos` : `/dashboard/perfil/${u.id}`
                          return (
                            <Link
                              key={i}
                              href={href}
                              onClick={closeSearch}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-djon-text/6 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-djon-accent/15 flex items-center justify-center shrink-0 overflow-hidden">
                                {u.avatar
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                  : <span className="text-djon-accent text-djon-meta font-black">{u.name.charAt(0)}</span>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-djon-text text-xs font-bold truncate">{u.name}</p>
                                <p className="text-djon-text/30 text-djon-label tracking-widest uppercase">{rLabel}</p>
                              </div>
                            </Link>
                          )
                        }
                        const ev = r.item
                        return (
                          <Link
                            key={i}
                            href="/dashboard/mural"
                            onClick={closeSearch}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-djon-text/6 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-djon-text/8 flex items-center justify-center shrink-0">
                              <Music2 size={12} className="text-djon-text/40" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-djon-text text-xs font-bold truncate">{ev.title}</p>
                              <p className="text-djon-text/30 text-djon-label truncate">{ev.location}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                  {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <motion.p
                      className="px-4 pb-4 text-djon-text/20 text-xs text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Nenhum resultado para &quot;{searchQuery}&quot;
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => {
                  closeSearch()
                  setRequestsOpen(false)
                  setMobileMenuOpen(false)
                  setDropdownOpen((v) => !v)
                }}
                className="cursor-pointer flex items-center gap-2 bg-djon-text/6 hover:bg-djon-text/10 border border-djon-text/10 rounded-full pl-1 pr-2 py-1 transition-all sm:gap-2.5 sm:pr-3"
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-8 h-8 rounded-full bg-djon-accent/20 border border-djon-accent/40 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-djon-accent text-xs font-black">{user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-djon-text text-xs font-bold leading-tight truncate max-w-[120px]">
                    {user.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="text-djon-accent text-djon-caption font-black tracking-widest uppercase leading-tight">{roleLabel}</p>
                </div>
                <ChevronDown size={12} className={`text-djon-text/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-[min(13rem,calc(100vw-1rem))] bg-djon-surface border border-djon-text/12 rounded-2xl py-2 shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-djon-text/8 mb-1">
                      <p className="text-djon-text text-sm font-black truncate">{user.name}</p>
                      <p className="text-djon-text/40 text-xs truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href={perfilHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-djon-text/60 hover:text-djon-text hover:bg-djon-text/6 text-xs font-bold tracking-wide transition-all"
                    >
                      <User size={13} />
                      Editar Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-djon-danger/70 hover:text-djon-danger hover:bg-djon-danger/10 text-xs font-bold tracking-wide transition-all"
                    >
                      <LogOut size={13} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="fixed inset-x-0 bottom-0 top-16 z-40 bg-djon-mobile-overlay md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.nav
                className="djon-scroll max-h-full overflow-y-auto border-t border-djon-text/8 bg-djon-page px-3 py-5 pb-10 sm:px-4"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                data-lenis-prevent
                data-lenis-prevent-wheel
                data-lenis-prevent-touch
              >
                <div className="flex flex-col gap-1">
                {nav.map((item) => {
                  const isHome = item.label === "Início"
                  const active = isHome
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                        active ? "bg-djon-accent text-djon-ink" : "text-djon-text/50 hover:text-djon-text hover:bg-djon-text/5"
                      }`}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  )
                })}
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16 overflow-x-hidden">{children}</main>
    </div>
  )
}
