"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, X, GraduationCap, Mail, Phone, RotateCcw, MapPin } from "lucide-react"
import { store, type Unit, type User } from "@/lib/store"
import { formatPhone, phoneMatchesSearch } from "@/lib/phone"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { useConfirmation } from "@/components/confirmation-provider"
import { DjonSelect } from "@/components/djon-select"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

const inp =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all"

type FormState = { name: string; email: string; whatsapp: string; password: string; unitId: string }
const emptyForm: FormState = { name: "", email: "", whatsapp: "", password: "", unitId: "" }

export default function ProfessoresAdminPage() {
  const { confirm } = useConfirmation()
  const [professors, setProfessors] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const load = () => setProfessors(store.getProfessors())

  useEffect(() => {
    void Promise.all([store.listAdminUsers(true), store.getPublicUnits()])
      .then(() => {
        load()
        setUnits(store.getUnits().filter((unit) => unit.active))
      })
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }

  const openEdit = (u: User) => {
    setForm({
      name: u.name,
      email: u.email,
      whatsapp: formatPhone(u.whatsapp),
      password: "",
      unitId: u.unitId ?? "",
    })
    setEditingId(u.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await store.updateUser(editingId, {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        unitId: form.unitId,
      })
    } else {
      await store.addUser({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        password: form.password,
        role: "professor",
        unitId: form.unitId,
      })
    }
    setShowForm(false)
    load()
  }

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      title: "Desativar professor?",
      description: `${user.name} perderá o acesso à plataforma. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "DESATIVAR",
    })
    if (confirmed) await store.deleteUser(user.id, { onChange: load })
  }
  const handleRestore = async (id: string) => { await store.restoreUser(id); load() }

  const filtered = professors.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      phoneMatchesSearch(u.whatsapp, search)
  )
  const pagination = useListPagination(filtered, search)

  if (loading) return <DashboardPageSkeleton variant="list" />

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">Administração</p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">Professores</h1>
        </div>
        <motion.button
          onClick={openNew}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} /> NOVO PROFESSOR
        </motion.button>
      </div>

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
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-djon-text tracking-tighter">
                  {editingId ? "Editar Professor" : "Cadastrar Professor"}
                </h2>
                <button onClick={() => setShowForm(false)} className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">NOME COMPLETO</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do professor"
                    className={inp}
                  />
                </div>
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
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">TELEFONE</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                      placeholder="(51) 99999-0000"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">UNIDADE</label>
                  <DjonSelect
                    required
                    value={form.unitId}
                    onChange={(unitId) => setForm({ ...form, unitId })}
                    options={units.map((unit) => ({ value: unit.id, label: unit.label }))}
                    placeholder="Selecionar unidade..."
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">SENHA INICIAL</label>
                    <input type="password" required minLength={8} value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className={inp} />
                    <p className="mt-1 text-djon-text/25 text-xs">Informe esta senha ao professor por um canal seguro.</p>
                  </div>
                )}
                <p className="text-djon-text/25 text-xs leading-relaxed border-t border-djon-text/8 pt-3">
                  Bio e redes sociais são editadas pelo próprio usuário no perfil dele.
                </p>
                <motion.button
                  type="submit"
                  className="cursor-pointer w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
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
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <GraduationCap size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">{search ? "Nenhum professor encontrado." : "Nenhum professor cadastrado."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagination.paginatedItems.map((u, i) => (
            <motion.div
              key={u.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-4 sm:flex sm:items-center ${u.active === false ? "opacity-55" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="djon-avatar-fallback w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-djon-accent font-black text-sm">{u.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="mb-1.5 block truncate text-sm font-bold text-djon-text transition-colors hover:text-djon-accent"
                >
                  {u.name}
                </Link>
                <p className="text-djon-text/40 text-xs truncate flex items-center gap-1.5">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                {u.whatsapp && (
                  <p className="text-djon-text/30 text-xs flex items-center gap-1.5 mt-1">
                    <Phone size={10} /> {formatPhone(u.whatsapp)}
                  </p>
                )}
                {u.unitLabel && (
                  <p className="text-djon-text/30 text-xs flex items-center gap-1.5 mt-1">
                    <MapPin size={10} /> {u.unitLabel}
                  </p>
                )}
              </div>
              <div className="col-span-2 flex w-full items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                {u.active !== false && <button
                  onClick={() => openEdit(u)}
                  className="cursor-pointer p-1.5 text-djon-text opacity-30 transition-opacity hover:opacity-100"
                  type="button"
                  title="Editar"
                  aria-label={`Editar ${u.name}`}
                >
                  <Edit2 size={14} />
                </button>}
                {u.active !== false ? <button
                  onClick={() => void handleDelete(u)}
                  className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                  type="button"
                >
                  <Trash2 size={14} />
                </button> : <button onClick={() => void handleRestore(u.id)} type="button" title="Restaurar" aria-label={`Restaurar ${u.name}`} className="cursor-pointer p-1.5 text-djon-accent transition-[filter] hover:brightness-110"><RotateCcw size={14} /></button>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ListPagination
        totalItems={filtered.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  )
}
