"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, FileText, ImageIcon, Download, Eye, X, Paperclip, File as FileIcon,
} from "lucide-react"
import { store, type Material, type MaterialAttachment, type User } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

function triggerDownload(url: string, name: string) {
  if (!url) return
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── PDF Viewer Modal ────────────────────────────────────────────────────────
function PDFViewer({ att, onClose }: { att: MaterialAttachment; onClose: () => void }) {
  const hasUrl = Boolean(att.url)

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-[#AFFF00] shrink-0" />
          <p className="text-white font-bold text-sm truncate">{att.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerDownload(att.url, att.name)}
            disabled={!hasUrl}
            className="cursor-pointer flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-4 py-2 rounded-full text-xs font-black tracking-widest hover:opacity-90 transition-opacity"
          >
            <Download size={13} /> BAIXAR
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4">
        {hasUrl ? (
          <iframe src={att.url} className="w-full h-full rounded-xl border border-white/10" title={att.name} />
        ) : (
          <div className="w-full h-full rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <p className="text-white/40 text-sm font-bold">Arquivo indisponível.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Image Lightbox ──────────────────────────────────────────────────────────
function ImageLightbox({ att, onClose }: { att: MaterialAttachment; onClose: () => void }) {
  const [imageError, setImageError] = useState(false)
  const hasUrl = Boolean(att.url) && !imageError

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); triggerDownload(att.url, att.name) }}
          disabled={!att.url}
          className="cursor-pointer flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-4 py-2 rounded-full text-xs font-black tracking-widest hover:opacity-90 transition-opacity"
        >
          <Download size={13} /> BAIXAR
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
      {hasUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          src={att.url}
          alt={att.name}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
          onClick={(e) => e.stopPropagation()}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full max-w-2xl h-[50vh] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white/40 text-sm font-bold">Imagem indisponível.</p>
        </div>
      )}
      <p className="text-white/50 text-sm mt-4 font-medium">{att.name}</p>
    </motion.div>
  )
}

export default function MaterialDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [user, setUser] = useState<User | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [viewer, setViewer] = useState<MaterialAttachment | null>(null)
  const [coverError, setCoverError] = useState(false)

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)
    setMaterial(store.getMaterialById(id))
    setLoaded(true)
  }, [id, router])

  if (!user || !loaded) return null

  if (!material) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center px-6">
        <FileText size={40} className="text-white/10 mb-4" />
        <p className="text-white/40 font-bold text-lg mb-6">Material não encontrado</p>
        <Link
          href="/dashboard/material"
          className="flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-6 py-3 rounded-full font-black text-sm tracking-widest hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} /> VOLTAR AO MATERIAL
        </Link>
      </div>
    )
  }

  const cover = material.coverImage || (material.fileType === "image" ? material.fileUrl : undefined)
  const createdAt = material.createdAt ? new Date(material.createdAt) : new Date()
  const date = Number.isNaN(createdAt.getTime())
    ? "Data não informada"
    : createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const attachments = (material.attachments ?? []).filter((att) => att && att.id && att.name)
  const authorName = material.authorName || "DJ ON Academy"

  const handleAttachmentClick = (att: MaterialAttachment) => {
    if (att.type === "pdf" || att.type === "image") setViewer(att)
    else triggerDownload(att.url, att.name)
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[62vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cover && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover opacity-40"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#141414] to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 w-full">
          <motion.div {...fadeUp(0)}>
            <Link
              href="/dashboard/material"
              className="inline-flex items-center gap-2 text-white/50 hover:text-[#AFFF00] text-xs font-black tracking-widest uppercase mb-8 transition-colors"
            >
              <ArrowLeft size={14} /> VOLTAR AO MATERIAL
            </Link>
          </motion.div>

          <motion.span
            className="block text-[#AFFF00] text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.1)}
          >
            {material.category}
          </motion.span>

          <motion.h1
            className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.95] text-balance"
            {...fadeUp(0.2)}
          >
            {material.title || "Material sem título"}
          </motion.h1>

          <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mt-5" {...fadeUp(0.3)} />

          <motion.div className="flex items-center gap-3 mt-6" {...fadeUp(0.35)}>
            <div className="w-8 h-8 rounded-full bg-[#AFFF00]/15 flex items-center justify-center overflow-hidden">
              {material.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={material.authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#AFFF00] text-xs font-black">{authorName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">{authorName}</p>
              <p className="text-white/40 text-xs">{date}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        {material.description && (
          <motion.p className="text-white/60 text-lg leading-relaxed mb-10 border-l-2 border-[#AFFF00]/40 pl-4" {...fadeUp(0)}>
            {material.description}
          </motion.p>
        )}

        {material.body ? (
          <motion.div
            className="material-prose"
            {...fadeUp(0.05)}
            dangerouslySetInnerHTML={{ __html: material.body }}
          />
        ) : (
          <motion.p className="text-white/30 text-sm" {...fadeUp(0.05)}>
            Este material não possui conteúdo escrito. Confira os anexos abaixo.
          </motion.p>
        )}

        {/* ── ATTACHMENTS ───────────────────────────────────────────────── */}
        {attachments.length > 0 && (
          <motion.div className="mt-16" {...fadeUp(0.1)}>
            <div className="flex items-center gap-2 mb-5">
              <Paperclip size={16} className="text-[#AFFF00]" />
              <h2 className="text-white font-black text-sm tracking-widest uppercase">
                Anexos <span className="text-white/30">({attachments.length})</span>
              </h2>
            </div>

            <div className="grid gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex items-center gap-4 bg-white/4 border border-white/8 hover:border-white/16 rounded-2xl p-4 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    att.type === "pdf" ? "bg-red-500/15" : att.type === "image" ? "bg-[#AFFF00]/12" : "bg-white/8"
                  }`}>
                    {att.type === "pdf" ? (
                      <FileText size={20} className="text-red-400" />
                    ) : att.type === "image" ? (
                      <ImageIcon size={20} className="text-[#AFFF00]" />
                    ) : (
                      <FileIcon size={20} className="text-white/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{att.name}</p>
                    <p className="text-white/35 text-xs uppercase tracking-widest font-bold">
                      {att.type}{att.size ? ` · ${att.size}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(att.type === "pdf" || att.type === "image") && (
                      <button
                        onClick={() => handleAttachmentClick(att)}
                        className="cursor-pointer flex items-center gap-1.5 bg-white/8 hover:bg-white/15 text-white text-xs font-black tracking-widest px-3 py-2 rounded-full transition-colors"
                      >
                        <Eye size={13} /> VER
                      </button>
                    )}
                    <button
                      onClick={() => triggerDownload(att.url, att.name)}
                      className="cursor-pointer flex items-center gap-1.5 bg-[#AFFF00] text-[#121212] text-xs font-black tracking-widest px-3 py-2 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <Download size={13} /> BAIXAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewer && viewer.type === "pdf" && (
          <PDFViewer att={viewer} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewer && viewer.type === "image" && (
          <ImageLightbox att={viewer} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
