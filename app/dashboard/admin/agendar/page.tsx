"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Calendar, Clock, CheckCircle, X, Edit2 } from "lucide-react"
import { store, type Booking, type User } from "@/lib/store"

const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#AFFF00]/50 transition-all"

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = { confirmado: "bg-[#AFFF00]/15 text-[#AFFF00]", pendente: "bg-yellow-400/15 text-yellow-400", cancelado: "bg-red-500/15 text-red-400" }
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide ${map[status]}`}>{status.toUpperCase()}</span>
}

type FormState = { userId: string; title: string; date: string; time: string; type: "aula" | "treino"; notes: string; status: Booking["status"] }
const emptyForm: FormState = { userId: "", title: "", date: "", time: "", type: "aula", notes: "", status: "confirmado" }

export default function AdminAgendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [search, setSearch] = useState("")

  const load = () => {
    setBookings(store.getBookings().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    setStudents(store.getUsers().filter((u) => u.role === "student"))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }

  const openEdit = (b: Booking) => {
    setForm({ userId: b.userId, title: b.title, date: b.date, time: b.time, type: b.type, notes: b.notes ?? "", status: b.status })
    setEditingId(b.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      store.updateBooking(editingId, { ...form })
    } else {
      store.addBooking({ ...form })
    }
    setShowForm(false)
    load()
  }

  const handleDelete = (id: string) => { store.updateBooking(id, { status: "cancelado" }); load() }

  const filtered = bookings.filter((b) => {
    const u = store.getUserById(b.userId)
    return b.title.toLowerCase().includes(search.toLowerCase()) || u?.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#AFFF00] text-xs tracking-wide font-bold mb-0.5">Administração</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Agendamentos</h1>
        </div>
        <motion.button onClick={openNew}
          className="bg-[#AFFF00] text-[#121212] px-5 py-2.5 rounded-full font-black text-xs tracking-wide flex items-center gap-2"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Plus size={14} /> NOVO
        </motion.button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por aluno ou título..." className={inp} />

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-white tracking-tighter">{editingId ? "Editar Agendamento" : "Novo Agendamento"}</h2>
                <button onClick={() => setShowForm(false)} className="cursor-pointer text-white/40 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">ALUNO</label>
                  <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    className={inp}>
                    <option value="">Selecionar aluno...</option>
                    {students.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">TÍTULO</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Aula de Beat Match" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">DATA</label>
                    <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">HORÁRIO</label>
                    <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">TIPO</label>
                  <div className="flex gap-2">
                    {(["aula", "treino"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                        className={`cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all ${
                          form.type === t ? "bg-[#AFFF00] text-[#121212]" : "bg-white/5 text-white/50 border border-white/10"
                        }`}>{t.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">STATUS</label>
                  <div className="flex gap-2">
                    {(["confirmado", "pendente", "cancelado"] as Booking["status"][]).map((s) => (
                      <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                        className={`cursor-pointer flex-1 py-2 rounded-xl text-[10px] font-black tracking-wide transition-all ${
                          form.status === s ? "bg-[#AFFF00] text-[#121212]" : "bg-white/5 text-white/40 border border-white/10"
                        }`}>{s.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">OBSERVAÇÕES</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} className={`${inp} resize-none`} />
                </div>
                <motion.button type="submit"
                  className="w-full bg-[#AFFF00] text-[#121212] rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {editingId ? "SALVAR" : "AGENDAR"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-10 text-center">
          <Calendar size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b, i) => {
            const owner = store.getUserById(b.userId)
            return (
              <motion.div key={b.id}
                className="bg-[#161616] border border-white/8 rounded-2xl px-4 py-4 flex items-center gap-4"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="w-9 h-9 rounded-full bg-[#AFFF00]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#AFFF00] font-black text-sm">{owner?.name.charAt(0) ?? "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{b.title}</p>
                  <p className="text-white/40 text-xs">{owner?.name} · <span className="capitalize">{b.type}</span></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-white/50 text-xs"><Calendar size={11} />
                      {new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-xs mt-0.5 justify-end"><Clock size={11} />{b.time}</div>
                  </div>
                  <StatusBadge status={b.status} />
                  <button onClick={() => openEdit(b)} className="cursor-pointer text-white/20 hover:text-[#AFFF00] transition-colors p-1">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="cursor-pointer text-white/20 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
