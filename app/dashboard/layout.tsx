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
    if (!user || user.role === "student") return
    loadPendingRequests()
    const interval = window.setInterval(loadPendingRequests, 5000)
    return () => window.clearInterval(interval)
  }, [user, loadPendingRequests])

  // Close search bar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSearchBarOpen(false); setSearchQuery(""); setSearchResults([]) }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const openSearch = useCallback(() => {
    setRequestsOpen(false)
    setSearchBarOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchBarOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }, [])

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
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
            <Image
              src="/images/djon-verde.png"
              alt="DJ ON Academy"
              width={88}
              height={28}
              className="h-7 w-auto"
            />
            <span className="text-[9px] text-[#AFFF00] font-black tracking-[0.2em] uppercase hidden sm:block">Portal</span>
          </Link>

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
                      ? "bg-[#AFFF00] text-[#121212]"
                      : "text-white/50 hover:text-white hover:bg-white/8"
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
                  setRequestsOpen((v) => {
                    const next = !v
                    if (next) closeSearch()
                    return next
                  })
                }}
                className={`cursor-pointer relative p-2 rounded-full transition-all ${requestsOpen ? "bg-[#AFFF00] text-[#121212]" : "text-white/40 hover:text-white hover:bg-white/8"}`}
                aria-label="Solicitações pendentes"
              >
                <Bell size={16} />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#AFFF00] text-[#121212] text-[9px] font-black flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {requestsOpen && (
                  <motion.div
                    className="absolute right-0 top-[calc(100%+18px)] w-[360px] z-50 rounded-2xl overflow-hidden border border-white/10 bg-[#111]/95 backdrop-blur-xl shadow-2xl"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-white text-sm font-black tracking-tight">Solicitações de treino</p>
                      <p className="text-white/30 text-[11px] font-bold mt-0.5">
                        {pendingRequests.length === 0 ? "Nenhuma pendência agora" : `${pendingRequests.length} aguardando aprovação`}
                      </p>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <CheckCircle size={24} className="text-[#AFFF00]/60 mx-auto mb-2" />
                        <p className="text-white/30 text-xs font-bold">Tudo em dia.</p>
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
                            <div key={request.id} className="rounded-xl px-3 py-3 bg-white/4 border border-white/6">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0">
                                  <span className="text-[#AFFF00] text-xs font-black">{student?.name.charAt(0) ?? "?"}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-white text-xs font-black truncate">{request.title}</p>
                                  <p className="text-white/35 text-[11px] font-bold mt-0.5 truncate">{student?.name ?? "Aluno"}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-white/35 text-[10px] font-bold">
                                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(request.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} />{request.time}</span>
                                  </div>
                                  {request.notes && (
                                    <p className="text-white/25 text-[11px] leading-relaxed mt-2 line-clamp-2">{request.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="cursor-pointer flex-1 bg-[#AFFF00] text-[#121212] rounded-lg py-2 text-[10px] font-black tracking-widest"
                                >
                                  APROVAR
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="cursor-pointer flex-1 border border-red-400/20 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg py-2 text-[10px] font-black tracking-widest text-center"
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
            className={`cursor-pointer p-2 rounded-full transition-all ${searchBarOpen ? "bg-[#AFFF00] text-[#121212]" : "text-white/40 hover:text-white hover:bg-white/8"}`}
            aria-label="Buscar"
          >
            {searchBarOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Search dropdown panel — anchored to right side */}
          <AnimatePresence>
            {searchBarOpen && (
              <motion.div
                className="absolute right-0 top-[calc(100%+18px)] w-[480px] z-50 rounded-2xl overflow-hidden"
                style={{ background: "rgba(12,12,12,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <div className="px-3 py-3">
                  {/* Input pill */}
                  <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-full px-4 py-2.5">
                    <Search size={14} className="text-white/30 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => runSearch(e.target.value)}
                      placeholder="Buscar alunos, professores, eventos..."
                      className="bg-transparent text-white text-sm font-medium placeholder:text-white/25 outline-none flex-1"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setSearchResults([]); searchInputRef.current?.focus() }}
                        className="cursor-pointer text-white/25 hover:text-white transition-colors"
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
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0 overflow-hidden">
                                {u.avatar
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                  : <span className="text-[#AFFF00] text-[11px] font-black">{u.name.charAt(0)}</span>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">{u.name}</p>
                                <p className="text-white/30 text-[10px] tracking-widest uppercase">{rLabel}</p>
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                              <Music2 size={12} className="text-white/40" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-bold truncate">{ev.title}</p>
                              <p className="text-white/30 text-[10px] truncate">{ev.location}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                  {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <motion.p
                      className="px-4 pb-4 text-white/20 text-xs text-center"
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
                onClick={() => setDropdownOpen((v) => !v)}
                className="cursor-pointer flex items-center gap-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-full pl-1 pr-3 py-1 transition-all"
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-8 h-8 rounded-full bg-[#AFFF00]/20 border border-[#AFFF00]/40 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#AFFF00] text-xs font-black">{user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-xs font-bold leading-tight truncate max-w-[120px]">
                    {user.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="text-[#AFFF00] text-[9px] font-black tracking-widest uppercase leading-tight">{roleLabel}</p>
                </div>
                <ChevronDown size={12} className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-white/12 rounded-2xl py-2 shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-white/8 mb-1">
                      <p className="text-white text-sm font-black truncate">{user.name}</p>
                      <p className="text-white/40 text-xs truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href={perfilHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/6 text-xs font-bold tracking-wide transition-all"
                    >
                      <User size={13} />
                      Editar Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold tracking-wide transition-all"
                    >
                      <LogOut size={13} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="cursor-pointer md:hidden text-white/60 hover:text-white p-2"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-white/8 bg-[#0a0a0a]"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="px-4 py-3 flex flex-col gap-1">
                {nav.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                        active ? "bg-[#AFFF00] text-[#121212]" : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16">{children}</main>
    </div>
  )
}
