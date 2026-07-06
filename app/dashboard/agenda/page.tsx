"use client"

import { useEffect, useState, useMemo, useRef, type MouseEvent as ReactMouseEvent } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, X, Clock, User as UserIcon,
  Calendar, List, ChevronDown, Check, Edit2, Save,
  Plus,
} from "lucide-react"
import { store, type Booking, type User } from "@/lib/store"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)

function isoToDate(d: string) { return new Date(d + "T00:00:00") }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h + m / 60
}

const STATUS_META: Record<string, { dot: string; badge: string; text: string; label: string }> = {
  confirmado: {
    dot: "bg-djon-success",
    badge: "bg-djon-success/10 border-djon-success/20 text-djon-success",
    text: "text-djon-success",
    label: "Confirmado",
  },
  pendente: {
    dot: "bg-djon-warning",
    badge: "bg-djon-warning/10 border-djon-warning/20 text-djon-warning",
    text: "text-djon-warning",
    label: "Pendente",
  },
  cancelado: {
    dot: "bg-djon-danger",
    badge: "bg-djon-danger/10 border-djon-danger/20 text-djon-danger",
    text: "text-djon-danger",
    label: "Cancelado",
  },
}

type ViewMode = "month" | "week" | "list"
type FilterStatus = "todos" | "confirmado" | "pendente" | "cancelado"

interface BookingWithUser extends Booking {
  student: User | null
}

const inp = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-text/30 transition-all"

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownOption { value: string; label: string; dot?: string }

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex min-w-[118px] items-center gap-2 rounded-lg border border-djon-text/10 bg-djon-text/5 px-3 py-1.5 text-xs font-bold text-djon-text transition-all hover:border-djon-text/20 sm:min-w-[130px]"
      >
        {selected?.dot && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />
        )}
        <span className="flex-1 text-left">{selected?.label ?? placeholder}</span>
        <ChevronDown size={12} className={`text-djon-text/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="djon-scroll absolute right-0 top-full z-50 mt-1.5 max-h-[min(260px,calc(100svh-12rem))] w-[min(180px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-djon-text/10 bg-djon-surface-3 shadow-2xl"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="cursor-pointer w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-djon-text/60 hover:text-djon-text hover:bg-djon-text/6 transition-all"
              >
                {opt.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />}
                <span className="flex-1 text-left">{opt.label}</span>
                {value === opt.value && <Check size={11} className="text-djon-accent shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Booking Pill (calendar cells) ───────────────────────────────────────────

function BookingPill({ bk, onClick }: { bk: BookingWithUser; onClick: () => void }) {
  const m = STATUS_META[bk.status]
  return (
    <button
      onClick={onClick}
      className="cursor-pointer w-full text-left rounded-lg px-2 py-1 bg-djon-text/5 border border-djon-text/8 text-djon-label font-bold truncate text-djon-text/60 hover:bg-djon-text/10 hover:text-djon-text transition-all"
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${m.dot}`} />
      {bk.time} {bk.student?.name.split(" ")[0] ?? "—"}
    </button>
  )
}

// ─── Booking Detail / Edit Modal ──────────────────────────────────────────────

