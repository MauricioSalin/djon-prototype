"use client"

import { usePortalRevision } from "@/hooks/use-portal-revision";
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { Users, Music2, CalendarPlus, Newspaper, GraduationCap, Calendar } from "lucide-react"
import { hasPermission, store, type Booking } from "@/lib/store"
import {
  BookingDetailsDialog,
  type BookingWithUser,
} from "@/components/booking-details-dialog"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"
import { useLoadRecovery } from "@/hooks/use-load-recovery"
import { EditablePortalHero } from "@/components/portal/editable-portal-hero"
import { UpcomingEventsSection } from "@/components/portal/upcoming-events-section"
import {
  ADMIN_HOME_HERO,
  HOME_HERO_SECTIONS,
} from "@/lib/portal-hero-groups"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const bookingStatusMeta = {
  confirmado: {
    badge: "bg-djon-success/10 border-djon-success/20 text-djon-success",
    dot: "bg-djon-success",
    label: "Confirmado",
  },
  pendente: {
    badge: "bg-djon-light-purple/10 border-djon-light-purple/20 text-djon-light-purple",
    dot: "bg-djon-light-purple",
    label: "Pendente",
  },
  recusado: {
    badge: "bg-djon-warning-red/10 border-djon-warning-red/20 text-djon-warning-red",
    dot: "bg-djon-warning-red",
    label: "Recusado",
  },
  cancelado: {
    badge: "bg-djon-warning-red/10 border-djon-warning-red/20 text-djon-warning-red",
    dot: "bg-djon-warning-red",
    label: "Cancelado",
  },
} as const

