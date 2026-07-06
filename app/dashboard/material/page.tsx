"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, X, FileText, Trash2,
  Plus, Paperclip, Edit2,
} from "lucide-react"
import { store, type Material, type User } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

// ── Main Page ─────────────────────────────────────────────────────────────────
function CardThumb({ mat }: { mat: Material }) {
  const [err, setErr] = useState(false)
  const src = mat.coverImage || (mat.fileType === "image" ? mat.fileUrl : undefined)

  if (src && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={mat.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={() => setErr(true)}
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#141414] to-[#0f0f0f]">
      <div className="w-14 h-14 rounded-2xl bg-[#AFFF00]/10 flex items-center justify-center">
        <FileText size={26} className="text-[#AFFF00]" />
      </div>
      <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Material</span>
    </div>
  )
}

export default function MaterialPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialCategories, setMaterialCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ mode: "create" | "edit"; original?: string; value: string } | null>(null)
  const [categoryDelete, setCategoryDelete] = useState<string | null>(null)
  const [transferCategory, setTransferCategory] = useState("")

  const isProfessor = user?.role === "professor" || user?.role === "admin"
  const isAdmin = user?.role === "admin"

  const load = () => setMaterials(store.getMaterials())
  const loadCategories = () => setMaterialCategories(store.getMaterialCategories())

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)
    load()
    loadCategories()
  }, [router])

  const categories = ["Todos", ...materialCategories]
  const filtered = activeCategory === "Todos"
    ? materials
    : materials.filter((m) => m.category === activeCategory)

  const openDeleteCategory = (category: string) => {
    const fallback = materialCategories.find((c) => c !== category) ?? ""
    setTransferCategory(fallback)
    setCategoryDelete(category)
  }

  const saveCategory = () => {
    if (!categoryModal) return
    const nextName = categoryModal.value.trim()
    if (!nextName) return

    if (categoryModal.mode === "create") {
      const nextCategories = store.addMaterialCategory(nextName)
      const target = nextCategories.find((c) => c.toLowerCase() === nextName.toLowerCase()) ?? nextName
      setActiveCategory(target)
    } else if (categoryModal.original) {
      const nextCategories = store.updateMaterialCategory(categoryModal.original, nextName)
      const target = nextCategories.find((c) => c.toLowerCase() === nextName.toLowerCase()) ?? nextName
      if (activeCategory === categoryModal.original) setActiveCategory(target)
    }

    load()
    loadCategories()
    setCategoryModal(null)
  }

  const confirmDeleteCategory = () => {
    if (!categoryDelete || !transferCategory) return
    store.deleteMaterialCategory(categoryDelete, transferCategory)
    if (activeCategory === categoryDelete) setActiveCategory(transferCategory)
    load()
    loadCategories()
    setCategoryDelete(null)
    setTransferCategory("")
  }

  const handleDelete = (id: string) => {
    store.deleteMaterial(id)
    setDeleteId(null)
    load()
  }

  const categoryDeleteCount = categoryDelete
    ? materials.filter((m) => m.category === categoryDelete).length
    : 0
  const transferOptions = materialCategories.filter((c) => c !== categoryDelete)

  if (!user) return null

  return (
    <div className="bg-[#0a0a0a] min-h-screen">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/material-hero.png" alt="" fill className="object-cover opacity-25" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28">
          <motion.span
            className="block text-[#AFFF00] text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.1)}
          >
            {isProfessor ? "PORTAL DO PROFESSOR" : "PORTAL DO ALUNO"}
          </motion.span>
          <motion.h1
            className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]"
            {...fadeUp(0.2)}
          >
            Material
          </motion.h1>
          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mt-4" {...fadeUp(0.3)} />
          <motion.p className="text-white/40 text-base max-w-md leading-relaxed mt-4" {...fadeUp(0.35)}>
            {isProfessor
              ? "Publique artigos, PDFs e imagens para seus alunos. Todo material fica disponível imediatamente."
              : "Acesse o material publicado pelos professores da DJ ON Academy."}
          </motion.p>
        </div>
      </section>

      {/* ── FILTER + ACTION ROW ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-12 mt-4">
        <div className="flex items-start gap-4 flex-wrap">
          <motion.div className="flex flex-1 min-w-0 items-center gap-2 flex-wrap" {...fadeUp(0.1)}>
            {categories.map((cat) => {
              const active = activeCategory === cat
              const canManageCategory = isAdmin && active && cat !== "Todos"

              if (canManageCategory) {
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-1 rounded-full bg-[#AFFF00] text-[#121212] px-4 py-2"
                  >
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className="cursor-pointer text-xs font-black tracking-widest"
                    >
                      {cat.toUpperCase()}
                    </button>
                    <span className="mx-1 h-3 w-px bg-[#121212]/20" />
                    <button
                      type="button"
                      onClick={() => setCategoryModal({ mode: "edit", original: cat, value: cat })}
                      className="cursor-pointer rounded-full p-0.5 text-[#121212]/70 hover:text-[#121212] hover:bg-[#121212]/10 transition-all"
                      aria-label={`Editar categoria ${cat}`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteCategory(cat)}
                      className="cursor-pointer rounded-full p-0.5 text-[#121212]/70 hover:text-[#121212] hover:bg-[#121212]/10 transition-all"
                      aria-label={`Excluir categoria ${cat}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              }

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-black tracking-widest transition-all cursor-pointer ${
                    active
                      ? "bg-[#AFFF00] text-[#121212]"
                      : "bg-white/6 text-white/50 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              )
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setCategoryModal({ mode: "create", value: "" })}
                className="cursor-pointer px-2 py-2 text-xs font-black tracking-widest text-white/35 hover:text-[#AFFF00] transition-colors"
              >
                + NOVA CATEGORIA
              </button>
            )}
          </motion.div>

          {isProfessor && (
            <motion.button
              onClick={() => router.push("/dashboard/material/novo")}
              className="cursor-pointer flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-6 py-3 rounded-full font-black text-sm tracking-widest hover:opacity-90 transition-opacity shrink-0"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              {...fadeUp(0.15)}
            >
              <Plus size={15} /> NOVO MATERIAL
            </motion.button>
          )}
        </div>
      </section>

      {/* ── GRID ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {filtered.length === 0 ? (
          <motion.div className="text-center py-24" {...fadeUp(0)}>
            <BookOpen size={40} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/20 font-bold text-lg">Nenhum material nesta categoria</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((mat, i) => (
              <motion.div
                key={mat.id}
                className="group bg-white/4 border border-white/8 rounded-2xl overflow-hidden hover:border-white/16 transition-all cursor-pointer flex flex-col min-h-[322px]"
                {...fadeUp(i * 0.04)}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/dashboard/material/${mat.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-[#0f0f0f] overflow-hidden">
                  <CardThumb mat={mat} />

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#0a0a0a]/80 backdrop-blur-sm text-white/50 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10">
                      {mat.category}
                    </span>
                  </div>

                  {/* Attachment count badge */}
                  {mat.attachments && mat.attachments.length > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 bg-[#0a0a0a]/80 backdrop-blur-sm text-white/60 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10">
                        <Paperclip size={9} /> {mat.attachments.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-1 flex-col">
                  <p className="text-white font-black text-sm leading-snug line-clamp-2 mb-1">{mat.title}</p>
                  {mat.description && (
                    <p className="text-white/35 text-xs leading-relaxed line-clamp-3">{mat.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#AFFF00]/15 flex items-center justify-center overflow-hidden">
                        {mat.authorAvatar
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={mat.authorAvatar} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[#AFFF00] text-[8px] font-black">{mat.authorName.charAt(0)}</span>
                        }
                      </div>
                      <span className="text-white/30 text-[10px] font-bold">{mat.authorName.split(" ")[0]}</span>
                    </div>
                    {isProfessor && mat.authorId === user.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(mat.id) }}
                        className="cursor-pointer opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* Create / edit category */}
      <AnimatePresence>
        {categoryModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setCategoryModal(null)}
          >
            <motion.div
              className="djon-scroll bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[#AFFF00] text-xs font-black tracking-widest uppercase mb-1">
                    {categoryModal.mode === "create" ? "NOVA" : "EDITAR"}
                  </p>
                  <h2 className="text-white text-xl font-black tracking-tight">Categoria</h2>
                </div>
                <button
                  onClick={() => setCategoryModal(null)}
                  className="cursor-pointer text-white/30 hover:text-white transition-colors"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveCategory()
                }}
              >
                <div>
                  <label className="block text-white/50 text-xs font-bold tracking-widest uppercase mb-2">Nome</label>
                  <input
                    autoFocus
                    value={categoryModal.value}
                    onChange={(e) => setCategoryModal({ ...categoryModal, value: e.target.value })}
                    placeholder="Ex: Produção musical"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#AFFF00]/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!categoryModal.value.trim()}
                  className="cursor-pointer w-full bg-[#AFFF00] disabled:opacity-40 disabled:cursor-not-allowed text-[#121212] font-black text-sm tracking-widest py-3 rounded-full transition-opacity hover:opacity-90"
                >
                  {categoryModal.mode === "create" ? "CRIAR CATEGORIA" : "SALVAR CATEGORIA"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete category confirm */}
      <AnimatePresence>
        {categoryDelete && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setCategoryDelete(null)}
          >
            <motion.div
              className="djon-scroll bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-red-400 text-xs font-black tracking-widest uppercase mb-1">EXCLUIR</p>
                  <h2 className="text-white text-xl font-black tracking-tight">Categoria {categoryDelete}</h2>
                </div>
                <button
                  onClick={() => setCategoryDelete(null)}
                  className="cursor-pointer text-white/30 hover:text-white transition-colors"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-white/45 text-sm leading-relaxed mb-5">
                Existem <span className="text-white font-black">{categoryDeleteCount}</span> materiais nessa categoria.
                Escolha para qual categoria eles serão transferidos antes de excluir.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-white/50 text-xs font-bold tracking-widest uppercase mb-2">Transferir para</label>
                  <select
                    value={transferCategory}
                    onChange={(e) => setTransferCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#AFFF00]/40 transition-colors cursor-pointer"
                  >
                    {transferOptions.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#111]">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCategoryDelete(null)}
                    className="cursor-pointer flex-1 py-3 rounded-full border border-white/15 text-white/60 hover:text-white text-xs font-black tracking-widest transition-colors"
                    type="button"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={confirmDeleteCategory}
                    disabled={!transferCategory}
                    className="cursor-pointer flex-1 py-3 rounded-full bg-red-500/80 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black tracking-widest transition-colors"
                    type="button"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <p className="text-white font-black text-lg mb-2">Remover material?</p>
              <p className="text-white/40 text-sm mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="cursor-pointer flex-1 py-3 rounded-full border border-white/15 text-white/60 hover:text-white text-xs font-black tracking-widest transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="cursor-pointer flex-1 py-3 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs font-black tracking-widest transition-colors"
                >
                  REMOVER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
