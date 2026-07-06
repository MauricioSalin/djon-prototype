"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle, Edit2, Instagram, Mail, Phone, Users, X, User } from "lucide-react"
import { SoundCloudIcon } from "@/components/social-icons"
import { store, type User as AppUser } from "@/lib/store"

const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#AFFF00]/50 transition-all"

type FormState = {
  name: string
  email: string
  whatsapp: string
}

const emptyForm: FormState = { name: "", email: "", whatsapp: "" }

export default function ProfessorAlunosPage() {
  const router = useRouter()
  const [students, setStudents] = useState<AppUser[]>([])
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saved, setSaved] = useState(false)

  const load = () => setStudents(store.getStudents())

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    if (u.role === "student") { router.replace("/dashboard/student"); return }
    load()
  }, [router])

  const openEdit = (student: AppUser) => {
    setForm({
      name: student.name,
      email: student.email,
      whatsapp: student.whatsapp ?? "",
    })
    setEditingId(student.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    store.updateUser(editingId, {
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
    })
    setShowForm(false)
    setEditingId(null)
    setSaved(true)
    load()
    setTimeout(() => setSaved(false), 3000)
  }

  const filtered = students.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.whatsapp ?? "").includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <p className="text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-1">PROFESSOR</p>
        <h1 className="text-3xl font-black text-white tracking-tighter">Alunos</h1>
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
            <span className="text-[#AFFF00] text-sm font-bold">Aluno atualizado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone..."
        className={inp}
      />

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
                <div>
                  <p className="text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-1">PROFESSOR</p>
                  <h2 className="text-xl font-black text-white tracking-tighter">Editar aluno</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-white/40 hover:text-white transition-colors"
                  type="button"
                >
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
                    placeholder="Nome completo do aluno"
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
                      className={`${inp} pl-10`}
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
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-[#AFFF00] text-[#121212] rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  SALVAR ALTERAÇÕES
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-10 text-center">
          <Users size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                className="bg-[#161616] border border-white/8 rounded-2xl px-4 py-4 flex items-start gap-4"
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
                  <p className="text-white font-bold text-sm truncate mb-1.5">{u.name}</p>
                  <p className="text-white/40 text-xs truncate flex items-center gap-1.5">
                    <Mail size={10} className="shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </p>
                  {u.whatsapp && (
                    <p className="text-white/30 text-xs flex items-center gap-1.5 mt-1">
                      <Phone size={10} /> {u.whatsapp}
                    </p>
                  )}
                  {(u.socials?.instagram || u.socials?.soundcloud) && (
                    <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-white/8">
                      {u.socials?.instagram && (
                        <a
                          href={`https://instagram.com/${u.socials.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold transition-colors"
                        >
                          <Instagram size={16} /> @{u.socials.instagram}
                        </a>
                      )}
                      {u.socials?.soundcloud && (
                        <a
                          href={`https://soundcloud.com/${u.socials.soundcloud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold transition-colors"
                        >
                          <SoundCloudIcon size={20} /> {u.socials.soundcloud}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="cursor-pointer text-white/20 hover:text-[#AFFF00] transition-colors p-1.5"
                    type="button"
                    title="Editar"
                    aria-label={`Editar ${u.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <Link
                    href={`/dashboard/perfil/${u.id}`}
                    className="cursor-pointer text-white/20 hover:text-[#AFFF00] transition-colors p-1.5"
                    title="Perfil"
                    aria-label={`Abrir perfil de ${u.name}`}
                  >
                    <User size={14} />
                  </Link>
                </div>
              </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
