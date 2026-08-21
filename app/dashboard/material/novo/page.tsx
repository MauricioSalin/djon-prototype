"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle, ArrowLeft, File as FileIcon, FileText, ImageIcon,
  Paperclip, Save, Upload, X,
} from "lucide-react"
import { store, type Material, type MaterialAttachment, type UploadedFile, type User } from "@/lib/store"
import { RichTextEditor } from "@/components/rich-text-editor"
import { DjonSelect } from "@/components/djon-select"
import { useConfirmation } from "@/components/confirmation-provider"
import { notifyError, notifyUndoable } from "@/lib/feedback"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024

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

function referencesFile(value: string | undefined, id: string) {
  return Boolean(value?.includes(`/api/v1/files/${id}`))
}

type EditorSnapshot = {
  title: string
  description: string
  category: string
  coverUrl: string
  body: string
  attachments: MaterialAttachment[]
}

function snapshotOf(value: EditorSnapshot) {
  return JSON.stringify(value)
}

export default function NovoMaterialPage() {
  const router = useRouter()
  const { confirm } = useConfirmation()
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<MaterialAttachment[]>([])
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<Material["status"]>("published")
  const [loaded, setLoaded] = useState(false)
  const [exitModalOpen, setExitModalOpen] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState("")
  const draftIdsRef = useRef(new Set<string>())
  const committedRef = useRef(false)
  const allowNavigationRef = useRef(false)
  const dirtyRef = useRef(false)
  const pendingHrefRef = useRef("/dashboard/material")
  const editorHrefRef = useRef("")

  const coverRef = useRef<HTMLInputElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const draftIds = draftIdsRef.current
    editorHrefRef.current = window.location.href
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
    const initialCategory = materialCategories[0] ?? ""
    setCategory(initialCategory)
    const materialId = new URLSearchParams(window.location.search).get("edit")
    if (materialId) {
      store.fetchMaterialById(materialId).then((material) => {
        if (currentUser.role !== "admin" && material.authorId !== currentUser.id) { router.replace("/dashboard/material"); return }
        setEditingId(material.id); setTitle(material.title); setDescription(material.description ?? "")
        setCategory(material.category); setCoverUrl(material.coverImage ?? ""); setBody(material.body ?? "")
        setAttachments(material.attachments ?? [])
        setEditingStatus(material.status)
        setInitialSnapshot(snapshotOf({
          title: material.title,
          description: material.description ?? "",
          category: material.category,
          coverUrl: material.coverImage ?? "",
          body: material.body ?? "",
          attachments: material.attachments ?? [],
        }))
        setLoaded(true)
      }).catch(() => router.replace("/dashboard/material"))
    } else {
      setInitialSnapshot(snapshotOf({
        title: "",
        description: "",
        category: initialCategory,
        coverUrl: "",
        body: "",
        attachments: [],
      }))
      setLoaded(true)
    }
    return () => {
      if (!committedRef.current) {
        for (const id of draftIds) void store.deleteFile(id, { silent: true }).catch(() => undefined)
      }
    }
  }, [router])

  const currentSnapshot = useMemo(
    () =>
      snapshotOf({ title, description, category, coverUrl, body, attachments }),
    [attachments, body, category, coverUrl, description, title],
  )
  const isDirty = loaded && currentSnapshot !== initialSnapshot
  const isEditingDraft = Boolean(editingId && editingStatus === "draft")
  const showDraftAction = !editingId || isEditingDraft
  const primaryStatus: Material["status"] = isEditingDraft ? "published" : editingStatus

  useEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }
    const handleDocumentClick = (event: MouseEvent) => {
      if (!dirtyRef.current || allowNavigationRef.current) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>("a[href]")
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.href === window.location.href) return
      event.preventDefault()
      event.stopPropagation()
      pendingHrefRef.current = destination.href
      setExitModalOpen(true)
    }
    const handlePopState = () => {
      if (!dirtyRef.current || allowNavigationRef.current) return
      window.history.pushState(null, "", editorHrefRef.current)
      pendingHrefRef.current = "/dashboard/material"
      setExitModalOpen(true)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
    document.addEventListener("click", handleDocumentClick, true)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [])

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const uploaded = await store.uploadFile(file, "material-cover")
      draftIdsRef.current.add(uploaded.id)
      const currentDraftId = [...draftIdsRef.current].find((id) => coverUrl.includes(id))
      if (currentDraftId) { await store.deleteFile(currentDraftId, { silent: true }); draftIdsRef.current.delete(currentDraftId) }
      setCoverUrl(uploaded.url)
    } catch {
      // A camada de API já exibiu o motivo do erro no toast.
    } finally {
      input.value = ""
    }
  }

  const handleAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const files = Array.from(e.target.files ?? [])
    const oversized = files.filter((file) => file.size > MAX_ATTACHMENT_SIZE)
    if (oversized.length > 0) {
      notifyError(
        "Anexo maior que 100 MB",
        `${oversized[0].name} ultrapassa o limite de 100 MB por arquivo.`,
      )
      input.value = ""
      return
    }

    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const result = await store.uploadFile(file, "material-attachment")
        draftIdsRef.current.add(result.id)
        return {
          id: result.id,
          name: file.name,
          type: attachmentTypeOf(file),
          url: result.url,
          size: formatSize(file.size),
        }
      }))
      setAttachments((previous) => [...previous, ...uploaded])
    } catch {
      // A camada de API já exibiu o motivo do erro no toast.
    } finally {
      input.value = ""
    }
  }

  const removeAttachment = async (id: string) => {
    const attachment = attachments.find((item) => item.id === id)
    if (!attachment) return
    const confirmed = await confirm({
      title: "Remover anexo?",
      description: `${attachment.name} será retirado do material. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "REMOVER",
      confirmVariant: "outline",
    })
    if (!confirmed) return

    const index = attachments.findIndex((item) => item.id === id)
    const wasDraft = draftIdsRef.current.has(id)
    draftIdsRef.current.delete(id)
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
    notifyUndoable({
      title: "Anexo removido",
      description: `${attachment.name} não fará mais parte do material.`,
      commit: referencesFile(attachment.url, id) ? () => store.deleteFile(id, { silent: true, keepalive: true }) : undefined,
      undo: () => {
        if (wasDraft) draftIdsRef.current.add(id)
        setAttachments((current) => {
          const restored = [...current]
          restored.splice(Math.min(index, restored.length), 0, attachment)
          return restored
        })
      },
      undoDescription: `${attachment.name} voltou ao material.`,
    })
  }

  const trackRichTextUpload = (uploaded: UploadedFile) => {
    draftIdsRef.current.add(uploaded.id)
  }

  const navigateTo = (href: string) => {
    allowNavigationRef.current = true
    const destination = new URL(href, window.location.href)
    if (destination.origin === window.location.origin) {
      router.push(`${destination.pathname}${destination.search}${destination.hash}`)
      return
    }
    window.location.assign(destination.href)
  }

  const requestExit = (href = "/dashboard/material") => {
    if (!isDirty) {
      navigateTo(href)
      return
    }
    pendingHrefRef.current = href
    setExitModalOpen(true)
  }

  const persistMaterial = async (status: Material["status"], destination?: string) => {
    if (!user) return false
    if (status === "published" && (!title.trim() || !category)) {
      notifyError(
        "Preencha os dados obrigatórios",
        "Informe o título e a categoria antes de publicar o material.",
      )
      return false
    }
    setSaving(true)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        coverImage: coverUrl || undefined,
        body: body || undefined,
        attachments,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
      }
      const material = editingId
        ? await store.updateMaterial(editingId, payload)
        : await store.addMaterial(payload)

      const referencedDraftIds = new Set(
        [...draftIdsRef.current].filter((id) =>
          referencesFile(coverUrl, id) ||
          referencesFile(body, id) ||
          attachments.some((attachment) => referencesFile(attachment.url, id)),
        ),
      )
      await Promise.allSettled(
        [...draftIdsRef.current]
          .filter((id) => !referencedDraftIds.has(id))
          .map((id) => store.deleteFile(id, { silent: true })),
      )
      draftIdsRef.current.clear()
      committedRef.current = true
      setInitialSnapshot(currentSnapshot)
      navigateTo(
        destination ??
          (status === "draft"
            ? "/dashboard/material?category=Rascunhos"
            : `/dashboard/material/${material.id}`),
      )
      return true
    } catch {
      // A camada da API exibe um toast com o motivo do erro.
      return false
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <DashboardPageSkeleton variant="form" />

  if (!loaded) return <DashboardPageSkeleton variant="form" />

  return (
    <div className="min-h-screen bg-djon-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/material-hero.png" alt="" fill className="object-cover opacity-25" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/88 to-djon-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <motion.button
            type="button"
            onClick={() => requestExit("/dashboard/material")}
            className="cursor-pointer mb-10 inline-flex items-center gap-2 text-djon-text opacity-40 text-xs font-black tracking-widest transition-opacity hover:opacity-100"
            {...fadeUp(0)}
          >
            <ArrowLeft size={14} />
            VOLTAR
          </motion.button>

          <motion.span
            className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.05)}
          >
            {editingStatus === "draft" && editingId ? "RASCUNHO" : "MATERIAL"}
          </motion.span>
          <motion.h1
            className="djon-section-title font-black text-djon-text"
            {...fadeUp(0.1)}
          >
            {editingStatus === "draft" && editingId
              ? "Continuar Rascunho"
              : editingId
                ? "Editar Material"
                : "Novo Material"}
          </motion.h1>
          <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mt-4" {...fadeUp(0.15)} />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
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
                  onFileUploaded={trackRichTextUpload}
                  placeholder="Escreva o artigo... use a barra para formatar e inserir imagens."
                />
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-5 space-y-5">
              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Categoria</label>
                <DjonSelect value={category} onChange={setCategory}
                  options={categories.map((item) => ({ value: item, label: item }))}
                  placeholder="Selecionar categoria..." className="h-12" />
              </div>

              <div>
                <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Imagem de capa</label>
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="cursor-pointer w-full border-2 border-dashed border-djon-text/15 hover:brightness-110 rounded-xl overflow-hidden transition-colors"
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
                <input ref={coverRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleCover} />
              </div>

              <div className="grid gap-2">
                {showDraftAction && (
                  <button
                    type="button"
                    onClick={() => void persistMaterial("draft")}
                    disabled={saving}
                    className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-full border border-djon-text/15 bg-djon-text/5 py-3.5 text-sm font-black tracking-widest text-djon-text transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save size={15} />
                    {saving ? "SALVANDO..." : "SALVAR RASCUNHO"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void persistMaterial(primaryStatus)}
                  disabled={saving || (primaryStatus === "published" && (!title.trim() || !category))}
                  className="cursor-pointer w-full bg-djon-accent disabled:opacity-40 disabled:cursor-not-allowed text-djon-ink font-black text-sm tracking-widest py-3.5 rounded-full transition-[filter] hover:brightness-90"
                >
                  {saving
                    ? "SALVANDO..."
                    : isEditingDraft
                      ? "PUBLICAR"
                      : editingId
                        ? "SALVAR ALTERAÇÕES"
                        : "PUBLICAR MATERIAL"}
                </button>
              </div>
            </section>

            <section className="bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-5">
              <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">Anexos</label>
              {attachments.length > 0 && (
                <div className="grid gap-2 mb-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 bg-djon-text/5 border border-djon-text/10 rounded-xl px-3 py-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        attachment.type === "pdf" ? "bg-djon-warning-red/15" : attachment.type === "image" ? "bg-djon-accent/12" : "bg-djon-text/8"
                      }`}>
                        {attachment.type === "pdf" ? <FileText size={14} className="text-djon-warning-red" />
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
                        onClick={() => void removeAttachment(attachment.id)}
                        className="cursor-pointer w-7 h-7 rounded-full bg-djon-warning-red/10 hover:brightness-110 flex items-center justify-center transition-colors shrink-0"
                      >
                        <X size={13} className="text-djon-warning-red" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => attachRef.current?.click()}
                className="cursor-pointer w-full border-2 border-dashed border-djon-text/15 hover:brightness-110 rounded-xl py-5 flex flex-col items-center gap-2 transition-colors"
              >
                <Paperclip size={20} className="text-djon-text/20" />
                <span className="text-djon-text/30 text-xs font-bold">Adicionar anexos</span>
                <span className="text-djon-text/20 text-djon-label">PDF, imagens ou arquivos · até 100 MB cada</span>
              </button>
              <input ref={attachRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.zip,.doc,.docx,.xls,.xlsx,.mp3,.wav,.mp4" className="hidden" onChange={handleAttachments} />
            </section>
          </aside>
        </motion.div>
      </main>

      <AnimatePresence>
        {exitModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-djon-black/75 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setExitModalOpen(false)
            }}
          >
            <motion.section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="draft-exit-title"
              aria-describedby="draft-exit-description"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-lg rounded-2xl border border-djon-text/15 bg-djon-calendar-cell p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-djon-accent/15">
                  <AlertTriangle size={20} className="text-djon-accent" />
                </div>
                <button
                  type="button"
                  aria-label="Continuar editando"
                  onClick={() => setExitModalOpen(false)}
                  disabled={saving}
                  className="cursor-pointer rounded-full p-2 text-djon-text opacity-40 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-5 text-xs font-black tracking-[0.2em] text-djon-accent">
                ALTERAÇÕES NÃO SALVAS
              </p>
              <h2 id="draft-exit-title" className="mt-2 text-2xl font-black text-djon-text">
                {editingStatus === "published" && editingId
                  ? "Salvar alterações antes de sair?"
                  : "Salvar como rascunho?"}
              </h2>
              <p id="draft-exit-description" className="mt-3 text-sm leading-6 text-djon-text/55">
                {editingStatus === "published" && editingId
                  ? "Você alterou este material. Salve agora para não perder o que foi feito."
                  : "Guarde o conteúdo em Rascunhos para continuar a edição depois, ou descarte as alterações."}
              </p>

              <div className="mt-7 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setExitModalOpen(false)}
                  disabled={saving}
                  className="cursor-pointer rounded-full border border-djon-text/15 px-4 py-3 text-xs font-black tracking-wider text-djon-text/70 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  CONTINUAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExitModalOpen(false)
                    navigateTo(pendingHrefRef.current)
                  }}
                  disabled={saving}
                  className="cursor-pointer rounded-full border border-djon-warning-red/35 px-4 py-3 text-xs font-black tracking-wider text-djon-warning-red transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  DESCARTAR
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void persistMaterial(
                      editingStatus === "published" && editingId ? "published" : "draft",
                      pendingHrefRef.current,
                    )
                  }
                  disabled={saving || (editingStatus === "published" && Boolean(editingId) && (!title.trim() || !category))}
                  className="cursor-pointer rounded-full bg-djon-accent px-4 py-3 text-xs font-black tracking-wider text-djon-ink transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? "SALVANDO..."
                    : editingStatus === "published" && editingId
                      ? "SALVAR"
                      : "SALVAR RASCUNHO"}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
