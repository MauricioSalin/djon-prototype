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
    <div className="bg-[#0a0a0a]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/djon-showcase.png" alt="" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-3xl">
            <motion.span
              className="inline-block text-[#AFFF00] text-xs tracking-[0.2em] font-black uppercase mb-4"
              {...fadeUp(0.1)}
            >
              PROFESSOR
            </motion.span>

            <motion.h1
              className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-6"
              {...fadeUp(0.2)}
            >
              {user.name.split(" ")[0]},<br />
              <span
                style={{
                  color: "#AFFF00",
                  WebkitTextStroke: "2px #0a0a0a",
                  paintOrder: "stroke fill",
                }}
              >
                pronto pra
              </span>
              <br />
              ensinar?
            </motion.h1>

            <motion.p
              className="text-white/50 text-base leading-relaxed max-w-lg mb-8"
              {...fadeUp(0.3)}
            >
              {upcoming.length > 0
                ? `Você tem ${upcoming.length} agendamento${upcoming.length > 1 ? "s" : ""} próximo${upcoming.length > 1 ? "s" : ""}. Confira sua agenda.`
                : "Nenhum agendamento próximo. Tudo tranquilo por enquanto."}
            </motion.p>

            <motion.div className="flex flex-wrap gap-3" {...fadeUp(0.4)}>
              <Link href="/dashboard/agenda">
                <motion.div
                  className="flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-6 py-3 rounded-full font-black text-sm tracking-widest group overflow-hidden relative"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <Calendar size={15} className="relative z-10" />
                  <span className="relative z-10">VER AGENDA</span>
                </motion.div>
              </Link>
              <Link href="/dashboard/professor/alunos">
                <motion.div
                  className="flex items-center gap-2 border-2 border-white/20 text-white px-6 py-3 rounded-full font-black text-sm tracking-widest"
                  whileHover={{ scale: 1.03, borderColor: "#AFFF00", color: "#AFFF00" }}
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
      <section className="py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            NÚMEROS
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2" {...fadeUp(0.1)}>
            Visão Geral
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" {...fadeUp(0.15)} />

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Alunos Ativos", value: students.length },
              { label: "Agendamentos", value: bookings.length },
              { label: "Confirmados", value: confirmed },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="bg-[#161616] border border-white/8 rounded-2xl p-6 hover:border-[#AFFF00]/20 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <p className="text-5xl font-black tracking-tighter mb-2 text-[#AFFF00]">{s.value}</p>
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase">{s.label}</p>
                <div className="h-[2px] bg-[#AFFF00]/30 rounded-full mt-4" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
            ACESSO RÁPIDO
          </motion.span>
          <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2" {...fadeUp(0.1)}>
            Navegar
          </motion.h2>
          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" {...fadeUp(0.15)} />

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
                  className="group flex flex-col gap-4 bg-[#161616] border border-white/8 hover:border-[#AFFF00]/30 rounded-2xl p-6 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#AFFF00]/10 flex items-center justify-center group-hover:bg-[#AFFF00]/20 transition-colors">
                    <q.icon size={20} className="text-[#AFFF00]" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base tracking-tight group-hover:text-[#AFFF00] transition-colors">{q.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{q.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-[#AFFF00] transition-colors mt-auto" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRÓXIMOS AGENDAMENTOS ────────────────────────────────────────── */}
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

          {upcoming.length === 0 ? (
            <motion.div
              className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center"
              {...fadeUp(0.2)}
            >
              <Calendar size={40} className="text-white/15 mx-auto mb-4" />
              <p className="text-white/30 text-sm font-bold">Nenhum agendamento futuro.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((b, i) => {
                const student = store.getUserById(b.userId)
                return (
                  <motion.div
                    key={b.id}
                    className="bg-[#161616] border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-all group"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0">
                          <span className="text-[#AFFF00] font-black text-xs">{student?.name.charAt(0) ?? "?"}</span>
                        </div>
                        <div>
                          <p className="text-white text-xs font-black">{student?.name}</p>
                          <p className="text-white/30 text-[10px] capitalize">{b.type}</p>
                        </div>
                      </div>
                      {b.status === "confirmado"
                        ? <CheckCircle size={14} className="text-[#AFFF00]" />
                        : <AlertCircle size={14} className="text-yellow-400" />
                      }
                    </div>
                    <h3 className="text-white font-black text-base tracking-tight mb-3 leading-tight">{b.title}</h3>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
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
