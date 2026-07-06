"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  CalendarPlus, Music2, Newspaper, ArrowRight,
  MapPin, Clock, Star, CheckCircle, AlertCircle,
} from "lucide-react"
import { store, type User as StoreUser, type Booking, type DJEvent } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

export default function StudentPage() {
  const [user, setUser] = useState<StoreUser | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [myEvents, setMyEvents] = useState<DJEvent[]>([])
  const [djOnEvents, setDjOnEvents] = useState<DJEvent[]>([])
  const [studentEvents, setStudentEvents] = useState<DJEvent[]>([])

  useEffect(() => {
    const u = store.getCurrentUser()
    setUser(u)
    if (u) {
      setBookings(store.getBookingsByUser(u.id))
      setMyEvents(store.getEventsByUser(u.id))
    }
    setDjOnEvents(store.getDJOnEvents().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    setStudentEvents(store.getStudentEvents().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }, [])

  if (!user) return null

  const upcoming = bookings
    .filter((b) => b.status !== "cancelado" && new Date(b.date + "T00:00:00") >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const allMuralEvents = [...djOnEvents, ...studentEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  ).filter((e) => new Date(e.date + "T00:00:00") >= new Date()).slice(0, 6)

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

  const eventTimestamp = (event: DJEvent) => new Date(`${event.date}T${event.time || "00:00"}`).getTime()
  const isPastEvent = (event: DJEvent) => new Date(event.date + "T00:00:00") < new Date()
  const sortedMyEvents = [...myEvents].sort((a, b) => {
    const aPast = isPastEvent(a)
    const bPast = isPastEvent(b)

    if (aPast !== bPast) return aPast ? 1 : -1

    return aPast
      ? eventTimestamp(b) - eventTimestamp(a)
      : eventTimestamp(a) - eventTimestamp(b)
  })

  return (
    <div className="bg-djon-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-page via-djon-page/80 to-djon-page/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <motion.span
              className="inline-block text-djon-accent text-xs tracking-[0.2em] font-black uppercase mb-4"
              {...fadeUp(0.1)}
            >
              BEM-VINDO DE VOLTA
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
                o que vamos
              </span>
              <br />
              fazer hoje?
            </motion.h1>

            <motion.p
              className="text-djon-text/50 text-base leading-relaxed max-w-lg mb-8"
              {...fadeUp(0.3)}
            >
              {upcoming.length > 0
                ? `Você tem ${upcoming.length} aula${upcoming.length > 1 ? "s" : ""} agendada${upcoming.length > 1 ? "s" : ""}. Continue sua jornada.`
                : "Nenhum agendamento futuro. Que tal solicitar um treino?"}
            </motion.p>

            {/* CTAs */}
            <motion.div className="flex flex-wrap gap-3" {...fadeUp(0.4)}>
              <Link href="/dashboard/student/agendar" className="w-full sm:w-auto">
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
                  <CalendarPlus size={15} className="relative z-10" />
                  <span className="relative z-10">SOLICITAR TREINO</span>
                </motion.div>
              </Link>
              <Link href="/dashboard/student/evento" className="w-full sm:w-auto">
                <motion.div
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-djon-text/20 px-6 py-3 text-sm font-black tracking-widest text-djon-text"
                  whileHover={{ scale: 1.03, borderColor: "var(--djon-color-accent)", color: "var(--djon-color-accent)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Music2 size={15} />
                  MEUS EVENTOS
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRÓXIMAS AULAS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                AGENDAMENTOS
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter" {...fadeUp(0.1)}>
                Próximos Agendamentos
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-3" {...fadeUp(0.2)} />
            </div>
            <motion.div {...fadeUp(0.1)}>
              <Link
                href="/dashboard/student/agendar"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-opacity hover:opacity-90 sm:w-auto"
              >
                <CalendarPlus size={15} /> SOLICITAR TREINO
              </Link>
            </motion.div>
          </div>

          {upcoming.length === 0 ? (
            <motion.div
              className="rounded-2xl border-2 border-dashed border-djon-text/10 p-8 text-center sm:p-16"
              {...fadeUp(0.2)}
            >
              <CalendarPlus size={40} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/30 text-sm font-bold mb-4">Nenhum agendamento futuro</p>
              <Link
                href="/dashboard/student/agendar"
                className="inline-flex items-center gap-2 bg-djon-accent text-djon-ink px-6 py-2.5 rounded-full font-black text-xs tracking-widest"
              >
                <CalendarPlus size={13} /> SOLICITAR TREINO
              </Link>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.slice(0, 6).map((b, i) => (
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
                    <span className={`text-djon-label font-black tracking-widest px-2.5 py-1 rounded-full ${
                      b.type === "aula" ? "bg-djon-accent/15 text-djon-accent" : "bg-blue-400/15 text-blue-400"
                    }`}>
                      {b.type.toUpperCase()}
                    </span>
                    {b.status === "confirmado"
                      ? <CheckCircle size={14} className="text-djon-accent" />
                      : <AlertCircle size={14} className="text-yellow-400" />
                    }
                  </div>
                  <h3 className="text-djon-text font-black text-lg tracking-tight mb-3 leading-tight">{b.title}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Clock size={11} />{fmt(b.date)} às {b.time}
                    </div>
                  </div>
                  {b.notes && (
                    <p className="text-djon-text/30 text-xs mt-3 pt-3 border-t border-djon-text/8 leading-relaxed">{b.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── EVENTO OFICIAL DJ ON ─────────────────────────────────────────── */}
      {/* ── MURAL DE EVENTOS ─────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                COMUNIDADE
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter" {...fadeUp(0.1)}>
                Mural de Eventos
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-3" {...fadeUp(0.2)} />
            </div>
            <motion.div {...fadeUp(0.1)}>
              <Link href="/dashboard/mural" className="flex items-center gap-2 text-djon-accent text-xs font-black tracking-widest hover:gap-3 transition-all">
                VER TUDO <ArrowRight size={13} />
              </Link>
            </motion.div>
          </div>

          {allMuralEvents.length === 0 ? (
            <motion.div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-8 text-center sm:p-16" {...fadeUp(0.2)}>
              <Newspaper size={40} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/30 text-sm font-bold">Nenhum evento no mural ainda.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMuralEvents.map((ev, i) => {
                const isDJOn = ev.type === "djOn"
                return (
                  <motion.div
                    key={ev.id}
                    className={`relative rounded-2xl overflow-hidden border ${
                      isDJOn ? "border-djon-accent/30 bg-djon-accent/5" : "border-djon-text/8 bg-djon-surface-2"
                    }`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                    whileHover={{ y: -4 }}
                  >
                    {isDJOn && (
                      <div className="bg-djon-accent px-4 py-1.5 flex items-center gap-2">
                        <Star size={10} className="text-djon-ink" fill="var(--djon-color-ink)" />
                        <span className="text-djon-ink text-djon-caption font-black tracking-[0.2em]">EVENTO OFICIAL</span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          isDJOn ? "bg-djon-accent text-djon-ink" : "bg-djon-text/10 text-djon-text"
                        }`}>
                          {ev.createdByName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-djon-text text-xs font-bold">{ev.createdByName}</p>
                          <p className={`text-djon-caption font-bold tracking-wide ${isDJOn ? "text-djon-accent" : "text-djon-text/30"}`}>
                            {isDJOn ? "DJ ON ACADEMY" : "Aluno"}
                          </p>
                        </div>
                      </div>
                      <h3 className="text-djon-text font-black text-base tracking-tight mb-3 leading-tight">{ev.title}</h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                          <Clock size={11} />{fmt(ev.date)} às {ev.time}
                        </div>
                        <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                          <MapPin size={11} />{ev.location}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── MEUS EVENTOS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-page sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                MEUS EVENTOS
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter" {...fadeUp(0.1)}>
                Onde Você Vai Tocar
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-3" {...fadeUp(0.2)} />
            </div>
            <motion.div {...fadeUp(0.1)}>
              <Link href="/dashboard/student/evento" className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-widest text-djon-ink sm:w-auto">
                <Music2 size={13} /> + NOVO EVENTO
              </Link>
            </motion.div>
          </div>

          {myEvents.length === 0 ? (
            <motion.div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-8 text-center sm:p-16" {...fadeUp(0.2)}>
              <Music2 size={40} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/30 text-sm font-bold mb-4">Nenhum evento cadastrado</p>
              <Link
                href="/dashboard/student/evento"
                className="inline-flex items-center gap-2 bg-djon-accent text-djon-ink px-6 py-2.5 rounded-full font-black text-xs tracking-widest"
              >
                <Music2 size={13} /> CADASTRAR EVENTO
              </Link>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMyEvents.map((ev, i) => {
                const isPast = isPastEvent(ev)
                return (
                  <motion.div
                    key={ev.id}
                    className={`bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-5 hover:border-djon-text/20 transition-all ${isPast ? "opacity-50" : ""}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: isPast ? 0.5 : 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                    whileHover={{ y: -4 }}
                  >
                    {isPast && (
                      <span className="inline-block text-djon-caption bg-djon-text/8 text-djon-text/30 font-black tracking-widest px-2.5 py-1 rounded-full mb-3">
                        PASSADO
                      </span>
                    )}
                    <h3 className="text-djon-text font-black text-lg tracking-tight mb-3 leading-tight">{ev.title}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                        <Clock size={11} />{fmt(ev.date)} às {ev.time}
                      </div>
                      <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                        <MapPin size={11} />{ev.location}
                      </div>
                    </div>
                    {ev.description && (
                      <p className="text-djon-text/30 text-xs mt-3 pt-3 border-t border-djon-text/8 leading-relaxed line-clamp-2">{ev.description}</p>
                    )}
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
