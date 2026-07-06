"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, X, Users, CheckCircle, Phone, CreditCard, Calendar, Instagram, Mail, User } from "lucide-react"
import { store, type User as AppUser } from "@/lib/store"
import { SoundCloudIcon } from "@/components/social-icons"

const inp = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all"

type FormState = {
  name: string
  email: string
  whatsapp: string
  cpf: string
  birthDate: string
}

const emptyForm: FormState = { name: "", email: "", whatsapp: "", cpf: "", birthDate: "" }

export default function AlunosPage() {
  const [students, setStudents] = useState<AppUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")

  const load = () => setStudents(store.getUsers().filter((u) => u.role === "student"))

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }

  const openEdit = (u: AppUser) => {
    setForm({
      name: u.name,
      email: u.email,
      whatsapp: u.whatsapp ?? "",
      cpf: u.cpf ?? "",
      birthDate: u.birthDate ?? "",
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
        cpf: form.cpf,
        birthDate: form.birthDate,
      })
    } else {
      store.addUser({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        cpf: form.cpf,
        birthDate: form.birthDate,
        role: "student",
      })
    }
    setShowForm(false)
    setSaved(true)
    load()
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDelete = (id: string) => { store.deleteUser(id); load() }

  const filtered = students.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.whatsapp ?? "").includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">Administração</p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">Alunos</h1>
        </div>
        <motion.button
          onClick={openNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} />
          NOVO ALUNO
        </motion.button>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            className="flex items-center gap-3 bg-djon-accent/10 border border-djon-accent/30 rounded-xl px-4 py-3"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <CheckCircle size={16} className="text-djon-accent" />
            <span className="text-djon-accent text-sm font-bold">Aluno salvo com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
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
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-djon-text tracking-tighter">
                  {editingId ? "Editar Aluno" : "Cadastrar Aluno"}
                </h2>
                <button onClick={() => setShowForm(false)} className="cursor-pointer text-djon-text/40 hover:text-djon-text">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">NOME COMPLETO</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome completo do aluno"
                    className={inp}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">E-MAIL</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
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

                {/* WhatsApp */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">WHATSAPP</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="51 9 9999-0000"
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {/* CPF */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">CPF</label>
                  <div className="relative">
                    <CreditCard size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {/* Data de nascimento */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">DATA DE NASCIMENTO</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                <p className="text-djon-text/25 text-xs leading-relaxed border-t border-djon-text/8 pt-3">
                  Bio e redes sociais s&atilde;o editadas pelo pr&oacute;prio aluno no perfil dele.
                </p>

                <motion.button
                  type="submit"
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  {editingId ? "SALVAR ALTERAÇÕES" : "CADASTRAR ALUNO"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <Users size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">{search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-4 sm:flex sm:items-center"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-djon-accent/15 flex items-center justify-center shrink-0 overflow-hidden">
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-djon-accent font-black text-sm">{u.name.charAt(0)}</span>
                )}
              </div>

              {/* Info */}
              <div className="w-full min-w-0 flex-1">
                <p className="text-djon-text font-bold text-sm truncate mb-1.5">{u.name}</p>
                <p className="text-djon-text/40 text-xs truncate flex items-center gap-1.5">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                {u.whatsapp && (
                  <p className="text-djon-text/30 text-xs flex items-center gap-1.5 mt-1">
                    <Phone size={10} /> {u.whatsapp}
                  </p>
                )}
                {(u.socials?.instagram || u.socials?.soundcloud) && (
                  <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-djon-text/8">
                    {u.socials?.instagram && (
                      <a
                        href={`https://instagram.com/${u.socials.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-djon-text/30 hover:text-djon-text text-xs font-bold transition-colors"
                      >
                        <Instagram size={16} /> @{u.socials.instagram}
                      </a>
                    )}
                    {u.socials?.soundcloud && (
                      <a
                        href={`https://soundcloud.com/${u.socials.soundcloud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-djon-text/30 hover:text-djon-text text-xs font-bold transition-colors"
                      >
                        <SoundCloudIcon size={20} /> {u.socials.soundcloud}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex w-full items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                <button
                  onClick={() => openEdit(u)}
                  className="cursor-pointer text-djon-text/20 hover:text-djon-accent transition-colors p-1.5"
                  type="button"
                  title="Editar"
                  aria-label={`Editar ${u.name}`}
                >
                  <Edit2 size={14} />
                </button>
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="cursor-pointer text-djon-text/20 hover:text-djon-accent transition-colors p-1.5"
                  title="Perfil"
                  aria-label={`Abrir perfil de ${u.name}`}
                >
                  <User size={14} />
                </Link>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="cursor-pointer text-djon-text/20 hover:text-djon-danger transition-colors p-1.5"
                  type="button"
                  title="Remover"
                  aria-label={`Remover ${u.name}`}
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
