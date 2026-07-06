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
      className="fixed inset-0 z-[100] bg-djon-page/90 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col gap-3 border-b border-djon-text/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-djon-accent shrink-0" />
          <p className="text-djon-text font-bold text-sm truncate">{att.name}</p>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <button
            onClick={() => triggerDownload(att.url, att.name)}
            disabled={!hasUrl}
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-full bg-djon-accent px-4 py-2 text-xs font-black tracking-widest text-djon-ink transition-opacity hover:opacity-90 sm:flex-none"
          >
            <Download size={13} /> BAIXAR
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 hover:bg-djon-text/15 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-djon-text" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4">
        {hasUrl ? (
          <iframe src={att.url} className="w-full h-full rounded-xl border border-djon-text/10" title={att.name} />
        ) : (
          <div className="w-full h-full rounded-xl border border-djon-text/10 bg-djon-text/5 flex items-center justify-center">
            <p className="text-djon-text/40 text-sm font-bold">Arquivo indisponível.</p>
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-djon-page/92 p-4 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute left-4 right-4 top-4 flex items-center justify-end gap-2 sm:left-auto sm:right-5 sm:top-5">
        <button
          onClick={(e) => { e.stopPropagation(); triggerDownload(att.url, att.name) }}
          disabled={!att.url}
          className="cursor-pointer flex items-center gap-2 bg-djon-accent text-djon-ink px-4 py-2 rounded-full text-xs font-black tracking-widest hover:opacity-90 transition-opacity"
        >
          <Download size={13} /> BAIXAR
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 hover:bg-djon-text/15 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-djon-text" />
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
          className="w-full max-w-2xl h-[50vh] rounded-2xl border border-djon-text/10 bg-djon-text/5 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-djon-text/40 text-sm font-bold">Imagem indisponível.</p>
        </div>
      )}
      <p className="text-djon-text/50 text-sm mt-4 font-medium">{att.name}</p>
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
      <div className="bg-djon-page min-h-screen flex flex-col items-center justify-center px-4 text-center sm:px-6">
        <FileText size={40} className="text-djon-text/10 mb-4" />
        <p className="text-djon-text/40 font-bold text-lg mb-6">Material não encontrado</p>
        <Link
          href="/dashboard/material"
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-opacity hover:opacity-90"
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
    <div className="bg-djon-page min-h-screen">

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
            <div className="w-full h-full bg-gradient-to-br from-djon-surface to-djon-page" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-djon-page via-djon-page/70 to-djon-page/30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 w-full sm:px-6 sm:py-16">
          <motion.div {...fadeUp(0)}>
            <Link
              href="/dashboard/material"
              className="inline-flex items-center gap-2 text-djon-text/50 hover:text-djon-accent text-xs font-black tracking-widest uppercase mb-8 transition-colors"
            >
              <ArrowLeft size={14} /> VOLTAR AO MATERIAL
            </Link>
          </motion.div>

          <motion.span
            className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.1)}
          >
            {material.category}
          </motion.span>

          <motion.h1
            className="djon-section-title font-black text-djon-text text-balance"
            {...fadeUp(0.2)}
          >
            {material.title || "Material sem título"}
          </motion.h1>

          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-5" {...fadeUp(0.3)} />

          <motion.div className="flex items-center gap-3 mt-6" {...fadeUp(0.35)}>
            <div className="w-8 h-8 rounded-full bg-djon-accent/15 flex items-center justify-center overflow-hidden">
              {material.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={material.authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-djon-accent text-xs font-black">{authorName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-djon-text text-sm font-bold leading-tight">{authorName}</p>
              <p className="text-djon-text/40 text-xs">{date}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14 sm:px-6 sm:py-16">
        {material.description && (
          <motion.p className="text-djon-text/60 text-lg leading-relaxed mb-10 border-l-2 border-djon-accent/40 pl-4" {...fadeUp(0)}>
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
          <motion.p className="text-djon-text/30 text-sm" {...fadeUp(0.05)}>
            Este material não possui conteúdo escrito. Confira os anexos abaixo.
          </motion.p>
        )}

        {/* ── ATTACHMENTS ───────────────────────────────────────────────── */}
        {attachments.length > 0 && (
          <motion.div className="mt-16" {...fadeUp(0.1)}>
            <div className="flex items-center gap-2 mb-5">
              <Paperclip size={16} className="text-djon-accent" />
              <h2 className="text-djon-text font-black text-sm tracking-widest uppercase">
                Anexos <span className="text-djon-text/30">({attachments.length})</span>
              </h2>
            </div>

            <div className="grid gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-djon-text/8 bg-djon-text/4 p-4 transition-all hover:border-djon-text/16 sm:flex-row sm:items-center"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    att.type === "pdf" ? "bg-djon-danger/15" : att.type === "image" ? "bg-djon-accent/12" : "bg-djon-text/8"
                  }`}>
                    {att.type === "pdf" ? (
                      <FileText size={20} className="text-djon-danger" />
                    ) : att.type === "image" ? (
                      <ImageIcon size={20} className="text-djon-accent" />
                    ) : (
                      <FileIcon size={20} className="text-djon-text/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text font-bold text-sm truncate">{att.name}</p>
                    <p className="text-djon-text/35 text-xs uppercase tracking-widest font-bold">
                      {att.type}{att.size ? ` · ${att.size}` : ""}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                    {(att.type === "pdf" || att.type === "image") && (
                      <button
                        onClick={() => handleAttachmentClick(att)}
                        className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-full bg-djon-text/8 px-3 py-2 text-xs font-black tracking-widest text-djon-text transition-colors hover:bg-djon-text/15 sm:flex-none"
                      >
                        <Eye size={13} /> VER
                      </button>
                    )}
                    <button
                      onClick={() => triggerDownload(att.url, att.name)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-full bg-djon-accent px-3 py-2 text-xs font-black tracking-widest text-djon-ink transition-opacity hover:opacity-90 sm:flex-none"
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
