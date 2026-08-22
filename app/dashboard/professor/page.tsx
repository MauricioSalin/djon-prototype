"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  Calendar, Users, GraduationCap,
  Clock, Music2,
} from "lucide-react"
import {
  store,
  type Booking,
  type Equipment,
  type Unit,
  type User,
} from "@/lib/store"
import {
  BookingDetailsDialog,
  type BookingWithUser,
} from "@/components/booking-details-dialog"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
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
  cancelado: {
    badge: "bg-djon-warning-red/10 border-djon-warning-red/20 text-djon-warning-red",
    dot: "bg-djon-warning-red",
    label: "Cancelado",
  },
} as const

function professorBookings(allBookings: Booking[], professor: User) {
  return allBookings.filter(
    (booking) =>
      booking.professorId === professor.id ||
      (booking.type === "treino" &&
        booking.status === "pendente" &&
        (!professor.unitId || booking.unitId === professor.unitId)),
  )
}

export default function ProfessorHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [professors, setProfessors] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [selected, setSelected] = useState<BookingWithUser | null>(null)

  useEffect(() => {
    let mounted = true
    void store.bootstrap().then(async (u) => {
      if (!mounted) return
      if (!u) { router.replace("/login"); return }
      if (u.role !== "professor") { router.replace("/dashboard/student"); return }

      try {
        await store.refreshBookings(true)
      } catch {
        // A API já informa a falha; o cache atual mantém a página utilizável.
      }
      if (!mounted) return

      setUser(u)
      setBookings(professorBookings(store.getBookings(), u))
      setStudents(store.getStudents().filter((student) => student.active !== false))
      setProfessors(store.getProfessors().filter((professor) => professor.active !== false))
      setUnits(store.getUnits().filter((unit) => unit.active))
      setEquipments(store.getEquipments().filter((equipment) => equipment.active))
    })
    return () => { mounted = false }
  }, [router])

  if (!user) return <DashboardPageSkeleton variant="dashboard" />

  const upcoming = bookings
    .filter((b) => new Date(`${b.date}T${b.time}`) >= new Date() && b.status !== "cancelado")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 6)

  const confirmed = bookings.filter((b) => b.status === "confirmado").length

  const syncBookings = () => {
    const currentUser = store.getCurrentUser()
    if (!currentUser || currentUser.role !== "professor") return
    setBookings(professorBookings(store.getBookings(), currentUser))
  }

  const handleSaved = (updated: BookingWithUser) => {
    syncBookings()
    setSelected(updated)
  }

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

  const quickLinks = [
    { label: "Agenda Completa", desc: "Todos os agendamentos", href: "/dashboard/agenda", icon: Calendar },
    { label: "Meus Eventos", desc: "Divulgue onde você vai tocar", href: "/dashboard/professor/evento", icon: Music2 },
    { label: "Alunos", desc: "Veja os perfis dos alunos", href: "/dashboard/professor/alunos", icon: Users },
    { label: "Professores", desc: "Equipe da DJ ON Academy", href: "/dashboard/professor/professores", icon: GraduationCap },
  ]

  return (
    <div className="bg-djon-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/djon-showcase.png" alt="" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/80 to-djon-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <motion.span
              className="inline-block text-djon-accent text-xs tracking-[0.2em] font-black uppercase mb-4"
              {...fadeUp(0.1)}
            >
              PROFESSOR
            </motion.span>

            <motion.h1
              className="djon-hero-title font-black text-djon-text mb-6"
              {...fadeUp(0.2)}
            >
              {user.name.split(" ")[0]},<br />
              <span
                style={{
                  color: "var(--djon-color-accent)",
                  WebkitTextStroke: "2px var(--djon-color-page)",
                  paintOrder: "stroke fill",
                }}
              >
                pronto pra
              </span>
              <br />
              ensinar?
            </motion.h1>

            <motion.p
              className="text-djon-text/50 text-base leading-relaxed max-w-lg mb-8"
              {...fadeUp(0.3)}
            >
              {upcoming.length > 0
                ? `Você tem ${upcoming.length} agendamento${upcoming.length > 1 ? "s" : ""} próximo${upcoming.length > 1 ? "s" : ""}. Confira sua agenda.`
                : "Nenhum agendamento próximo. Tudo tranquilo por enquanto."}
            </motion.p>

            <motion.div className="flex flex-wrap gap-3" {...fadeUp(0.4)}>
              <Link href="/dashboard/agenda" className="w-full sm:w-auto">
                <motion.div
                  className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink group"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <Calendar size={15} className="relative z-10" />
                  <span className="relative z-10">VER AGENDA</span>
                </motion.div>
              </Link>
              <Link href="/dashboard/professor/alunos" className="w-full sm:w-auto">
                <motion.div
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-djon-text/20 px-6 py-3 text-sm font-black tracking-widest text-djon-text transition-[filter] hover:brightness-110"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Users size={15} />
                  MEUS ALUNOS
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            NÚMEROS
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
            Visão Geral
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Alunos Ativos", value: students.length },
              { label: "Agendamentos", value: bookings.length },
              { label: "Confirmados", value: confirmed },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-6 hover:brightness-110 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <p className="text-5xl font-black tracking-tighter mb-2 text-djon-accent">{s.value}</p>
                <p className="text-djon-text/40 text-xs font-bold tracking-widest uppercase">{s.label}</p>
                <div className="h-[2px] bg-djon-accent/30 rounded-full mt-4" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-16 bg-djon-page sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            ACESSO RÁPIDO
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
            Navegar
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map((q, i) => (
              <motion.div
                key={q.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <Link
                  href={q.href}
                  className="group flex flex-col gap-4 bg-djon-surface-2 border border-djon-text/8 hover:brightness-110 rounded-2xl p-6 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-djon-accent/10 flex items-center justify-center group-hover:brightness-110 transition-colors">
                    <q.icon size={20} className="text-djon-accent" />
                  </div>
                  <div>
                    <p className="text-djon-text font-black text-base tracking-tight group-hover:brightness-110 transition-colors">{q.label}</p>
                    <p className="text-djon-text/30 text-xs mt-0.5">{q.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRÓXIMOS AGENDAMENTOS ────────────────────────────────────────── */}
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

          {upcoming.length === 0 ? (
            <motion.div
              className="rounded-2xl border-2 border-dashed border-djon-text/10 p-8 text-center sm:p-16"
              {...fadeUp(0.2)}
            >
              <Calendar size={40} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/30 text-sm font-bold">Nenhum agendamento futuro.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((b, i) => {
                const student = store.getUserById(b.userId)
                const studentName = student?.name ?? b.studentName ?? "Aluno"
                const status = bookingStatusMeta[b.status]
                return (
                  <motion.button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected({ ...b, student })}
                    aria-label={`Ver detalhes de ${b.title}`}
                    className="group cursor-pointer rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 text-left transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djon-accent/70"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="djon-avatar-fallback w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-djon-text font-black text-xs">{studentName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-djon-text text-xs font-black">{studentName}</p>
                          <p className="text-djon-text/30 text-djon-label capitalize">{b.type}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-djon-label font-black tracking-widest ${status.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-djon-text font-black text-base tracking-tight mb-3 leading-tight">{b.title}</h3>
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Clock size={11} />{fmt(b.date)} às {b.time}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <BookingDetailsDialog
            bk={selected}
            canEdit
            units={units}
            professors={professors}
            equipments={equipments}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
            onRemoved={syncBookings}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