export default function AdminPage() {
  const dataRevision = usePortalRevision("users", "bookings", "events");
  const [loadError, setLoadError] = useState<unknown>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  useLoadRecovery(loadError, setLoadAttempt)
  const [stats, setStats] = useState({ users: 0, events: 0, bookings: 0, djOnEvents: 0 })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<BookingWithUser | null>(null)
  const [loading, setLoading] = useState(true)

  const syncBookings = () => {
    const activeBookings = store
      .getBookings()
      .filter(
        (booking) =>
          booking.status !== "cancelado" && booking.status !== "recusado",
      )
    const now = new Date()
    setStats((current) => ({ ...current, bookings: activeBookings.length }))
    setBookings(
      activeBookings
        .filter((booking) => new Date(`${booking.date}T${booking.time}`) >= now)
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() -
            new Date(`${b.date}T${b.time}`).getTime(),
        )
        .slice(0, 6),
    )
  }

  const handleSaved = (updated: BookingWithUser) => {
    syncBookings()
    setSelected(updated)
  }

  useEffect(() => {
    let mounted = true
    setLoadError(null)
    void store.bootstrap()
      .then(async (authenticatedUser) => {
        if (hasPermission(authenticatedUser, "admin.access")) {
          await store.synchronize(["users", "bookings", "events"])
        }
        return authenticatedUser
      })
      .then((authenticatedUser) => {
        if (!mounted || !hasPermission(authenticatedUser, "admin.access")) return
        const allUsers = store.getUsers()
        const allBookings = store.getBookings()
        const activeBookings = allBookings.filter(
          (booking) =>
            booking.status !== "cancelado" && booking.status !== "recusado",
        )
        const now = new Date()
        setStats({
          users: allUsers.filter((user) => user.role === "student" && user.active !== false).length,
          events: store.getStudentEvents().length,
          bookings: activeBookings.length,
          djOnEvents: allUsers.filter((user) => user.role === "professor" && user.active !== false).length,
        })
        setBookings(
          activeBookings
            .filter((booking) => new Date(`${booking.date}T${booking.time}`) >= now)
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`).getTime() -
                new Date(`${b.date}T${b.time}`).getTime(),
            )
            .slice(0, 6),
        )
      })
      .catch((error: unknown) => { if (mounted) setLoadError(error) })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [loadAttempt, dataRevision])

  const statCards = [
    { label: "Alunos", value: stats.users, accent: "var(--djon-color-accent)" },
    { label: "Agendamentos", value: stats.bookings, accent: "var(--djon-color-accent)" },
    { label: "Eventos Alunos", value: stats.events, accent: "var(--djon-color-accent)" },
    { label: "Professores", value: stats.djOnEvents, accent: "var(--djon-color-accent)" },
  ]

  const quickLinks = [
    { label: "Alunos", href: "/dashboard/admin/alunos", icon: Users, desc: "Cadastrar e gerenciar" },
    { label: "Professores", href: "/dashboard/admin/professores", icon: GraduationCap, desc: "Equipe de professores" },
    { label: "Eventos", href: "/dashboard/admin/eventos", icon: Music2, desc: "Mural e DJ ON" },
    { label: "Agenda", href: "/dashboard/agenda", icon: Calendar, desc: "Calendário completo" },
    { label: "Mural", href: "/dashboard/mural", icon: Newspaper, desc: "Ver todos os eventos" },
  ]

  if (loadError || loading) return <DashboardPageSkeleton variant="admin-dashboard" />

  return (
    <div className="bg-djon-page">

      <EditablePortalHero
        heroKey="admin-home"
        defaults={ADMIN_HOME_HERO}
        bannerKey="admin-home"
        editorSections={HOME_HERO_SECTIONS}
        accentLines={[1]}
        showDivider={false}
      />

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            NÚMEROS
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
            Visão Geral
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-6 hover:brightness-110 transition-all"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <p className="text-5xl font-black tracking-tighter mb-2" style={{ color: s.accent }}>{s.value}</p>
                <p className="text-djon-text/40 text-xs font-bold tracking-widest uppercase">{s.label}</p>
                <div className="h-[2px] bg-djon-accent/30 rounded-full mt-4" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-page sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            ACESSO RÁPIDO
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
            Gerenciar
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickLinks.map((q, i) => (
              <motion.div
                key={q.href}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
              >
                <Link
                  href={q.href}
                  className="group flex flex-col gap-4 bg-djon-surface-2 border border-djon-text/8 hover:brightness-110 rounded-2xl p-6 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-djon-accent/10 flex items-center justify-center group-hover:brightness-110 transition-colors">
                    <q.icon size={20} className="text-djon-accent" />
                  </div>
                  <div>
                    <p className="text-djon-text font-black text-base tracking-tight">{q.label}</p>
                    <p className="text-djon-text/30 text-xs mt-0.5">{q.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proximos agendamentos */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                AGENDA
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter" {...fadeUp(0.1)}>
                Próximos Agendamentos
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-3" {...fadeUp(0.15)} />
            </div>
            <motion.div {...fadeUp(0.1)}>
              <Link
                href="/dashboard/agenda"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:w-auto"
              >
                <Calendar size={15} /> VER AGENDA COMPLETA
              </Link>
            </motion.div>
          </div>

          {bookings.length === 0 ? (
            <motion.div className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-16" {...fadeUp(0.2)}>
              <CalendarPlus size={40} className="text-djon-text/12 mx-auto mb-4" />
              <p className="text-djon-text/20 text-sm font-bold">Nenhum agendamento futuro.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((b, i) => {
                const owner = store.getUserById(b.userId)
                const ownerName = owner?.name ?? b.studentName ?? "Aluno"
                const status = bookingStatusMeta[b.status]
                return (
                  <motion.button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected({ ...b, student: owner ?? null })}
                    aria-label={`Ver detalhes de ${b.title}`}
                    className="group cursor-pointer rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 text-left transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djon-accent/70"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="djon-avatar-fallback w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-djon-accent text-sm font-black">{ownerName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-djon-text text-xs font-black truncate">{ownerName}</p>
                        <p className="text-djon-text/30 text-djon-label capitalize">{b.type}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-djon-label font-black tracking-widest ${status.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-djon-text font-black text-base tracking-tight mb-2">{b.title}</h3>
                    <p className="text-djon-text/40 text-xs">
                      {new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às {b.time}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <UpcomingEventsSection />

      <AnimatePresence>
        {selected && (
          <BookingDetailsDialog
            bk={selected}
            canEdit
            canRemove
            canReview
            units={store.getUnits().filter((unit) => unit.active)}
            professors={store
              .getProfessors()
              .filter((professor) => professor.active !== false)}
            equipments={store
              .getEquipments()
              .filter((equipment) => equipment.active)}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
            onRemoved={syncBookings}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