function BookingDetail({
  bk,
  canEdit,
  onClose,
  onSaved,
}: {
  bk: BookingWithUser
  canEdit: boolean
  onClose: () => void
  onSaved: (updated: BookingWithUser) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: bk.title,
    date: bk.date,
    time: bk.time,
    type: bk.type as "aula" | "treino",
    status: bk.status as Booking["status"],
    notes: bk.notes ?? "",
  })

  const m = STATUS_META[form.status]

  const dateLabel = isoToDate(bk.date).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  })

  const handleSave = () => {
    store.updateBooking(bk.id, form)
    const updated: BookingWithUser = { ...bk, ...form }
    onSaved(updated)
    setEditing(false)
  }

  const statusOptions: DropdownOption[] = [
    { value: "confirmado", label: "Confirmado", dot: "bg-djon-success" },
    { value: "pendente", label: "Pendente", dot: "bg-djon-warning" },
    { value: "cancelado", label: "Cancelado", dot: "bg-djon-danger" },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/60 p-4 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-djon-text/12 bg-djon-surface p-5 shadow-2xl sm:my-6 sm:p-6"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-djon-label font-black tracking-widest border ${m.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label.toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="cursor-pointer text-djon-text/30 hover:text-djon-accent transition-colors p-1"
              >
                <Edit2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="cursor-pointer text-djon-text/30 hover:text-djon-text transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {!editing ? (
          /* ── Read mode ── */
          <div>
            <h3 className="text-djon-text text-xl font-black tracking-tight mb-1">{bk.title}</h3>
            <p className="text-djon-text/40 text-xs font-bold mb-5 uppercase tracking-widest">
              {bk.type === "aula" ? "Aula" : "Treino"} — {bk.time}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                <Calendar size={14} className="shrink-0" />
                <span className="capitalize">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                <Clock size={14} className="shrink-0" />
                {bk.time}
              </div>
              {bk.student && (
                <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                  <UserIcon size={14} className="shrink-0" />
                  {bk.student.name}
                  {bk.student.socials?.instagram && (
                    <span className="text-djon-text/30">@{bk.student.socials.instagram}</span>
                  )}
                </div>
              )}
              {bk.notes && (
                <div className="bg-djon-text/4 rounded-xl px-4 py-3 mt-2">
                  <p className="text-djon-text/40 text-xs leading-relaxed">{bk.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="space-y-4">
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">TÍTULO</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inp}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">DATA</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inp}
                />
              </div>
              <div>
                <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">HORÁRIO</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className={inp}
                />
              </div>
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">TIPO</label>
              <div className="flex gap-2">
                {(["aula", "treino"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
                      form.type === t
                        ? "bg-djon-accent text-djon-ink"
                        : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">STATUS</label>
              <div className="flex gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({ ...form, status: s.value as Booking["status"] })}
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-djon-label font-black tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                      form.status === s.value
                        ? "bg-djon-accent text-djon-ink"
                        : "bg-djon-text/5 text-djon-text/40 border border-djon-text/10"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      form.status === s.value ? "bg-djon-ink" : s.dot
                    }`} />
                    {s.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">OBSERVAÇÕES</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={`${inp} resize-none`}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-djon-text/5 border border-djon-text/10 text-djon-text/50 text-xs font-black transition-all hover:bg-djon-text/10"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSave}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-djon-accent text-djon-ink text-xs font-black flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
              >
                <Save size={12} /> SALVAR
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ weekDays, bookings, today, onSelect }: {
  weekDays: Date[]
  bookings: BookingWithUser[]
  today: Date
  onSelect: (b: BookingWithUser) => void
}) {
  return (
    <div
      className="djon-scroll overflow-x-auto pb-2"
      style={{ touchAction: "pan-x pan-y" }}
    >
      <div className="min-w-[700px] md:min-w-0">
        <div className="grid grid-cols-8 border-b border-djon-text/8">
          <div className="py-3" />
          {weekDays.map((d, i) => {
            const isToday = sameDay(d, today)
            return (
              <div key={i} className="py-3 text-center">
                <p className="text-djon-text/30 text-djon-label font-bold">{DAYS[d.getDay()]}</p>
                <p className={`text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                  isToday ? "bg-djon-accent text-djon-ink" : "text-djon-text"
                }`}>
                  {d.getDate()}
                </p>
              </div>
            )
          })}
        </div>
        {HOURS.map((h) => (
          <div key={h} className="grid grid-cols-8 border-b border-djon-text/4 min-h-[56px]">
            <div className="pr-3 pt-1 text-right text-djon-label text-djon-text/20 font-bold shrink-0">
              {String(h).padStart(2, "0")}:00
            </div>
            {weekDays.map((d, di) => {
              const dayBks = bookings.filter((b) => {
                const bd = isoToDate(b.date)
                const bh = parseTime(b.time)
                return sameDay(bd, d) && Math.floor(bh) === h
              })
              return (
                <div key={di} className="border-l border-djon-text/4 px-1 pt-1 space-y-1">
                  {dayBks.map((b) => (
                    <BookingPill key={b.id} bk={b} onClick={() => onSelect(b)} />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ year, month, bookings, today, onSelect }: {
  year: number
  month: number
  bookings: BookingWithUser[]
  today: Date
  onSelect: (b: BookingWithUser) => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const rowCount = cells.length / 7
  const gridRef = useRef<HTMLDivElement>(null)
  const morePopoverRef = useRef<HTMLDivElement>(null)
  const [visibleSlots, setVisibleSlots] = useState(3)

  // Quick popover listing every booking of an overflowing day (Teams style)
  const [moreDay, setMoreDay] = useState<{
    date: Date
    bks: BookingWithUser[]
    top: number
    left: number
    maxHeight: number
    origin: string
  } | null>(null)

  useEffect(() => {
    if (!moreDay) return
    function closeOnPageScroll(e: Event) {
      const target = e.target as Node | null
      if (target && morePopoverRef.current?.contains(target)) return
      setMoreDay(null)
    }
    function closeOnResize() { setMoreDay(null) }
    window.addEventListener("scroll", closeOnPageScroll, true)
    window.addEventListener("resize", closeOnResize)
    return () => {
      window.removeEventListener("scroll", closeOnPageScroll, true)
      window.removeEventListener("resize", closeOnResize)
    }
  }, [moreDay])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    const updateVisibleSlots = () => {
      const rowHeight = el.clientHeight / rowCount
      const availableForItems = Math.max(0, rowHeight - 44)
      const nextSlots = Math.max(1, Math.floor((availableForItems + 2) / 24))
      setVisibleSlots(Math.min(8, nextSlots))
    }

    updateVisibleSlots()
    const observer = new ResizeObserver(updateVisibleSlots)
    observer.observe(el)
    return () => observer.disconnect()
  }, [rowCount])

  const openMore = (e: ReactMouseEvent<HTMLButtonElement>, date: Date, bks: BookingWithUser[]) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const width = 280
    const estimatedHeight = Math.min(340, 58 + bks.length * 38)
    const gutter = 12
    const sideGap = 8

    const spaceRight = window.innerWidth - rect.right - gutter
    const spaceLeft = rect.left - gutter
    let left = spaceRight >= width || spaceRight >= spaceLeft
      ? rect.right + sideGap
      : rect.left - width - sideGap
    if (left < gutter) left = gutter
    if (left + width > window.innerWidth - gutter) left = window.innerWidth - width - gutter

    const spaceBelow = window.innerHeight - rect.top - gutter
    const spaceAbove = rect.bottom - gutter
    const openDown = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove
    const maxHeight = Math.max(180, Math.min(estimatedHeight, openDown ? spaceBelow : spaceAbove))
    let top = openDown ? rect.top : rect.bottom - maxHeight
    if (top < gutter) top = gutter
    if (top + maxHeight > window.innerHeight - gutter) top = window.innerHeight - maxHeight - gutter

    setMoreDay({
      date,
      bks,
      top,
      left,
      maxHeight,
      origin: openDown ? "top left" : "bottom left",
    })
  }

  return (
    <div
      className="djon-scroll overflow-x-auto pb-2"
      style={{ touchAction: "pan-x pan-y" }}
    >
    <div className="flex min-w-[760px] flex-col md:min-w-0" style={{ height: "clamp(520px, calc(100svh - 180px), 760px)" }}>
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-djon-label font-black text-djon-text/25 py-2 tracking-widest">{d}</div>
        ))}
      </div>
      <div
        ref={gridRef}
        className="grid grid-cols-7 gap-px bg-djon-text/5 rounded-2xl overflow-hidden border border-djon-text/8 flex-1"
        style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-djon-calendar-empty" />
          const cellDate = new Date(year, month, day)
          const isToday = sameDay(cellDate, today)
          const cellBks = bookings
            .filter((b) => sameDay(isoToDate(b.date), cellDate))
            .sort((a, b) => parseTime(a.time) - parseTime(b.time))
          const hasOverflow = cellBks.length > visibleSlots
          const visibleCount = hasOverflow ? Math.max(0, visibleSlots - 1) : visibleSlots
          const hiddenCount = cellBks.length - visibleCount
          return (
            <div
              key={i}
              className={`bg-djon-calendar-cell p-2 overflow-hidden ${isToday ? "ring-1 ring-inset ring-djon-accent/40" : ""}`}
            >
              <p className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday ? "bg-djon-accent text-djon-ink" : "text-djon-text/40"
              }`}>
                {day}
              </p>
              <div className="space-y-0.5">
                {cellBks.slice(0, visibleCount).map((b) => (
                  <BookingPill key={b.id} bk={b} onClick={() => onSelect(b)} />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={(e) => openMore(e, cellDate, cellBks)}
                    className="cursor-pointer w-full h-[22px] rounded-lg bg-djon-text/5 border border-djon-text/8 text-djon-label text-djon-text/45 hover:text-djon-accent hover:border-djon-accent/30 font-black transition-all flex items-center justify-center"
                    aria-label={`Ver mais ${hiddenCount} agendamentos de ${day}`}
                  >
                    +{hiddenCount}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day popover — lists all bookings for the selected day */}
      <AnimatePresence>
        {moreDay && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setMoreDay(null)} />
            <motion.div
              ref={morePopoverRef}
              className="fixed z-50 w-[280px] rounded-xl border border-djon-text/10 bg-djon-surface-3 shadow-2xl overflow-hidden flex flex-col"
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              style={{ top: moreDay.top, left: moreDay.left, maxHeight: moreDay.maxHeight, transformOrigin: moreDay.origin }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              initial={{ opacity: 0, x: -6, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-djon-text/8 shrink-0">
                <div>
                  <p className="text-djon-text text-sm font-black leading-none">
                    {moreDay.date.getDate()} {MONTHS[moreDay.date.getMonth()].slice(0, 3)}
                  </p>
                  <p className="text-djon-text/30 text-djon-label font-bold tracking-widest uppercase mt-1">
                    {moreDay.bks.length} agendamento{moreDay.bks.length > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setMoreDay(null)}
                  className="cursor-pointer text-djon-text/30 hover:text-djon-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div
                className="djon-scroll overflow-y-auto overscroll-contain p-1.5 space-y-1"
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {[...moreDay.bks]
                  .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                  .map((b) => {
                    const m = STATUS_META[b.status]
                    return (
                      <button
                        key={b.id}
                        onClick={() => { onSelect(b); setMoreDay(null) }}
                        className="cursor-pointer w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-djon-text/6 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`} />
                        <span className="text-djon-text/40 text-djon-meta font-black tabular-nums shrink-0">{b.time}</span>
                        <span className="text-djon-text text-xs font-bold truncate">
                          {b.student?.name.split(" ")[0] ?? b.title}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ bookings, onSelect }: {
  bookings: BookingWithUser[]
  onSelect: (b: BookingWithUser) => void
}) {
  const sorted = [...bookings].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`)
    const db = new Date(`${b.date}T${b.time}`)
    return da.getTime() - db.getTime()
  })

  const groups: Record<string, BookingWithUser[]> = {}
  sorted.forEach((b) => {
    if (!groups[b.date]) groups[b.date] = []
    groups[b.date].push(b)
  })

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar size={48} className="text-djon-text/10 mx-auto mb-4" />
        <p className="text-djon-text/20 text-sm font-bold">Nenhum agendamento encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, bks]) => {
        const d = isoToDate(date)
        const label = d.toLocaleDateString("pt-BR", {
          weekday: "long", day: "2-digit", month: "long", year: "numeric",
        })
        return (
          <div key={date}>
            <p className="text-djon-text/30 text-xs font-black tracking-widest uppercase mb-2 capitalize">{label}</p>
            <div className="space-y-2">
              {bks.map((b) => {
                const m = STATUS_META[b.status]
                return (
                  <motion.button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="cursor-pointer w-full text-left flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-3.5 transition-all hover:bg-djon-text/5"
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-1 h-10 rounded-full shrink-0 ${m.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-djon-text text-sm font-black truncate">{b.title}</p>
                      <p className="text-djon-text/40 text-xs font-bold mt-0.5">
                        {b.time} — {b.type === "aula" ? "Aula" : "Treino"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-djon-text/50 text-xs font-bold">{b.student?.name.split(" ")[0]}</p>
                      <span className={`text-djon-label font-black px-2 py-0.5 rounded-full border mt-1 inline-block ${m.badge}`}>
                        {m.label}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [bookings, setBookings] = useState<BookingWithUser[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [selected, setSelected] = useState<BookingWithUser | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState({
    userId: "",
    title: "",
    date: "",
    time: "",
    type: "aula" as "aula" | "treino",
    status: "confirmado" as Booking["status"],
    notes: "",
  })
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(today.getFullYear())
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "professor"

  const loadBookings = () => {
    const all = store.getBookings()
    const enriched: BookingWithUser[] = all.map((b) => ({
      ...b,
      student: store.getUserById(b.userId),
    }))
    setBookings(enriched)
    setStudents(store.getStudents())
  }

  useEffect(() => {
    const user = store.getCurrentUser()
    if (!user) { router.replace("/login"); return }
    if (user.role === "student") { router.replace("/dashboard/student"); return }
    setCurrentUser(user)
    loadBookings()
  }, [router])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    setWeekStart(d)
  }

  // For list view: show all; for month/week: filter by window
  const visibleBookings = useMemo(() => {
    let bks = bookings
    if (filterStatus !== "todos") bks = bks.filter((b) => b.status === filterStatus)

    if (view === "month") {
      bks = bks.filter((b) => {
        const d = isoToDate(b.date)
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth()
        )
      })
    } else if (view === "week") {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 7)
      bks = bks.filter((b) => {
        const d = isoToDate(b.date)
        return d >= weekStart && d < end
      })
    }
    return bks
  }, [bookings, view, currentDate, weekStart, filterStatus])

  const monthLabel = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  const weekLabel = (() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    const s = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    const e = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    return `${s} – ${e}`
  })()

  const handlePrev = () => { if (view === "month") prevMonth(); else if (view === "week") prevWeek() }
  const handleNext = () => { if (view === "month") nextMonth(); else if (view === "week") nextWeek() }

  const stats = {
    confirmado: bookings.filter((b) => b.status === "confirmado").length,
    pendente: bookings.filter((b) => b.status === "pendente").length,
  }

  const filterOptions: DropdownOption[] = [
    { value: "todos", label: "Todos" },
    { value: "confirmado", label: "Confirmados", dot: "bg-djon-success" },
    { value: "pendente", label: "Pendentes", dot: "bg-djon-warning" },
    { value: "cancelado", label: "Cancelados", dot: "bg-djon-danger" },
  ]

  const handleSaved = (updated: BookingWithUser) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setSelected(updated)
  }

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault()
    const created = store.addBooking(newForm)
    const student = store.getUserById(created.userId)
    setBookings((prev) => [...prev, { ...created, student }])
    setNewForm({ userId: "", title: "", date: "", time: "", type: "aula", status: "confirmado", notes: "" })
    setShowNewForm(false)
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-djon-page">
      {/* Header */}
      <div className="relative z-30 shrink-0 border-b border-djon-text/8 bg-djon-page">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: title + nav */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {view !== "list" && (
              <>
                <button
                  onClick={handlePrev}
                  className="cursor-pointer text-djon-text/30 hover:text-djon-text p-1.5 rounded-lg hover:bg-djon-text/5 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Month/year picker */}
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => { setPickerYear(currentDate.getFullYear()); setPickerOpen((v) => !v) }}
                    className="cursor-pointer flex min-w-0 max-w-full items-center justify-center gap-1.5 text-base font-black tracking-tight text-djon-text transition-colors hover:text-djon-accent sm:min-w-[200px] sm:text-lg"
                  >
                    {view === "week" ? weekLabel : monthLabel}
                    {view === "month" && (
                      <ChevronDown size={14} className={`text-djon-text/40 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {pickerOpen && view === "month" && (
                      <motion.div
                        className="absolute left-1/2 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-djon-text/12 bg-djon-surface shadow-2xl"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Year row */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-djon-text/8">
                          <button
                            onClick={() => setPickerYear((y) => y - 1)}
                            className="cursor-pointer text-djon-text/30 hover:text-djon-text p-1 rounded-lg hover:bg-djon-text/5 transition-all"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-djon-text font-black text-base tracking-tight">{pickerYear}</span>
                          <button
                            onClick={() => setPickerYear((y) => y + 1)}
                            className="cursor-pointer text-djon-text/30 hover:text-djon-text p-1 rounded-lg hover:bg-djon-text/5 transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        {/* Month grid */}
                        <div className="grid grid-cols-4 gap-1 p-3">
                          {MONTHS.map((name, idx) => {
                            const isSelected =
                              currentDate.getMonth() === idx && currentDate.getFullYear() === pickerYear
                            const isCurrentMonth =
                              today.getMonth() === idx && today.getFullYear() === pickerYear
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentDate(new Date(pickerYear, idx, 1))
                                  setPickerOpen(false)
                                }}
                                className={`cursor-pointer py-2.5 rounded-xl text-xs font-black tracking-wide transition-all ${
                                  isSelected
                                    ? "bg-djon-accent text-djon-ink"
                                    : isCurrentMonth
                                    ? "bg-djon-text/8 text-djon-text border border-djon-text/15"
                                    : "text-djon-text/40 hover:text-djon-text hover:bg-djon-text/6"
                                }`}
                              >
                                {name.slice(0, 3)}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleNext}
                  className="cursor-pointer text-djon-text/30 hover:text-djon-text p-1.5 rounded-lg hover:bg-djon-text/5 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={goToday}
                  className="cursor-pointer text-djon-text/40 hover:text-djon-text text-xs font-bold border border-djon-text/10 hover:border-djon-text/30 px-3 py-1.5 rounded-lg transition-all ml-1"
                >
                  Hoje
                </button>
              </>
            )}
            {view === "list" && (
              <span className="text-djon-text font-black text-lg tracking-tight">Todos os agendamentos</span>
            )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-djon-label font-black px-2.5 py-1 rounded-full bg-djon-success/10 text-djon-success">
                {stats.confirmado} confirmados
              </span>
              <span className="text-djon-label font-black px-2.5 py-1 rounded-full bg-djon-warning/10 text-djon-warning">
                {stats.pendente} pendentes
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex shrink-0 items-center">
              {canEdit && (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="cursor-pointer flex items-center justify-center gap-2 rounded-lg bg-djon-accent px-4 py-2 text-xs font-black tracking-widest text-djon-ink transition-all hover:brightness-110"
                >
                  <Plus size={14} />
                  NOVO
                </button>
              )}
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {/* Custom filter dropdown */}
              <CustomDropdown
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as FilterStatus)}
                options={filterOptions}
                placeholder="Filtrar"
              />

              {/* View switcher */}
              <div className="flex items-center bg-djon-text/5 border border-djon-text/10 rounded-lg p-0.5 gap-0.5">
                {([["month", Calendar], ["week", Clock], ["list", List]] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    title={v}
                    className={`cursor-pointer p-2 rounded-md transition-all ${
                      view === v ? "bg-djon-accent text-djon-ink" : "text-djon-text/30 hover:text-djon-text"
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div
        className="djon-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          {view === "month" && (
            <MonthView
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              bookings={visibleBookings}
              today={today}
              onSelect={setSelected}
            />
          )}
          {view === "week" && (
            <WeekView
              weekDays={weekDays}
              bookings={visibleBookings}
              today={today}
              onSelect={setSelected}
            />
          )}
          {view === "list" && (
            <ListView bookings={visibleBookings} onSelect={setSelected} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowNewForm(false)}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-djon-accent text-xs font-black tracking-widest uppercase mb-1">NOVO</p>
                  <h2 className="text-xl font-black text-djon-text tracking-tighter">Agendamento</h2>
                </div>
                <button onClick={() => setShowNewForm(false)} className="cursor-pointer text-djon-text/40 hover:text-djon-text">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">ALUNO</label>
                  <select
                    required
                    value={newForm.userId}
                    onChange={(e) => setNewForm({ ...newForm, userId: e.target.value })}
                    className={inp}
                  >
                    <option value="">Selecionar aluno...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">TÍTULO</label>
                  <input
                    required
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    placeholder="Ex: Aula de Beat Match"
                    className={inp}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">DATA</label>
                    <input type="date" required value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">HORÁRIO</label>
                    <input type="time" required value={newForm.time} onChange={(e) => setNewForm({ ...newForm, time: e.target.value })} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">TIPO</label>
                  <div className="flex gap-2">
                    {(["aula", "treino"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewForm({ ...newForm, type })}
                        className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
                          newForm.type === type ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">STATUS</label>
                  <div className="flex gap-2">
                    {(["confirmado", "pendente", "cancelado"] as Booking["status"][]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewForm({ ...newForm, status })}
                        className={`cursor-pointer flex-1 py-2 rounded-xl text-djon-label font-black tracking-wide transition-all ${
                          newForm.status === status ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/40 border border-djon-text/10"
                        }`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">OBSERVAÇÕES</label>
                  <textarea
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                    rows={2}
                    className={`${inp} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer w-full bg-djon-accent text-djon-ink rounded-xl py-3 text-sm font-black tracking-widest"
                >
                  AGENDAR
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail / Edit modal */}
      <AnimatePresence>
        {selected && (
          <BookingDetail
            bk={selected}
            canEdit={canEdit}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
