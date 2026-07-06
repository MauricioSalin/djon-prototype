"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Users, Music2, CalendarPlus, Newspaper, ArrowRight, CheckCircle, AlertCircle, GraduationCap, Calendar } from "lucide-react"
import { store, type Booking } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, events: 0, bookings: 0, djOnEvents: 0 })
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const allUsers = store.getUsers().filter((u) => u.role === "student")
    const allBookings = store.getBookings()
    setStats({
      users: allUsers.length,
      events: store.getStudentEvents().length,
      bookings: allBookings.length,
      djOnEvents: store.getProfessors().length,
    })
    setBookings(
      allBookings
        .filter((b) => new Date(b.date + "T00:00:00") >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)
    )
  }, [])

  const statCards = [
    { label: "Alunos", value: stats.users, accent: "#AFFF00" },
    { label: "Agendamentos", value: stats.bookings, accent: "#AFFF00" },
    { label: "Eventos Alunos", value: stats.events, accent: "#AFFF00" },
    { label: "Professores", value: stats.djOnEvents, accent: "#AFFF00" },
  ]

  const quickLinks = [
    { label: "Alunos", href: "/dashboard/admin/alunos", icon: Users, desc: "Cadastrar e gerenciar" },
    { label: "Professores", href: "/dashboard/admin/professores", icon: GraduationCap, desc: "Equipe de professores" },
    { label: "Eventos", href: "/dashboard/admin/eventos", icon: Music2, desc: "Mural e DJ ON" },
    { label: "Agenda", href: "/dashboard/agenda", icon: Calendar, desc: "Calendário completo" },
    { label: "Mural", href: "/dashboard/mural", icon: Newspaper, desc: "Ver todos os eventos" },
    { label: "Agendar", href: "/dashboard/admin/agendar", icon: CalendarPlus, desc: "Gestão de aulas" },
  ]

  return (
    <div className="bg-[#0a0a0a]">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.span className="block text-[#AFFF00] text-xs tracking-[0.25em] font-black uppercase mb-4" {...fadeUp(0.1)}>
            PAINEL ADMINISTRATIVO
          </motion.span>
          <motion.h1
            className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-6"
            {...fadeUp(0.2)}
          >
            DJ ON<br />
            <span style={{ color: "#AFFF00", WebkitTextStroke: "2px #0a0a0a", paintOrder: "stroke fill", letterSpacing: "0.04em" }}>
              Academy.
            </span>
          </motion.h1>
          <motion.p className="text-white/40 text-base max-w-md leading-relaxed" {...fadeUp(0.3)}>
            Gerencie alunos, eventos e agendamentos da academia em um só lugar.
          </motion.p>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            NÚMEROS
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2" {...fadeUp(0.1)}>
            Visão Geral
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                className="bg-[#161616] border border-white/8 rounded-2xl p-6 hover:border-[#AFFF00]/20 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <p className="text-5xl font-black tracking-tighter mb-2" style={{ color: s.accent }}>{s.value}</p>
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase">{s.label}</p>
                <div className="h-[2px] bg-[#AFFF00]/30 rounded-full mt-4" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            ACESSO RÁPIDO
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2" {...fadeUp(0.1)}>
            Gerenciar
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickLinks.map((q, i) => (
              <motion.div
                key={q.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
              >
                <Link
                  href={q.href}
                  className="group flex flex-col gap-4 bg-[#161616] border border-white/8 hover:border-[#AFFF00]/30 rounded-2xl p-6 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#AFFF00]/10 flex items-center justify-center group-hover:bg-[#AFFF00]/20 transition-colors">
                    <q.icon size={20} className="text-[#AFFF00]" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base tracking-tight">{q.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{q.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-[#AFFF00] transition-colors mt-auto" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proximos agendamentos */}
      <section className="py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                AGENDA
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter" {...fadeUp(0.1)}>
                Próximos Agendamentos
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mt-3" {...fadeUp(0.15)} />
            </div>
            <motion.div {...fadeUp(0.1)}>
              <Link
                href="/dashboard/agenda"
                className="flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-6 py-3 rounded-full font-black text-sm tracking-widest hover:opacity-90 transition-opacity"
              >
                <Calendar size={15} /> VER AGENDA COMPLETA
              </Link>
            </motion.div>
          </div>

          {bookings.length === 0 ? (
            <motion.div className="border-2 border-dashed border-white/8 rounded-3xl p-16 text-center" {...fadeUp(0.2)}>
              <CalendarPlus size={40} className="text-white/12 mx-auto mb-4" />
              <p className="text-white/20 text-sm font-bold">Nenhum agendamento futuro.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((b, i) => {
                const owner = store.getUserById(b.userId)
                return (
                  <motion.div
                    key={b.id}
                    className="bg-[#161616] border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-all"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0">
                        <span className="text-[#AFFF00] text-sm font-black">{owner?.name.charAt(0) ?? "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-black truncate">{owner?.name}</p>
                        <p className="text-white/30 text-[10px] capitalize">{b.type}</p>
                      </div>
                      {b.status === "confirmado"
                        ? <CheckCircle size={14} className="text-[#AFFF00] shrink-0" />
                        : <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                      }
                    </div>
                    <h3 className="text-white font-black text-base tracking-tight mb-2">{b.title}</h3>
                    <p className="text-white/40 text-xs">
                      {new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às {b.time}
                    </p>
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
