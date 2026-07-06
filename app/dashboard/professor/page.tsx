"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Calendar, Users, GraduationCap, ArrowRight,
  Clock, CheckCircle, AlertCircle,
} from "lucide-react"
import { store, type User, type Booking } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

export default function ProfessorHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [students, setStudents] = useState<User[]>([])

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    if (u.role !== "professor") { router.replace("/dashboard/student"); return }
    setUser(u)
    setBookings(store.getBookings())
    setStudents(store.getStudents())
  }, [router])

  if (!user) return null

  const upcoming = bookings
    .filter((b) => new Date(`${b.date}T${b.time}`) >= new Date() && b.status !== "cancelado")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 6)

  const confirmed = bookings.filter((b) => b.status === "confirmado").length

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

  const quickLinks = [
    { label: "Agenda Completa", desc: "Todos os agendamentos", href: "/dashboard/agenda", icon: Calendar },
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
          <div className="absolute inset-0 bg-gradient-to-r from-djon-page via-djon-page/80 to-djon-page/40" />
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
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-djon-text/20 px-6 py-3 text-sm font-black tracking-widest text-djon-text"
                  whileHover={{ scale: 1.03, borderColor: "var(--djon-color-accent)", color: "var(--djon-color-accent)" }}
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
                className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-6 hover:border-djon-accent/20 transition-all"
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
                  className="group flex flex-col gap-4 bg-djon-surface-2 border border-djon-text/8 hover:border-djon-accent/30 rounded-2xl p-6 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-djon-accent/10 flex items-center justify-center group-hover:bg-djon-accent/20 transition-colors">
                    <q.icon size={20} className="text-djon-accent" />
                  </div>
                  <div>
                    <p className="text-djon-text font-black text-base tracking-tight group-hover:text-djon-accent transition-colors">{q.label}</p>
                    <p className="text-djon-text/30 text-xs mt-0.5">{q.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-djon-text/20 group-hover:text-djon-accent transition-colors mt-auto" />
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-opacity hover:opacity-90 sm:w-auto"
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
                return (
                  <motion.div
                    key={b.id}
                    className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-5 hover:border-djon-text/20 transition-all group"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-djon-accent/15 flex items-center justify-center shrink-0">
                          <span className="text-djon-accent font-black text-xs">{student?.name.charAt(0) ?? "?"}</span>
                        </div>
                        <div>
                          <p className="text-djon-text text-xs font-black">{student?.name}</p>
                          <p className="text-djon-text/30 text-djon-label capitalize">{b.type}</p>
                        </div>
                      </div>
                      {b.status === "confirmado"
                        ? <CheckCircle size={14} className="text-djon-accent" />
                        : <AlertCircle size={14} className="text-yellow-400" />
                      }
                    </div>
                    <h3 className="text-djon-text font-black text-base tracking-tight mb-3 leading-tight">{b.title}</h3>
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Clock size={11} />{fmt(b.date)} às {b.time}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
