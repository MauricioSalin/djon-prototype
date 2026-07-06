"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ArrowLeft, File as FileIcon, FileText, ImageIcon,
  Paperclip, Upload, X,
} from "lucide-react"
import { store, type MaterialAttachment, type User } from "@/lib/store"
import { RichTextEditor } from "@/components/rich-text-editor"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const inputCls = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/25 focus:outline-none focus:border-djon-accent/40 transition-colors"

function attachmentTypeOf(file: File): MaterialAttachment["type"] {
  if (file.type === "application/pdf") return "pdf"
  if (file.type.startsWith("image/")) return "image"
  return "file"
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function NovoMaterialPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<MaterialAttachment[]>([])
  const [saving, setSaving] = useState(false)

  const coverRef = useRef<HTMLInputElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const currentUser = store.getCurrentUser()
    if (!currentUser) {
      router.replace("/login")
      return
    }
    if (currentUser.role !== "admin" && currentUser.role !== "professor") {
      router.replace("/dashboard/material")
      return
    }

    const materialCategories = store.getMaterialCategories()
    setUser(currentUser)
    setCategories(materialCategories)
    setCategory(materialCategories[0] ?? "")
  }, [router])

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCoverUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: attachmentTypeOf(file),
            url: ev.target?.result as string,
            size: formatSize(file.size),
          },
        ])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
  }

  const handleSubmit = () => {
    if (!user || !title.trim() || !category) return
    setSaving(true)

    setTimeout(() => {
      const material = store.addMaterial({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        coverImage: coverUrl || undefined,
        body: body || undefined,
        attachments,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
      })

      setSaving(false)
      router.push(`/dashboard/material/${material.id}`)
    }, 400)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-djon-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/material-hero.png" alt="" fill className="object-cover opacity-25" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-page via-djon-page/88 to-djon-page/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-page via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 sm:px-6 sm:py-16">
          <motion.button
            type="button"
            onClick={() => router.push("/dashboard/material")}
            className="cursor-pointer inline-flex items-center gap-2 text-djon-text/40 hover:text-djon-text text-xs font-black tracking-widest transition-colors mb-10"
            {...fadeUp(0)}
          >
            <ArrowLeft size={14} />
            VOLTAR
          </motion.button>

          <motion.span
            className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.05)}
          >
            MATERIAL
          </motion.span>
          <motion.h1
            className="djon-section-title font-black text-djon-text"
            {...fadeUp(0.1)}
          >
            Novo Material
          </motion.h1>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-4" {...fadeUp(0.15)} />
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 pb-20 sm:px-6 sm:pb-24">
        <motion.div
          className="grid gap-6 items-start lg:grid-cols-[minmax(0,1fr)_320px]"
          {...fadeUp(0.2)}
        >
          <section className="bg-djon-calendar-cell border border-djon-text/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-djon-text/8 px-4 py-5 sm:px-6">
              <div className="w-9 h-9 rounded-full bg-djon-accent/15 flex items-center justify-center">
                <Upload size={15} className="text-djon-accent" />
              </div>
              <h2 className="text-djon-text font-black tracking-tight">Conteúdo</h2>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Título</label>
                <input
                  className={inputCls}
                  placeholder="Nome do material..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Resumo</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Breve descrição que aparece no card..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Conteúdo do material</label>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Escreva o artigo... use a barra para formatar e inserir imagens."
                />
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-5 space-y-5">
              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Categoria</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item} className="bg-djon-calendar-cell">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Imagem de capa</label>
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="cursor-pointer w-full border-2 border-dashed border-djon-text/15 hover:border-djon-accent/40 rounded-xl overflow-hidden transition-colors"
                >
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="py-8 flex flex-col items-center gap-2">
                      <ImageIcon size={24} className="text-djon-text/20" />
                      <span className="text-djon-text/30 text-xs font-bold">Adicionar capa</span>
                    </div>
                  )}
                </button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || !category || saving}
                className="cursor-pointer w-full bg-djon-accent disabled:opacity-40 disabled:cursor-not-allowed text-djon-ink font-black text-sm tracking-widest py-3.5 rounded-full transition-opacity hover:opacity-90"
              >
                {saving ? "PUBLICANDO..." : "PUBLICAR MATERIAL"}
              </button>
            </section>

            <section className="bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-5">
              <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Anexos</label>
              {attachments.length > 0 && (
                <div className="grid gap-2 mb-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 bg-djon-text/5 border border-djon-text/10 rounded-xl px-3 py-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        attachment.type === "pdf" ? "bg-djon-danger/15" : attachment.type === "image" ? "bg-djon-accent/12" : "bg-djon-text/8"
                      }`}>
                        {attachment.type === "pdf" ? <FileText size={14} className="text-djon-danger" />
                          : attachment.type === "image" ? <ImageIcon size={14} className="text-djon-accent" />
                          : <FileIcon size={14} className="text-djon-text/60" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-djon-text text-xs font-bold truncate">{attachment.name}</p>
                        <p className="text-djon-text/30 text-djon-label uppercase tracking-widest font-bold">
                          {attachment.type}{attachment.size ? ` · ${attachment.size}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="cursor-pointer w-7 h-7 rounded-full bg-djon-danger/10 hover:bg-djon-danger/20 flex items-center justify-center transition-colors shrink-0"
                      >
                        <X size={13} className="text-djon-danger" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => attachRef.current?.click()}
                className="cursor-pointer w-full border-2 border-dashed border-djon-text/15 hover:border-djon-accent/40 rounded-xl py-5 flex flex-col items-center gap-2 transition-colors"
              >
                <Paperclip size={20} className="text-djon-text/20" />
                <span className="text-djon-text/30 text-xs font-bold">Adicionar anexos</span>
                <span className="text-djon-text/20 text-djon-label">PDF, imagens ou arquivos</span>
              </button>
              <input ref={attachRef} type="file" multiple accept="*/*" className="hidden" onChange={handleAttachments} />
            </section>
          </aside>
        </motion.div>
      </main>
    </div>
  )
}
