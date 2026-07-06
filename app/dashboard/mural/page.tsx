"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { MapPin, Clock, Instagram, Music2, Star } from "lucide-react"
import { store, type DJEvent } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

// Futuros primeiro (do mais próximo ao mais distante); passados no fim (mais recentes primeiro)
function sortUpcomingFirst(arr: DJEvent[]) {
  const now = new Date()
  const isFuture = (e: DJEvent) => new Date(e.date + "T00:00:00") >= now
  return [...arr].sort((a, b) => {
    const aF = isFuture(a)
    const bF = isFuture(b)
    if (aF && bF) return new Date(a.date).getTime() - new Date(b.date).getTime()
    if (!aF && !bF) return new Date(b.date).getTime() - new Date(a.date).getTime()
    return aF ? -1 : 1
  })
}

function EventCard({ ev, index }: { ev: DJEvent; index: number }) {
  const isDJOn = ev.type === "djOn"
  const isPast = new Date(ev.date + "T00:00:00") < new Date()

  return (
    <motion.article
      className={`relative rounded-2xl overflow-hidden border transition-all group ${
        isDJOn ? "border-djon-accent/40 bg-djon-accent/5" : "border-djon-text/8 bg-djon-surface-2"
      } ${isPast ? "opacity-40" : ""}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: isPast ? 0.4 : 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
      whileHover={!isPast ? { y: -6 } : {}}
    >
      {isDJOn && (
        <div className="bg-djon-accent px-5 py-2 flex items-center gap-2">
          <Star size={11} className="text-djon-ink" fill="var(--djon-color-ink)" />
          <span className="text-djon-ink text-djon-caption font-black tracking-[0.25em] uppercase">Evento Oficial DJ ON</span>
        </div>
      )}

      <div className="p-6">
        {/* Author row */}
        <div className="flex items-center justify-between mb-5">
          <Link href={`/dashboard/perfil/${ev.createdBy}`} className="flex items-center gap-3 group/author">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 overflow-hidden transition-opacity group-hover/author:opacity-80 ${
              isDJOn ? "bg-djon-accent text-djon-ink" : "bg-djon-text/10 text-djon-text"
            }`}>
              {ev.createdByAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.createdByAvatar} alt={ev.createdByName} className="w-full h-full object-cover" />
              ) : ev.createdByName.charAt(0)}
            </div>
            <div>
              <p className="text-djon-text text-xs font-black group-hover/author:text-djon-accent transition-colors">{ev.createdByName}</p>
              <p className={`text-djon-caption font-black tracking-widest uppercase ${isDJOn ? "text-djon-accent" : ev.type === "professor" ? "text-djon-text/50" : "text-djon-text/30"}`}>
                {isDJOn ? "DJ ON Academy" : ev.type === "professor" ? "Professor" : "Aluno"}
              </p>
            </div>
          </Link>
          {isPast && (
            <span className="text-djon-caption text-djon-text/30 font-black tracking-widest bg-djon-text/5 px-3 py-1 rounded-full">PASSADO</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-djon-text font-black text-xl md:text-2xl tracking-tight leading-tight mb-4">{ev.title}</h3>

        {/* Meta */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-djon-text/50 text-xs font-medium">
            <Clock size={12} />
            {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })} às {ev.time}
          </div>
          <div className="flex items-center gap-2 text-djon-text/50 text-xs font-medium">
            <MapPin size={12} />
            {ev.location}
          </div>
          {ev.instagram && (
            <a
              href={`https://instagram.com/${ev.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-djon-accent text-xs font-bold hover:underline"
            >
              <Instagram size={12} />
              @{ev.instagram}
            </a>
          )}
        </div>

        {ev.description && (
          <p className="text-djon-text/40 text-xs leading-relaxed pt-4 border-t border-djon-text/8">{ev.description}</p>
        )}
      </div>
    </motion.article>
  )
}

export default function MuralPage() {
  const [djOnEvents, setDJOnEvents] = useState<DJEvent[]>([])
  const [studentEvents, setStudentEvents] = useState<DJEvent[]>([])
  const [professorEvents, setProfessorEvents] = useState<DJEvent[]>([])
  const [filter, setFilter] = useState<"todos" | "djOn" | "alunos" | "professores">("todos")

  useEffect(() => {
    setDJOnEvents(sortUpcomingFirst(store.getDJOnEvents()))
    setStudentEvents(sortUpcomingFirst(store.getStudentEvents()))
    setProfessorEvents(sortUpcomingFirst(store.getProfessorEvents()))
  }, [])

  const allEvents = sortUpcomingFirst([...djOnEvents, ...studentEvents, ...professorEvents])
  const displayed =
    filter === "todos" ? allEvents
    : filter === "djOn" ? djOnEvents
    : filter === "alunos" ? studentEvents
    : professorEvents

  return (
    <div className="bg-djon-page">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mural-hero.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-page via-djon-page/80 to-djon-page/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full sm:px-6 sm:py-24">
          <motion.span className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4" {...fadeUp(0.1)}>
            COMUNIDADE
          </motion.span>
          <motion.h1
            className="djon-hero-title font-black text-djon-text mb-4"
            {...fadeUp(0.2)}
          >
            Mural de<br />
            <span style={{ color: "var(--djon-color-accent)", WebkitTextStroke: "2px var(--djon-color-page)", paintOrder: "stroke fill", letterSpacing: "0.04em" }}>
              Eventos.
            </span>
          </motion.h1>
          <motion.p className="text-djon-text/40 text-base max-w-md leading-relaxed" {...fadeUp(0.3)}>
            Veja o que está acontecendo na comunidade DJ ON — shows, formaturas e eventos dos seus colegas.
          </motion.p>
        </div>
      </section>

      {/* ── FILTER + GRID ──────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Filter tabs */}
          <motion.div className="flex items-center gap-2 flex-wrap mb-10" {...fadeUp(0.1)}>
            {(["todos", "djOn", "professores", "alunos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-widest transition-all ${
                  filter === f
                    ? "bg-djon-accent text-djon-ink"
                    : "bg-djon-text/6 text-djon-text/50 hover:text-djon-text border border-djon-text/10 hover:border-djon-text/20 cursor-pointer"
                }`}
              >
                {f === "todos" ? "TODOS" : f === "djOn" ? "DJ ON" : f === "professores" ? "PROFESSORES" : "ALUNOS"}
              </button>
            ))}
            <span className="w-full text-djon-text/20 text-xs font-bold sm:ml-auto sm:w-auto">
              {displayed.length} evento{displayed.length !== 1 ? "s" : ""}
            </span>
          </motion.div>

          {displayed.length === 0 ? (
            <motion.div
              className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-20"
              {...fadeUp(0.2)}
            >
              <Music2 size={48} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/20 text-sm font-bold">Nenhum evento para mostrar.</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayed.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
