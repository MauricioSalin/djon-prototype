"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Calendar, Clock, FileText, CheckCircle, X } from "lucide-react"
import { store, type Booking } from "@/lib/store"
import { DjonDatePicker, DjonTimeSelect } from "@/components/djon-date-time-picker"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const inputCls = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:bg-djon-text/8 transition-all"
const BOOKING_HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`)

function toLocalIso(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = {
    confirmado: "bg-djon-accent/15 text-djon-accent",
    pendente: "bg-yellow-400/15 text-yellow-400",
    cancelado: "bg-djon-danger/15 text-djon-danger",
  }
  return (
    <span className={`text-djon-caption font-black px-2.5 py-1 rounded-full tracking-widest ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  )
}

export default function AgendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [reschedulingFrom, setReschedulingFrom] = useState<Booking | null>(null)
  const [form, setForm] = useState({ title: "", date: "", time: "", notes: "" })
  const [success, setSuccess] = useState(false)

  const load = () => {
    const u = store.getCurrentUser()
    setAllBookings(store.getBookings())
    if (u) setBookings(store.getBookingsByUser(u.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }

  useEffect(() => { load() }, [])

  const openRequest = (booking?: Booking) => {
    setReschedulingFrom(booking ?? null)
    setForm({
      title: booking?.title ?? "",
      date: "",
      time: "",
      notes: booking?.notes ?? "",
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = store.getCurrentUser()
    if (!u) return
    store.addBooking({
      ...form,
      title: form.title.trim() || "Solicitação de treino",
      notes: reschedulingFrom
        ? `Remarcação solicitada para "${reschedulingFrom.title}". ${form.notes}`.trim()
        : form.notes,
      userId: u.id,
      type: "treino",
      status: "pendente",
    })
    setForm({ title: "", date: "", time: "", notes: "" })
    setReschedulingFrom(null)
    setShowForm(false)
    setSuccess(true)
    load()
    setTimeout(() => setSuccess(false), 4000)
  }

  const handleCancel = (id: string) => {
    store.updateBooking(id, { status: "cancelado" })
    load()
  }

  const occupiedByDate = useMemo(() => {
    const map = new Map<string, Set<string>>()
    allBookings
      .filter((booking) => booking.status !== "cancelado")
      .forEach((booking) => {
        if (!map.has(booking.date)) map.set(booking.date, new Set())
        map.get(booking.date)?.add(booking.time)
      })
    return map
  }, [allBookings])

  const getAvailableTimes = useCallback((date: string) => {
    if (!date) return []
    const occupied = occupiedByDate.get(date) ?? new Set<string>()
    return BOOKING_HOURS.filter((time) => !occupied.has(time))
  }, [occupiedByDate])

  const availableTimes = useMemo(() => getAvailableTimes(form.date), [form.date, getAvailableTimes])

  useEffect(() => {
    if (form.time && form.date && !availableTimes.includes(form.time)) {
      setForm((current) => ({ ...current, time: "" }))
    }
  }, [availableTimes, form.date, form.time])

  const isDateUnavailable = (date: Date) => {
    const iso = toLocalIso(date)
    const today = toLocalIso(new Date())
    if (iso < today) return true
    return getAvailableTimes(iso).length === 0
  }

  const upcoming = bookings.filter((b) => new Date(b.date + "T00:00:00") >= new Date())
  const past = bookings.filter((b) => new Date(b.date + "T00:00:00") < new Date())

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="bg-djon-page">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-page via-djon-page/80 to-djon-page/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-page via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div>
            <motion.span className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4" {...fadeUp(0.1)}>
              PORTAL DO ALUNO
            </motion.span>
            <motion.h1
              className="djon-hero-title font-black text-djon-text"
              {...fadeUp(0.2)}
            >
              Agendamentos
            </motion.h1>
            <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-4" {...fadeUp(0.3)} />
            <motion.p className="text-djon-text/40 text-base max-w-md leading-relaxed mt-4" {...fadeUp(0.35)}>
              Solicite treinos para praticar nos horários disponíveis. As aulas são agendadas pelo professor.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── SUCCESS TOAST ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-3 rounded-2xl bg-djon-accent px-5 py-4 text-djon-ink shadow-2xl sm:left-auto sm:right-6 sm:bottom-6"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <CheckCircle size={18} />
            <span className="font-black text-sm tracking-wide">Solicitação enviada!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FORM MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/80 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-djon-text/12 bg-djon-surface p-5 shadow-2xl sm:my-6 sm:p-8"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-djon-accent text-xs font-black tracking-widest uppercase mb-1">
                    {reschedulingFrom ? "REMARCAR" : "NOVO"}
                  </p>
                  <h2 className="text-2xl font-black text-djon-text tracking-tighter">Treino</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 flex items-center justify-center text-djon-text/50 hover:text-djon-text hover:bg-djon-text/15 transition-all">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">TÍTULO</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Treino de Beat Match" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">DATA</label>
                    <DjonDatePicker
                      value={form.date}
                      onChange={(date) => setForm({ ...form, date, time: getAvailableTimes(date).includes(form.time) ? form.time : "" })}
                      isDateDisabled={isDateUnavailable}
                    />
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">HORÁRIO</label>
                    <DjonTimeSelect
                      value={form.time}
                      onChange={(time) => setForm({ ...form, time })}
                      options={availableTimes}
                      disabled={!form.date}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">OBSERVAÇÕES</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="O que você quer trabalhar nesse treino?" rows={3} className={`${inputCls} resize-none`} />
                </div>
                <motion.button type="submit"
                  disabled={!form.title.trim() || !form.date || !form.time}
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3.5 font-black text-sm tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {reschedulingFrom ? "Solicitar remarcação" : "SOLICITAR TREINO"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UPCOMING ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                PRÓXIMOS
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
                Próximos Treinos
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full" {...fadeUp(0.15)} />
            </div>
            <motion.button
              onClick={() => openRequest()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink sm:w-auto relative overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              {...fadeUp(0.1)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5 }}
              />
              <Plus size={15} className="relative z-10" />
              <span className="relative z-10">SOLICITAR TREINO</span>
            </motion.button>
          </div>

          {upcoming.length === 0 ? (
            <motion.div className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-20" {...fadeUp(0.2)}>
              <Calendar size={48} className="text-djon-text/12 mx-auto mb-4" />
              <p className="text-djon-text/25 text-sm font-bold mb-6">Nenhum treino solicitado</p>
              <button onClick={() => openRequest()}
                className="inline-flex items-center gap-2 bg-djon-accent text-djon-ink px-7 py-3 rounded-full font-black text-sm tracking-widest">
                <Plus size={14} /> SOLICITAR TREINO
              </button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((b, i) => (
                <motion.div key={b.id}
                  className="bg-djon-surface-2 border border-djon-text/8 hover:border-djon-text/20 rounded-2xl p-6 transition-all"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      b.type === "aula" ? "bg-djon-accent/12" : "bg-blue-400/12"
                    }`}>
                      {b.type === "aula"
                        ? <FileText size={18} className="text-djon-accent" />
                        : <Clock size={18} className="text-blue-400" />
                      }
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <h3 className="text-djon-text font-black text-lg tracking-tight mb-3 leading-tight">{b.title}</h3>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Calendar size={11} />{fmt(b.date)}
                    </div>
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Clock size={11} />{b.time}
                    </div>
                  </div>
                  {b.notes && <p className="text-djon-text/30 text-xs leading-relaxed border-t border-djon-text/8 pt-3">{b.notes}</p>}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={() => openRequest(b)}
                      className="cursor-pointer text-djon-text/35 hover:text-djon-accent transition-colors flex items-center gap-1.5 text-xs font-bold">
                      <Calendar size={12} /> Remarcar
                    </button>
                    {b.status !== "cancelado" && (
                      <button onClick={() => handleCancel(b.id)}
                        className="cursor-pointer text-djon-text/15 hover:text-djon-danger transition-colors flex items-center gap-1.5 text-xs font-bold">
                        <Trash2 size={12} /> Cancelar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HISTÓRICO ─────────────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="py-16 bg-djon-page sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.span className="block text-djon-text/25 text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
              HISTÓRICO
            </motion.span>
            <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text/50 tracking-tighter mb-2" {...fadeUp(0.1)}>
              Histórico
            </motion.h2>
            <motion.div className="h-[3px] w-10 bg-djon-text/15 rounded-full mb-10" {...fadeUp(0.15)} />
            <div className="space-y-3">
              {past.map((b, i) => (
                <motion.div key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-djon-text/6 bg-djon-surface px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-djon-text/5 flex items-center justify-center shrink-0">
                    {b.type === "aula" ? <FileText size={15} className="text-djon-text/20" /> : <Clock size={15} className="text-djon-text/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text/40 font-black text-sm truncate">{b.title}</p>
                    <p className="text-djon-text/20 text-xs mt-0.5 capitalize">{b.type}</p>
                  </div>
                  <div className="shrink-0 text-djon-text/20 text-xs font-bold">{fmt(b.date)}</div>
                  <button onClick={() => handleCancel(b.id)} className="cursor-pointer text-djon-text/10 hover:text-djon-danger/50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
