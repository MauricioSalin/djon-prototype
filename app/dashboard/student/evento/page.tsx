"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, MapPin, Clock, Instagram, Music2, X, Edit2 } from "lucide-react"
import { store, type DJEvent } from "@/lib/store"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { useConfirmation } from "@/components/confirmation-provider"
import { EditablePortalHero } from "@/components/portal/editable-portal-hero"
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock"
import {
  EVENTS_HERO_SECTIONS,
  PROFESSOR_EVENTS_HERO,
  STUDENT_EVENTS_HERO,
} from "@/lib/portal-hero-groups"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const inputCls = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:brightness-110 transition-all"

type FormState = { title: string; date: string; time: string; location: string; instagram: string; description: string }
const emptyForm: FormState = { title: "", date: "", time: "", location: "", instagram: "", description: "" }

export default function StudentEventPage() {
  const { confirm } = useConfirmation()
  const [events, setEvents] = useState<DJEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  useBodyScrollLock(showForm)

  const load = () => {
    const u = store.getCurrentUser()
    if (u) setEvents(store.getEventsByUser(u.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  const openEdit = (ev: DJEvent) => {
    setForm({ title: ev.title, date: ev.date, time: ev.time, location: ev.location, instagram: ev.instagram ?? "", description: ev.description ?? "" })
    setEditingId(ev.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = store.getCurrentUser()
    if (!u) return
    if (editingId) {
      await store.updateEvent(editingId, { ...form })
    } else {
      await store.addEvent({
        ...form,
        createdBy: u.id,
        createdByName: u.name,
        createdByAvatar: u.avatar,
        type: u.role === "professor" ? "professor" : "student",
      })
    }
    setShowForm(false)
    load()
  }

  const handleDelete = async (event: DJEvent) => {
    const confirmed = await confirm({
      title: "Remover evento?",
      description: `${event.title} deixará de aparecer no mural. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "REMOVER",
      confirmVariant: "outline",
    })
    if (confirmed) await store.deleteEvent(event.id, { onChange: load })
  }
  const isPast = (date: string) => new Date(date + "T00:00:00") < new Date()

  const upcoming = events.filter((e) => !isPast(e.date))
  const past = events.filter((e) => isPast(e.date))
  const upcomingPagination = useListPagination(upcoming)
  const historyPagination = useListPagination(past)

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
  const professorView = store.getCurrentUser()?.role === "professor"
  const heroKey = professorView ? "professor-events" : "student-events"
  const heroDefaults = professorView
    ? PROFESSOR_EVENTS_HERO
    : STUDENT_EVENTS_HERO

  return (
    <div className="bg-djon-page">

      <EditablePortalHero
        heroKey={heroKey}
        defaults={heroDefaults}
        bannerKey="mural"
        editorSections={EVENTS_HERO_SECTIONS}
        accentLines={[1]}
      />

      {/* ── FORM MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm sm:p-6"
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
                    {editingId ? "EDITAR" : "NOVO"}
                  </p>
                  <h2 className="text-2xl font-black text-djon-text tracking-tighter">
                    {editingId ? "Editar Evento" : "Cadastrar Evento"}
                  </h2>
                </div>
                <button onClick={() => setShowForm(false)} className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 flex items-center justify-center text-djon-text/50 hover:brightness-110 transition-all">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">NOME DO EVENTO</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Open Bar Sábado" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">DATA</label>
                    <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">HORÁRIO</label>
                    <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">LOCAL</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Bar/Clube — Endereço" className={inputCls} />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">INSTAGRAM DA FESTA/LOCAL</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30 text-sm font-bold">@</span>
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="handle_do_local" className={`${inputCls} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">DESCRIÇÃO</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Conte sobre o evento..." rows={3} className={`${inputCls} resize-none`} />
                </div>
                <motion.button type="submit"
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3.5 font-black text-sm tracking-widest"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {editingId ? "SALVAR ALTERAÇÕES" : "PUBLICAR NO MURAL"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UPCOMING EVENTS ────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>
                FUTUROS
              </motion.span>
              <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>
                Próximos Shows
              </motion.h2>
              <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full" {...fadeUp(0.15)} />
            </div>
            <motion.button
              onClick={openNew}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-djon-accent px-7 py-3.5 text-sm font-black tracking-widest text-djon-ink sm:w-auto relative overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              {...fadeUp(0.15)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5 }}
              />
              <Plus size={15} className="relative z-10" />
              <span className="relative z-10">NOVO EVENTO</span>
            </motion.button>
          </div>

          {upcoming.length === 0 ? (
            <motion.div className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-20" {...fadeUp(0.2)}>
              <Music2 size={48} className="text-djon-text/12 mx-auto mb-4" />
              <p className="text-djon-text/25 text-sm font-bold">Nenhum evento cadastrado</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingPagination.paginatedItems.map((ev, i) => (
                <motion.div key={ev.id}
                  className="bg-djon-surface-2 border border-djon-text/8 hover:brightness-110 rounded-2xl p-6 transition-all group"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-djon-accent/10 flex items-center justify-center">
                      <Music2 size={18} className="text-djon-accent" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Editar evento ${ev.title}`} onClick={() => openEdit(ev)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-djon-accent/10 text-djon-accent transition-[filter] hover:brightness-110">
                        <Edit2 size={13} />
                      </button>
                      <button type="button" aria-label={`Excluir evento ${ev.title}`} onClick={() => void handleDelete(ev)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-djon-warning-red/10 text-djon-warning-red transition-[filter] hover:brightness-110">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-djon-text font-black text-xl tracking-tight mb-4 leading-tight">{ev.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                      <Clock size={11} />{fmt(ev.date)} às {ev.time}
                    </div>
                    <div className="flex items-center gap-2 text-djon-text/50 text-xs">
                      <MapPin size={11} />{ev.location}
                    </div>
                    {ev.instagram && (
                      <a href={`https://instagram.com/${ev.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text">
                        <Instagram size={11} />@{ev.instagram}
                      </a>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-djon-text/30 text-xs mt-4 pt-4 border-t border-djon-text/8 leading-relaxed">{ev.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
          <ListPagination
            totalItems={upcoming.length}
            page={upcomingPagination.page}
            pageSize={upcomingPagination.pageSize}
            totalPages={upcomingPagination.totalPages}
            onPageChange={upcomingPagination.setPage}
            onPageSizeChange={upcomingPagination.setPageSize}
          />
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
              Shows Passados
            </motion.h2>
            <motion.div className="h-[3px] w-10 bg-djon-text/15 rounded-full mb-10" {...fadeUp(0.15)} />
            <div className="space-y-3">
              {historyPagination.paginatedItems.map((ev, i) => (
                <motion.div key={ev.id}
                  className="flex flex-col gap-3 rounded-2xl border border-djon-text/6 bg-djon-surface px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-djon-text/5 flex items-center justify-center shrink-0 text-djon-text/20">
                    <Music2 size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text/40 font-black text-sm truncate">{ev.title}</p>
                    <p className="text-djon-text/20 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />{ev.location}
                    </p>
                  </div>
                  <div className="shrink-0 text-djon-text/20 text-xs font-bold">
                    {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <button aria-label={`Excluir evento ${ev.title}`} onClick={() => void handleDelete(ev)} className="cursor-pointer text-djon-text opacity-10 transition-opacity hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
            <ListPagination
              totalItems={past.length}
              page={historyPagination.page}
              pageSize={historyPagination.pageSize}
              totalPages={historyPagination.totalPages}
              onPageChange={historyPagination.setPage}
              onPageSizeChange={historyPagination.setPageSize}
            />
          </div>
        </section>
      )}

    </div>
  )
}
