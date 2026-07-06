"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, X, Music2, MapPin, Clock, Instagram, Star } from "lucide-react"
import { store, type DJEvent } from "@/lib/store"

const inp = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all"

type FormState = { title: string; date: string; time: string; location: string; instagram: string; description: string; type: DJEvent["type"] }
const emptyForm: FormState = { title: "", date: "", time: "", location: "", instagram: "", description: "", type: "djOn" }

export default function AdminEventosPage() {
  const [events, setEvents] = useState<DJEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [tab, setTab] = useState<"djOn" | "student">("djOn")

  const load = () => {
    const all = store.getEvents().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setEvents(all)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm({ ...emptyForm, type: tab }); setEditingId(null); setShowForm(true) }

  const openEdit = (ev: DJEvent) => {
    setForm({ title: ev.title, date: ev.date, time: ev.time, location: ev.location, instagram: ev.instagram ?? "", description: ev.description ?? "", type: ev.type })
    setEditingId(ev.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = store.getCurrentUser()
    if (!u) return
    if (editingId) {
      store.updateEvent(editingId, { ...form })
    } else {
      store.addEvent({ ...form, createdBy: u.id, createdByName: u.name, createdByAvatar: u.avatar })
    }
    setShowForm(false)
    load()
  }

  const handleDelete = (id: string) => { store.deleteEvent(id); load() }

  const displayed = events.filter((e) => e.type === tab)

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">ADMINISTRAÇÃO</p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">Gerenciar Eventos</h1>
        </div>
        <motion.button onClick={openNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Plus size={14} />
          NOVO EVENTO
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["djOn", "student"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all ${
              tab === t ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10 hover:text-djon-text"
            }`}>
            {t === "djOn" ? <><Star size={11} /> EVENTOS DJ ON</> : <><Music2 size={11} /> EVENTOS ALUNOS</>}
          </button>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-djon-text tracking-tighter">{editingId ? "Editar Evento" : "Novo Evento"}</h2>
                <button onClick={() => setShowForm(false)} className="cursor-pointer text-djon-text/40 hover:text-djon-text"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">TIPO DE EVENTO</label>
                  <div className="flex gap-2">
                    {(["djOn", "student"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                        className={`cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all ${
                          form.type === t ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10 hover:text-djon-text"
                        }`}>
                        {t === "djOn" ? "DJ ON" : "ALUNO"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">NOME DO EVENTO</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Nome do evento" className={inp} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">DATA</label>
                    <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">HORÁRIO</label>
                    <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">LOCAL</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Local / Endereço" className={inp} />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">INSTAGRAM</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30 text-sm">@</span>
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="handle" className={`${inp} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">DESCRIÇÃO</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Descreva o evento..." className={`${inp} resize-none`} />
                </div>
                <motion.button type="submit"
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {editingId ? "SALVAR ALTERAÇÕES" : "CRIAR EVENTO"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <Music2 size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">Nenhum evento {tab === "djOn" ? "da DJ ON" : "de alunos"} cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((ev, i) => (
            <motion.div key={ev.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border bg-djon-surface-2 px-4 py-4 sm:flex sm:px-5 ${ev.type === "djOn" ? "border-djon-accent/20" : "border-djon-text/8"}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              {ev.type === "djOn" && (
                <div className="w-9 h-9 rounded-xl bg-djon-accent/15 flex items-center justify-center shrink-0">
                  <Star size={16} className="text-djon-accent" />
                </div>
              )}
              {ev.type === "student" && (
                <div className="w-9 h-9 rounded-xl bg-djon-info/15 flex items-center justify-center shrink-0">
                  <Music2 size={16} className="text-djon-info" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-djon-text font-black text-base truncate">{ev.title}</p>
                <p className="text-djon-text/40 text-xs truncate">{ev.createdByName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  <span className="text-djon-text/30 text-xs flex items-center gap-1"><Clock size={10} /> {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR")} {ev.time}</span>
                  <span className="text-djon-text/30 text-xs flex items-center gap-1"><MapPin size={10} /> {ev.location}</span>
                  {ev.instagram && <span className="text-djon-info text-xs flex items-center gap-1"><Instagram size={10} /> @{ev.instagram}</span>}
                </div>
              </div>
              <div className="col-span-2 flex w-full items-center justify-end gap-1 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                <button onClick={() => openEdit(ev)} className="cursor-pointer text-djon-text/20 hover:text-djon-accent transition-colors p-1.5">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(ev.id)} className="cursor-pointer text-djon-text/20 hover:text-djon-danger transition-colors p-1.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
