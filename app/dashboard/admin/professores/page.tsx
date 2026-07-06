"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, X, GraduationCap, CheckCircle, Mail, Phone } from "lucide-react"
import { store, type User } from "@/lib/store"

const inp =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#AFFF00]/50 transition-all"

type FormState = { name: string; email: string; whatsapp: string }
const emptyForm: FormState = { name: "", email: "", whatsapp: "" }

export default function ProfessoresAdminPage() {
  const [professors, setProfessors] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")

  const load = () => setProfessors(store.getProfessors())

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }

  const openEdit = (u: User) => {
    setForm({
      name: u.name,
      email: u.email,
      whatsapp: u.whatsapp ?? "",
    })
    setEditingId(u.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      store.updateUser(editingId, {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
      })
    } else {
      store.addUser({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        role: "professor",
      })
    }
    setShowForm(false)
    setSaved(true)
    load()
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDelete = (id: string) => { store.deleteUser(id); load() }

  const filtered = professors.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.whatsapp ?? "").includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#AFFF00] text-xs tracking-wide font-bold mb-0.5">Administração</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Professores</h1>
        </div>
        <motion.button
          onClick={openNew}
          className="cursor-pointer bg-[#AFFF00] text-[#121212] px-5 py-2.5 rounded-full font-black text-xs tracking-wide flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} /> NOVO PROFESSOR
        </motion.button>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            className="flex items-center gap-3 bg-[#AFFF00]/10 border border-[#AFFF00]/30 rounded-xl px-4 py-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle size={16} className="text-[#AFFF00]" />
            <span className="text-[#AFFF00] text-sm font-bold">Professor salvo com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone..."
        className={inp}
      />

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-white tracking-tighter">
                  {editingId ? "Editar Professor" : "Cadastrar Professor"}
                </h2>
                <button onClick={() => setShowForm(false)} className="cursor-pointer text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">NOME COMPLETO</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do professor"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">E-MAIL</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@dominio.com"
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold tracking-wide mb-1.5 block">TELEFONE</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="51 9 9999-0000"
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <p className="text-white/25 text-xs leading-relaxed border-t border-white/8 pt-3">
                  Bio e redes sociais são editadas pelo próprio usuário no perfil dele.
                </p>
                <motion.button
                  type="submit"
                  className="cursor-pointer w-full bg-[#AFFF00] text-[#121212] rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {editingId ? "SALVAR ALTERAÇÕES" : "CADASTRAR PROFESSOR"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-10 text-center">
          <GraduationCap size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{search ? "Nenhum professor encontrado." : "Nenhum professor cadastrado."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              className="bg-[#161616] border border-white/8 rounded-2xl px-4 py-4 flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="w-10 h-10 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0 overflow-hidden">
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#AFFF00] font-black text-sm">{u.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="block text-white hover:text-[#AFFF00] font-bold text-sm truncate mb-1.5 transition-colors underline-offset-4 hover:underline"
                >
                  {u.name}
                </Link>
                <p className="text-white/40 text-xs truncate flex items-center gap-1.5">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                {u.whatsapp && (
                  <p className="text-white/30 text-xs flex items-center gap-1.5 mt-1">
                    <Phone size={10} /> {u.whatsapp}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="cursor-pointer text-white/30 hover:text-[#AFFF00] text-xs font-bold border border-white/10 hover:border-[#AFFF00]/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  type="button"
                >
                  <Edit2 size={13} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="cursor-pointer text-white/20 hover:text-red-400 transition-colors p-1.5"
                  type="button"
                >
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
