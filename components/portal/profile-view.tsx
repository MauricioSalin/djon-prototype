"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { useLenis } from "lenis/react"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen, CalendarDays, Camera, Instagram, Youtube, Save,
  MapPin, Clock, ArrowLeft, ArrowRight, Edit3, Music, Mail, Phone,
  ExternalLink, GraduationCap, MessageSquareText, Upload, X, KeyRound,
} from "lucide-react"
import { SoundCloudIcon, SpotifyIcon } from "@/components/social-icons"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { usePageTitle } from "@/components/page-title-manager"
import { store, type User, type DJEvent, type StudentCourseProgress, type StudentObservation } from "@/lib/store"
import { formatPhone } from "@/lib/phone"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const inputCls =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:brightness-110 transition-all"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador DJ ON",
  professor: "Professor DJ ON Academy",
  student: "Aluno DJ ON Academy",
}

const BANNER_FALLBACK = "var(--djon-gradient-image-fallback)"
const DEFAULT_RELEASE_COVER = "/images/latest-release-default.jpg"

type EditableSection = "profile" | "courses" | "socials" | "release" | "password"

interface ProfileViewProps {
  user: User
  isOwner?: boolean
  onUserUpdate?: (u: User) => void
}

export function ProfileView({ user, isOwner = false, onUserUpdate }: ProfileViewProps) {
  usePageTitle(user.projectName || user.name)
  const lenis = useLenis()

  const events = store.getEventsByUser(user.id).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const [editingSection, setEditingSection] = useState<EditableSection | null>(
    user.passwordChangeRequired ? "password" : null,
  )
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    projectName: user.projectName ?? "",
    email: user.email,
    whatsapp: formatPhone(user.whatsapp),
    bio: user.bio ?? "",
    pressKit: user.socials?.pressKit ?? "",
  })
  const [socialForm, setSocialForm] = useState({
    instagram: user.socials?.instagram ?? "",
    soundcloud: user.socials?.soundcloud ?? "",
    youtube: user.socials?.youtube ?? "",
    spotify: user.socials?.spotify ?? "",
  })
  const [releaseForm, setReleaseForm] = useState({
    title: user.latestRelease?.title ?? "",
    link: user.latestRelease?.link ?? "",
    cover: user.latestRelease?.cover ?? "",
  })
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" })
  const [passwordMessage, setPasswordMessage] = useState("")
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const [failedBanner, setFailedBanner] = useState<string | null>(null)
  const [studentObservations, setStudentObservations] = useState<StudentObservation[]>([])
  const [observationsLoading, setObservationsLoading] = useState(false)
  const [observationsError, setObservationsError] = useState(false)
  const [viewingObservations, setViewingObservations] = useState(false)
  const [courseProgress, setCourseProgress] = useState<StudentCourseProgress[]>([])
  const [courseProgressLoading, setCourseProgressLoading] = useState(user.role === "student")
  const [courseProgressError, setCourseProgressError] = useState(false)
  const [courseVisibilityForm, setCourseVisibilityForm] = useState({
    show: user.showAcademicProgress !== false,
    courseIds: user.profileCourseIds ?? [],
  })
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const releaseCoverRef = useRef<HTMLInputElement>(null)
  const [pendingReleaseCoverId, setPendingReleaseCoverId] = useState<string | null>(null)

  const scrollToEditor = useCallback((section: EditableSection) => {
    const editor = document.getElementById(`${section}-editor`)
    if (!editor) return
    if (lenis) {
      lenis.scrollTo(editor, { offset: -80 })
      return
    }
    editor.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [lenis])

  useEffect(() => {
    if (!editingSection) return
    const frame = window.requestAnimationFrame(() => scrollToEditor(editingSection))
    return () => window.cancelAnimationFrame(frame)
  }, [editingSection, scrollToEditor])

  const viewer = store.getCurrentUser()
  const mayViewStudentObservations =
    viewer?.role === "professor" && user.role === "student"

  useEffect(() => {
    if (!mayViewStudentObservations) {
      setStudentObservations([])
      setObservationsLoading(false)
      setObservationsError(false)
      return
    }

    let active = true
    setObservationsLoading(true)
    setObservationsError(false)
    store.listStudentObservations(user.id)
      .then((items) => {
        if (active) setStudentObservations(items)
      })
      .catch(() => {
        if (active) setObservationsError(true)
      })
      .finally(() => {
        if (active) setObservationsLoading(false)
      })
    return () => { active = false }
  }, [mayViewStudentObservations, user.id])

  useEffect(() => {
    if (user.role !== "student") {
      setCourseProgress([])
      setCourseProgressLoading(false)
      setCourseProgressError(false)
      return
    }

    let active = true
    setCourseProgressLoading(true)
    setCourseProgressError(false)
    store.listStudentCourseProgress(user.id)
      .then((items) => {
        if (!active) return
        setCourseProgress(items)
        setCourseVisibilityForm({
          show: user.showAcademicProgress !== false,
          courseIds: items.filter((item) => item.visible).map((item) => item.id),
        })
      })
      .catch(() => {
        if (active) setCourseProgressError(true)
      })
      .finally(() => {
        if (active) setCourseProgressLoading(false)
      })
    return () => { active = false }
  }, [user.id, user.role, user.showAcademicProgress])

  const startEditing = async (section: EditableSection) => {
    if (user.passwordChangeRequired && section !== "password") return
    if (editingSection === section) {
      scrollToEditor(section)
      return
    }
    if (editingSection === "release" && section !== "release") {
      if (pendingReleaseCoverId) {
        await store.deleteFile(pendingReleaseCoverId, { silent: true }).catch(() => undefined)
        setPendingReleaseCoverId(null)
      }
      setReleaseForm({
        title: user.latestRelease?.title ?? "",
        link: user.latestRelease?.link ?? "",
        cover: user.latestRelease?.cover ?? "",
      })
    }
    if (editingSection === "profile" && section !== "profile") {
      setProfileForm({
        name: user.name,
        projectName: user.projectName ?? "",
        email: user.email,
        whatsapp: formatPhone(user.whatsapp),
        bio: user.bio ?? "",
        pressKit: user.socials?.pressKit ?? "",
      })
    }
    if (editingSection === "courses" && section !== "courses") {
      setCourseVisibilityForm({
        show: user.showAcademicProgress !== false,
        courseIds: courseProgress.filter((item) => item.visible).map((item) => item.id),
      })
    }
    if (editingSection === "socials" && section !== "socials") {
      setSocialForm({
        instagram: user.socials?.instagram ?? "",
        soundcloud: user.socials?.soundcloud ?? "",
        youtube: user.socials?.youtube ?? "",
        spotify: user.socials?.spotify ?? "",
      })
    }
    if (editingSection === "password" && section !== "password") {
      setPasswordForm({ current: "", next: "", confirm: "" })
      setPasswordMessage("")
    }
    setEditingSection(section)
  }

  const handleImageUpload = async (file: File, field: "avatar" | "banner") => {
    const uploaded = await store.uploadFile(file, field)
    try {
      const updated = await store.updateUser(user.id, { [field]: uploaded.url })
      if (onUserUpdate) onUserUpdate(updated)
    } catch (error) {
      await store.deleteFile(uploaded.id, { silent: true }).catch(() => undefined)
      throw error
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await store.updateUser(user.id, {
      name: profileForm.name,
      projectName: profileForm.projectName,
      email: profileForm.email,
      whatsapp: profileForm.whatsapp,
      bio: profileForm.bio,
      socials: {
        ...user.socials,
        pressKit: profileForm.pressKit.trim() || undefined,
      },
    })
    if (updated && onUserUpdate) onUserUpdate(updated)
    setEditingSection(null)
  }

  const handleCourseVisibilitySave = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await store.updateUser(user.id, {
      showAcademicProgress: courseVisibilityForm.show,
      profileCourseIds: courseVisibilityForm.courseIds,
    })
    setCourseProgress((items) =>
      items.map((item) => ({
        ...item,
        visible:
          courseVisibilityForm.show &&
          courseVisibilityForm.courseIds.includes(item.id),
      })),
    )
    if (updated && onUserUpdate) onUserUpdate(updated)
    setEditingSection(null)
  }

  const handleSocialSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await store.updateUser(user.id, {
      socials: {
        instagram: socialForm.instagram.trim().replace(/^@/, "") || undefined,
        soundcloud: socialForm.soundcloud.trim().replace(/^@/, "") || undefined,
        youtube: socialForm.youtube.trim().replace(/^@/, "") || undefined,
        spotify: socialForm.spotify.trim() || undefined,
        pressKit: user.socials?.pressKit,
      },
    })
    if (updated && onUserUpdate) onUserUpdate(updated)
    setEditingSection(null)
  }

  const handleReleaseCoverUpload = async (file: File) => {
    const uploaded = await store.uploadFile(file, "latest-release-cover")
    if (pendingReleaseCoverId) {
      await store.deleteFile(pendingReleaseCoverId, { silent: true }).catch(() => undefined)
    }
    setPendingReleaseCoverId(uploaded.id)
    setReleaseForm((current) => ({ ...current, cover: uploaded.url }))
  }

  const useDefaultReleaseCover = async () => {
    if (pendingReleaseCoverId) {
      await store.deleteFile(pendingReleaseCoverId, { silent: true }).catch(() => undefined)
      setPendingReleaseCoverId(null)
    }
    setReleaseForm((current) => ({ ...current, cover: "" }))
  }

  const handleReleaseSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await store.updateUser(user.id, {
      latestRelease: {
        title: releaseForm.title.trim() || undefined,
        link: releaseForm.link.trim() || undefined,
        cover: releaseForm.cover || undefined,
      },
    })
    setPendingReleaseCoverId(null)
    if (updated && onUserUpdate) onUserUpdate(updated)
    setEditingSection(null)
  }

  const cancelEditing = async () => {
    if (editingSection === "release" && pendingReleaseCoverId) {
      await store.deleteFile(pendingReleaseCoverId, { silent: true }).catch(() => undefined)
      setPendingReleaseCoverId(null)
    }
    setProfileForm({
      name: user.name,
      projectName: user.projectName ?? "",
      email: user.email,
      whatsapp: formatPhone(user.whatsapp),
      bio: user.bio ?? "",
      pressKit: user.socials?.pressKit ?? "",
    })
    setSocialForm({
      instagram: user.socials?.instagram ?? "",
      soundcloud: user.socials?.soundcloud ?? "",
      youtube: user.socials?.youtube ?? "",
      spotify: user.socials?.spotify ?? "",
    })
    setReleaseForm({
      title: user.latestRelease?.title ?? "",
      link: user.latestRelease?.link ?? "",
      cover: user.latestRelease?.cover ?? "",
    })
    setCourseVisibilityForm({
      show: user.showAcademicProgress !== false,
      courseIds: courseProgress.filter((item) => item.visible).map((item) => item.id),
    })
    setEditingSection(null)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage("")
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("A confirmação da nova senha não confere.")
      return
    }
    try {
      await store.changePassword(passwordForm.current, passwordForm.next)
      setPasswordForm({ current: "", next: "", confirm: "" })
      const updated = store.getCurrentUser()
      if (updated && onUserUpdate) onUserUpdate(updated)
      setPasswordMessage("")
      setEditingSection(null)
    } catch {
      // O cliente HTTP já apresenta o erro de forma padronizada.
    }
  }

  const upcomingEvents = events.filter((e) => new Date(e.date + "T00:00:00") >= new Date())
  const pastEvents = events.filter((e) => new Date(e.date + "T00:00:00") < new Date()).reverse()
  const historyPagination = useListPagination(pastEvents, user.id)

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const hasAvatar = Boolean(user.avatar && failedAvatar !== user.avatar)
  const hasBanner = Boolean(user.banner && failedBanner !== user.banner)
  const hasSocials = Boolean(
    user.socials?.instagram ||
    user.socials?.soundcloud ||
    user.socials?.youtube ||
    user.socials?.spotify,
  )
  const hasLatestRelease = Boolean(
    user.latestRelease?.title || user.latestRelease?.link || user.latestRelease?.cover,
  )
  const hasStudentObservations =
    mayViewStudentObservations &&
    !observationsLoading &&
    !observationsError &&
    studentObservations.length > 0
  const visibleCourseProgress = courseProgress.filter((item) => item.visible)

  if (viewingObservations && hasStudentObservations) {
    return (
      <StudentObservationsView
        user={user}
        observations={studentObservations}
        formatDate={fmt}
        onBack={() => setViewingObservations(false)}
      />
    )
  }

  return (
    <div className="bg-djon-page">

      {/* ── BANNER + AVATAR ─────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Banner — purely decorative, no glow */}
        <div
          className={`h-56 md:h-72 relative overflow-hidden ${isOwner ? "cursor-pointer group" : ""}`}
          style={{ background: BANNER_FALLBACK }}
          role={isOwner ? "button" : undefined}
          tabIndex={isOwner ? 0 : undefined}
          aria-label={isOwner ? "Alterar banner" : undefined}
          onClick={isOwner ? () => bannerRef.current?.click() : undefined}
          onKeyDown={isOwner ? (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              bannerRef.current?.click()
            }
          } : undefined}
        >

          {hasBanner && user.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.banner}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedBanner(user.banner ?? null)}
            />
          )}

          {/* Subtle static dark vignette at bottom so avatar sits on it */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-djon-page to-transparent" />
          {isOwner && (
            <div className="absolute inset-0 bg-djon-black/0 group-hover:brightness-110 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-djon-black/70 backdrop-blur rounded-full px-5 py-2.5 flex items-center gap-2 text-djon-text text-xs font-bold">
                <Camera size={13} /> Alterar banner
              </div>
            </div>
          )}
          <input
            ref={bannerRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "banner")}
          />
        </div>

        {/* Avatar + info — overlaps the banner via negative margin */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Row: avatar + info + edit button */}
          <div className="relative z-10 -mt-14 flex flex-col items-start gap-4 pb-2 sm:flex-row sm:items-end sm:gap-5 md:-mt-16">
            {/* Avatar */}
            <div
              className={`djon-avatar-fallback relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-djon-page sm:h-28 sm:w-28 md:h-36 md:w-36 ${isOwner ? "cursor-pointer group" : ""}`}
              role={isOwner ? "button" : undefined}
              tabIndex={isOwner ? 0 : undefined}
              aria-label={isOwner ? "Alterar foto de perfil" : undefined}
              onClick={isOwner ? () => avatarRef.current?.click() : undefined}
              onKeyDown={isOwner ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  avatarRef.current?.click()
                }
              } : undefined}
            >
              {hasAvatar && user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={() => setFailedAvatar(user.avatar ?? null)}
                />
              ) : (
                <span className="text-djon-accent text-4xl font-black sm:text-5xl">{user.name.charAt(0)}</span>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-djon-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={22} className="text-djon-text" />
                </div>
              )}
              <input
                ref={avatarRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "avatar")}
              />
            </div>

            {/* Info — grows to fill available width */}
            <div className="flex-1 min-w-0 pb-2">
              <motion.div
                className="inline-block bg-djon-accent/15 text-djon-accent text-djon-label font-black tracking-[0.2em] px-3 py-1 rounded-full mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {ROLE_LABELS[user.role] ?? "DJ ON Academy"}
              </motion.div>
              <motion.h1
                className="djon-section-title flex items-center gap-3 font-black text-djon-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <span>{user.projectName || user.name}</span>
                {hasStudentObservations && (
                  <MessageSquareText
                    size={22}
                    className="shrink-0 translate-y-[0.06em] self-center text-djon-light-purple"
                    aria-label="Aluno com observações"
                  />
                )}
              </motion.h1>
              {user.projectName && <p className="mt-1 text-sm font-bold text-djon-text/40">{user.name}</p>}
            </div>

            {/* Account actions — pinned to the right, aligned to bottom of row */}
            {isOwner && (
              <div className="mb-2 hidden shrink-0 items-center gap-2 md:flex">
                {!user.passwordChangeRequired && (
                  <motion.button onClick={() => startEditing("profile")} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-djon-text/15 px-5 py-2.5 text-xs font-black tracking-widest text-djon-text/50 transition-opacity hover:opacity-70" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Edit3 size={13} /> EDITAR
                  </motion.button>
                )}
                <motion.button onClick={() => startEditing("password")} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-djon-text/15 px-5 py-2.5 text-xs font-black tracking-widest text-djon-text/50 transition-opacity hover:opacity-70" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <KeyRound size={13} /> ALTERAR SENHA
                </motion.button>
              </div>
            )}
          </div>

          {/* Bio + socials + private info — full width below the avatar row */}
          <div className="pb-8 pt-4">
            {isOwner && (
              <div className="mb-5 grid gap-2 md:hidden">
                {!user.passwordChangeRequired && (
                  <motion.button onClick={() => startEditing("profile")} className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-djon-text/15 px-5 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-opacity hover:opacity-70" whileTap={{ scale: 0.97 }}>
                    <Edit3 size={13} /> EDITAR PERFIL
                  </motion.button>
                )}
                <motion.button onClick={() => startEditing("password")} className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-djon-text/15 px-5 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-opacity hover:opacity-70" whileTap={{ scale: 0.97 }}>
                  <KeyRound size={13} /> ALTERAR SENHA
                </motion.button>
              </div>
            )}

            {user.bio && (
              <motion.p
                className="text-djon-text/50 text-sm max-w-xl leading-relaxed mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {user.bio}
              </motion.p>
            )}

            {(hasStudentObservations || user.socials?.pressKit) && (
              <div className="flex flex-wrap items-center gap-2">
                {hasStudentObservations && (
                  <motion.button
                    type="button"
                    onClick={() => setViewingObservations(true)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-djon-light-purple/25 bg-djon-light-purple/8 px-4 py-2 text-xs font-black tracking-wide text-djon-light-purple transition-all hover:border-djon-light-purple/50 hover:brightness-110"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <MessageSquareText size={13} /> VER OBSERVAÇÕES
                  </motion.button>
                )}
                {user.socials?.pressKit && (
                  <motion.a
                    href={user.socials.pressKit}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-djon-text/10 px-4 py-2 text-xs font-black tracking-wide text-djon-text/45 transition-all hover:border-djon-accent/40 hover:text-djon-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    PRESS KIT <ExternalLink size={12} />
                  </motion.a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── EDIÇÃO DO PERFIL ────────────────────────────────────────────────── */}
      {isOwner && editingSection === "profile" && (
        <section id="profile-editor" className="scroll-mt-20 border-y border-djon-text/8 bg-djon-muted-panel">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <EditorHeading title="Seu Perfil" onCancel={cancelEditing} />
              <form onSubmit={handleProfileSave} className="grid max-w-3xl gap-5 md:grid-cols-2 md:gap-6">
                <Field label="NOME">
                  <input required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="NOME DO PROJETO ARTÍSTICO">
                  <input value={profileForm.projectName} onChange={(e) => setProfileForm({ ...profileForm, projectName: e.target.value })} placeholder="Ex: DJ Aurora" className={inputCls} />
                </Field>
                <Field label="E-MAIL">
                  <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className={`${inputCls} pl-10`} /></div>
                </Field>
                <Field label="TELEFONE">
                  <div className="relative"><Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input type="tel" value={profileForm.whatsapp} onChange={(e) => setProfileForm({ ...profileForm, whatsapp: formatPhone(e.target.value) })} placeholder="(51) 99999-0000" inputMode="numeric" autoComplete="tel" maxLength={15} className={`${inputCls} pl-10`} /></div>
                </Field>
                <Field label="BIO" className="md:col-span-2">
                  <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} placeholder="Escreva algo sobre você..." className={`${inputCls} resize-none`} />
                </Field>
                <Field label="PRESS KIT" className="md:col-span-2">
                  <div className="relative"><ExternalLink size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input type="url" value={profileForm.pressKit} onChange={(e) => setProfileForm({ ...profileForm, pressKit: e.target.value })} placeholder="https://..." className={`${inputCls} pl-10`} /></div>
                </Field>
                <SaveActions onCancel={cancelEditing} />
              </form>
            </motion.div>
          </div>
        </section>
      )}

      {isOwner && editingSection === "password" && (
        <section id="password-editor" className="scroll-mt-20 border-y border-djon-text/8 bg-djon-muted-panel">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <EditorHeading title={user.passwordChangeRequired ? "Crie sua nova senha" : "Alterar Senha"} onCancel={user.passwordChangeRequired ? undefined : cancelEditing} />
              {user.passwordChangeRequired && (
                <p className="mb-7 max-w-2xl rounded-2xl border border-djon-accent/20 bg-djon-accent/8 p-4 text-sm leading-relaxed text-djon-text/65">
                  Você entrou com uma senha temporária. Defina uma senha pessoal para liberar o restante do portal.
                </p>
              )}
              <form onSubmit={handlePasswordChange} className="max-w-3xl">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="SENHA ATUAL"><input type="password" required value={passwordForm.current} autoComplete="current-password" onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} placeholder={user.passwordChangeRequired ? "Senha temporária" : "Senha atual"} className={inputCls} /></Field>
                  <Field label="NOVA SENHA"><input type="password" required minLength={8} value={passwordForm.next} autoComplete="new-password" onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} placeholder="Mínimo de 8 caracteres" className={inputCls} /></Field>
                  <Field label="CONFIRMAR NOVA SENHA"><input type="password" required minLength={8} value={passwordForm.confirm} autoComplete="new-password" onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Repita a nova senha" className={inputCls} /></Field>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:items-start">
                  <div className="flex w-full flex-col-reverse gap-3 sm:w-72 sm:flex-row">
                    {!user.passwordChangeRequired && <button type="button" onClick={cancelEditing} className="h-12 w-full flex-1 rounded-xl border border-djon-text/10 px-5 text-xs font-black tracking-widest text-djon-text/50 transition-colors hover:text-djon-text">CANCELAR</button>}
                    <button type="submit" className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-djon-accent px-6 text-sm font-black tracking-widest text-djon-ink"><Save size={15} /> SALVAR</button>
                  </div>
                  {passwordMessage && <p role="status" className="text-xs font-bold text-djon-warning-red">{passwordMessage}</p>}
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── REDES SOCIAIS ────────────────────────────────────────────────────── */}
      {(isOwner || hasSocials) && (
        <section id={editingSection === "socials" ? "socials-editor" : undefined} className={`scroll-mt-20 border-t border-djon-text/6 py-16 sm:py-20 ${editingSection === "socials" ? "bg-djon-muted-panel" : "bg-djon-page"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {editingSection === "socials" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <EditorHeading title="Redes Sociais" onCancel={cancelEditing} />
                <form onSubmit={handleSocialSave} className="grid max-w-3xl gap-5 md:grid-cols-2">
                  <Field label="INSTAGRAM"><div className="relative"><Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input value={socialForm.instagram} onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })} placeholder="seuusuario" className={`${inputCls} pl-10`} /></div></Field>
                  <Field label="SOUNDCLOUD"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"><SoundCloudIcon size={20} /></span><input value={socialForm.soundcloud} onChange={(e) => setSocialForm({ ...socialForm, soundcloud: e.target.value })} placeholder="seuusuario" className={`${inputCls} pl-10`} /></div></Field>
                  <Field label="YOUTUBE"><div className="relative"><Youtube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input value={socialForm.youtube} onChange={(e) => setSocialForm({ ...socialForm, youtube: e.target.value })} placeholder="seucanal" className={`${inputCls} pl-10`} /></div></Field>
                  <Field label="SPOTIFY"><div className="relative"><SpotifyIcon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input type="url" value={socialForm.spotify} onChange={(e) => setSocialForm({ ...socialForm, spotify: e.target.value })} placeholder="https://open.spotify.com/artist/..." className={`${inputCls} pl-10`} /></div></Field>
                  <SaveActions onCancel={cancelEditing} />
                </form>
              </motion.div>
            ) : (
              <>
                <SectionHeading eyebrow="CONEXÕES" title="Redes Sociais" isOwner={isOwner && !user.passwordChangeRequired} onEdit={() => startEditing("socials")} />
                {hasSocials ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {user.socials?.instagram && <SocialCard href={`https://instagram.com/${user.socials.instagram}`} label="Instagram" value={`@${user.socials.instagram}`} icon={<Instagram size={22} />} />}
                    {user.socials?.soundcloud && <SocialCard href={`https://soundcloud.com/${user.socials.soundcloud}`} label="SoundCloud" value={user.socials.soundcloud} icon={<SoundCloudIcon size={25} />} />}
                    {user.socials?.youtube && <SocialCard href={`https://youtube.com/@${user.socials.youtube}`} label="YouTube" value={user.socials.youtube} icon={<Youtube size={23} />} />}
                    {user.socials?.spotify && <SocialCard href={user.socials.spotify} label="Spotify" value="Ouvir perfil" icon={<SpotifyIcon size={24} />} />}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-djon-text/10 px-5 py-8 text-sm font-bold text-djon-text/30">Adicione suas redes para que outros artistas encontrem você.</p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── ÚLTIMO LANÇAMENTO ───────────────────────────────────────────────── */}
      {(isOwner || hasLatestRelease) && (
        <section id={editingSection === "release" ? "release-editor" : undefined} className={`scroll-mt-20 py-16 sm:py-20 ${editingSection === "release" ? "border-y border-djon-text/8 bg-djon-page" : "bg-djon-muted-panel"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {editingSection === "release" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <EditorHeading title="Último Lançamento" onCancel={cancelEditing} />
                <form onSubmit={handleReleaseSave} className="grid max-w-3xl gap-6 md:grid-cols-[220px_1fr] md:gap-8">
                  <div>
                    <button type="button" onClick={() => releaseCoverRef.current?.click()} className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-djon-text/10 bg-djon-surface-2">
                      <Image src={releaseForm.cover || DEFAULT_RELEASE_COVER} alt="Prévia da capa" fill sizes="220px" className="object-cover transition-[filter] group-hover:brightness-75" />
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"><span className="flex items-center gap-2 rounded-full bg-djon-black/75 px-4 py-2 text-xs font-black text-djon-text"><Upload size={14} /> TROCAR CAPA</span></span>
                    </button>
                    <input ref={releaseCoverRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => e.target.files?.[0] && handleReleaseCoverUpload(e.target.files[0])} />
                    <p className="mt-3 text-xs leading-relaxed text-djon-text/30">Sem imagem? A capa padrão do DJ ON será usada automaticamente.</p>
                    {releaseForm.cover && <button type="button" onClick={useDefaultReleaseCover} className="mt-3 text-xs font-black tracking-wide text-djon-text/40 transition-colors hover:text-djon-accent">USAR CAPA PADRÃO</button>}
                  </div>
                  <div className="space-y-5">
                    <Field label="TÍTULO"><input value={releaseForm.title} onChange={(e) => setReleaseForm({ ...releaseForm, title: e.target.value })} placeholder="Nome do single, EP, álbum ou set" maxLength={150} className={inputCls} /></Field>
                    <Field label="LINK"><div className="relative"><ExternalLink size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" /><input type="url" value={releaseForm.link} onChange={(e) => setReleaseForm({ ...releaseForm, link: e.target.value })} placeholder="https://..." className={`${inputCls} pl-10`} /></div></Field>
                    <SaveActions onCancel={cancelEditing} />
                  </div>
                </form>
              </motion.div>
            ) : (
              <>
                <SectionHeading eyebrow="NOVIDADE" title="Último Lançamento" isOwner={isOwner && !user.passwordChangeRequired} onEdit={() => startEditing("release")} />
                <div className="max-w-3xl overflow-hidden rounded-3xl border border-djon-text/10 bg-djon-surface-2 shadow-djon-soft sm:flex">
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden sm:w-64">
                    <Image src={user.latestRelease?.cover || DEFAULT_RELEASE_COVER} alt={`Capa de ${user.latestRelease?.title || "último lançamento"}`} fill sizes="(min-width: 640px) 256px, 100vw" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-8">
                    <span className="mb-3 text-xs font-black tracking-[0.2em] text-djon-accent">LANÇAMENTO MAIS RECENTE</span>
                    <h3 className="text-2xl font-black tracking-tight text-djon-text sm:text-3xl">{user.latestRelease?.title || "Adicione seu último lançamento"}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-djon-text/40">Compartilhe sua música mais recente, seja single, EP, álbum ou set.</p>
                    {user.latestRelease?.link && <a href={user.latestRelease.link} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90">OUVIR AGORA <ExternalLink size={13} /></a>}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── CURSOS ───────────────────────────────────────────────────────── */}
      {user.role === "student" && (isOwner || visibleCourseProgress.length > 0) && (
        <section
          id={editingSection === "courses" ? "courses-editor" : undefined}
          className={`scroll-mt-20 py-16 sm:py-20 ${editingSection === "courses" ? "bg-djon-muted-panel" : "bg-djon-page"}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {editingSection === "courses" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <EditorHeading title="Cursos no perfil" onCancel={cancelEditing} />
                <form onSubmit={handleCourseVisibilitySave} className="max-w-3xl space-y-6">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-djon-text/10 bg-djon-text/5 p-4">
                    <input type="checkbox" checked={courseVisibilityForm.show} onChange={(event) => setCourseVisibilityForm((current) => ({ ...current, show: event.target.checked }))} className="mt-0.5 size-4 accent-djon-accent" />
                    <span>
                      <span className="block text-sm font-black text-djon-text">Exibir a seção de cursos</span>
                      <span className="mt-1 block text-xs leading-relaxed text-djon-text/40">Quando desativada, nenhuma informação de curso ou progresso aparece para outras pessoas.</span>
                    </span>
                  </label>
                  <div className={`space-y-3 transition-opacity ${courseVisibilityForm.show ? "opacity-100" : "opacity-45"}`}>
                    <div>
                      <p className="text-xs font-black tracking-widest text-djon-text/60">CURSOS VISÍVEIS</p>
                      <p className="mt-1 text-xs text-djon-text/35">Escolha em quais cursos a porcentagem de conclusão será mostrada.</p>
                    </div>
                    {courseProgress.map((course) => {
                      const checked = courseVisibilityForm.courseIds.includes(course.id)
                      return (
                        <label key={course.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-djon-text/10 bg-djon-surface-2 px-4 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-djon-text">{course.name}</span>
                            <span className="mt-1 block text-xs font-bold text-djon-text/35">{course.percent}% concluído</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setCourseVisibilityForm((current) => ({
                              ...current,
                              courseIds: checked ? current.courseIds.filter((id) => id !== course.id) : [...current.courseIds, course.id],
                            }))}
                            className="size-4 shrink-0 accent-djon-accent"
                          />
                        </label>
                      )
                    })}
                    {!courseProgressLoading && courseProgress.length === 0 && (
                      <p className="rounded-xl border border-dashed border-djon-text/10 px-4 py-6 text-sm text-djon-text/35">Você ainda não está matriculado em um curso.</p>
                    )}
                  </div>
                  <SaveActions onCancel={cancelEditing} />
                </form>
              </motion.div>
            ) : (
              <>
                <SectionHeading eyebrow="DJ ON ACADEMY" title="Cursos" isOwner={isOwner && !user.passwordChangeRequired} onEdit={() => startEditing("courses")} />
                {courseProgressLoading ? (
                  <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-djon-text/5" />)}
                  </div>
                ) : courseProgressError ? (
                  <p className="rounded-2xl border border-djon-warning-red/20 bg-djon-warning-red/5 px-5 py-6 text-sm text-djon-warning-red">Não foi possível carregar o progresso dos cursos.</p>
                ) : visibleCourseProgress.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleCourseProgress.map((course, index) => <CourseProgressCard key={course.id} course={course} index={index} />)}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-djon-text/10 px-5 py-8 text-sm font-bold text-djon-text/30">A seção está oculta. Use Editar para escolher os cursos que deseja mostrar.</p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── PRÓXIMOS EVENTOS ────────────────────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 bg-djon-page sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>PRÓXIMOS</motion.span>
            <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2" {...fadeUp(0.1)}>Eventos Futuros</motion.h2>
            <motion.div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" {...fadeUp(0.15)} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HISTÓRICO ───────────────────────────────────────────────────────── */}
      {pastEvents.length > 0 && (
        <section className="py-16 bg-djon-muted-panel sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.span className="block text-djon-text/30 text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>HISTÓRICO</motion.span>
            <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text/60 tracking-tighter mb-2" {...fadeUp(0.1)}>Eventos Passados</motion.h2>
            <motion.div className="h-[3px] w-10 bg-djon-text/20 rounded-full mb-10" {...fadeUp(0.15)} />
            <div className="space-y-3">
              {historyPagination.paginatedItems.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  className="flex flex-col gap-3 rounded-2xl border border-djon-text/6 bg-djon-surface px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-djon-text/5 flex items-center justify-center shrink-0 text-djon-text/20">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text/50 font-black text-sm truncate">{ev.title}</p>
                    <p className="text-djon-text/25 text-xs mt-0.5 flex items-center gap-1.5"><MapPin size={10} />{ev.location}</p>
                  </div>
                  <div className="shrink-0 text-djon-text/25 text-xs font-bold">{fmt(ev.date)}</div>
                </motion.div>
              ))}
            </div>
            <ListPagination
              totalItems={pastEvents.length}
              page={historyPagination.page}
              pageSize={historyPagination.pageSize}
              totalPages={historyPagination.totalPages}
              onPageChange={historyPagination.setPage}
              onPageSizeChange={historyPagination.setPageSize}
            />
          </div>
        </section>
      )}

      {/* ── CTA (somente para o dono da conta) ─────────────────────────────── */}
      {isOwner && user.role !== "admin" && (
        <section className="py-16 bg-djon-page border-t border-djon-text/6 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 text-center sm:px-6">
            <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-6" {...fadeUp(0)}>
              {user.role === "professor" ? "Pronto para a próxima aula?" : "Pronto para o próximo set?"}
            </motion.h2>
            <motion.div className="flex flex-wrap items-center justify-center gap-3" {...fadeUp(0.2)}>
              <Link
                href={user.role === "professor" ? "/dashboard/agenda" : "/dashboard/student/agendar"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-8 py-3.5 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:w-auto"
              >
                {user.role === "professor" ? "VER AGENDA" : "AGENDAR AULA"} <ArrowRight size={14} />
              </Link>
              <Link
                href={user.role === "professor" ? "/dashboard/professor/evento" : "/dashboard/student/evento"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-djon-text/20 px-8 py-3.5 text-sm font-black tracking-widest text-djon-text transition-all hover:brightness-110 sm:w-auto"
              >
                <Music size={14} /> NOVO EVENTO
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}

function StudentObservationsView({
  user,
  observations,
  formatDate,
  onBack,
}: {
  user: User
  observations: StudentObservation[]
  formatDate: (date: string) => string
  onBack: () => void
}) {
  return (
    <div className="min-h-[70vh] bg-djon-page">
      <section className="border-y border-djon-text/8 bg-djon-muted-panel">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <motion.button
            type="button"
            onClick={onBack}
            className="mb-10 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-djon-text/15 px-5 py-2.5 text-xs font-black tracking-widest text-djon-text/55 transition-colors hover:border-djon-accent/35 hover:text-djon-text"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={14} /> VOLTAR
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-djon-light-purple">
              ACOMPANHAMENTO
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tighter text-djon-text md:text-5xl">
                Observações
              </h2>
              <MessageSquareText size={24} className="shrink-0 text-djon-light-purple" />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-djon-text/40">
              Registros de {user.projectName || user.name} feitos durante as aulas para acompanhar dificuldades, evolução e próximos pontos de atenção.
            </p>
            <div className="mb-10 mt-4 h-[3px] w-10 rounded-full bg-djon-light-purple" />
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {observations.map((observation, index) => (
              <motion.article
                key={observation.id}
                className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3) }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-djon-accent">
                      <BookOpen size={12} /> {observation.courseName}
                    </span>
                    <h3 className="mt-2 text-lg font-black leading-tight text-djon-text">
                      Aula {observation.lessonOrder}
                      {observation.lessonTitle ? ` · ${observation.lessonTitle}` : ""}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-djon-text/30">
                      {observation.cohortName}
                    </p>
                  </div>
                  <MessageSquareText size={19} className="shrink-0 text-djon-light-purple" />
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-djon-text/65">
                  {observation.observation}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-djon-text/8 pt-4 text-[11px] font-bold text-djon-text/30">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} /> {formatDate(observation.date)} às {observation.time}
                  </span>
                  {observation.professorName && <span>Prof. {observation.professorName}</span>}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">{label}</label>
      {children}
    </div>
  )
}

function EditorHeading({ title, onCancel }: { title: string; onCancel?: () => void }) {
  return (
    <div className="mb-10 flex items-start justify-between gap-4">
      <div>
        <span className="mb-2 block text-xs font-black uppercase tracking-widest text-djon-accent">EDITAR</span>
        <h2 className="text-3xl font-black tracking-tighter text-djon-text md:text-5xl">{title}</h2>
        <div className="mt-2 h-[3px] w-10 rounded-full bg-djon-accent" />
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} aria-label="Fechar edição" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-djon-text/10 text-djon-text/45 transition-colors hover:border-djon-text/25 hover:text-djon-text">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function SaveActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex w-full flex-col-reverse gap-3 md:col-span-2 sm:ml-auto sm:w-72 sm:flex-row">
      <button type="button" onClick={onCancel} className="h-12 w-full flex-1 rounded-xl border border-djon-text/10 px-5 text-xs font-black tracking-widest text-djon-text/50 transition-colors hover:text-djon-text">CANCELAR</button>
      <motion.button type="submit" className="flex h-12 w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-djon-accent px-6 text-sm font-black tracking-widest text-djon-ink" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Save size={15} /> SALVAR
      </motion.button>
    </div>
  )
}

function SectionHeading({ eyebrow, title, isOwner, onEdit }: { eyebrow: string; title: string; isOwner: boolean; onEdit: () => void }) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <motion.span className="mb-2 block text-xs font-black uppercase tracking-widest text-djon-accent" {...fadeUp(0)}>{eyebrow}</motion.span>
        <motion.h2 className="text-3xl font-black tracking-tighter text-djon-text md:text-5xl" {...fadeUp(0.1)}>{title}</motion.h2>
        <motion.div className="mt-2 h-[3px] w-10 rounded-full bg-djon-accent" {...fadeUp(0.15)} />
      </div>
      {isOwner && (
        <motion.button type="button" onClick={onEdit} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-djon-text/15 px-5 py-2.5 text-xs font-black tracking-widest text-djon-text/50 transition-opacity hover:opacity-70 sm:w-auto" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Edit3 size={13} /> EDITAR
        </motion.button>
      )}
    </div>
  )
}

function CourseProgressCard({ course, index }: { course: StudentCourseProgress; index: number }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2"
      {...fadeUp(index * 0.06)}
      whileHover={{ y: -4 }}
    >
      <div className="relative h-36 overflow-hidden bg-djon-muted-panel">
        {course.coverImage && !imageFailed ? (
          <Image
            src={course.coverImage}
            alt={`Capa do curso ${course.name}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-djon-surface to-djon-muted-panel">
            <GraduationCap size={34} className="text-djon-accent" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-djon-black/75 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 text-xs font-black tracking-widest text-djon-accent">CURSO</span>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-black tracking-tight text-djon-text">{course.name}</h3>
        {course.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-djon-text/40">{course.description}</p>}
        <div className="mt-5 flex items-center justify-between gap-4 text-xs font-black text-djon-text/55">
          <span>PROGRESSO</span>
          <span className="text-djon-accent">{course.percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-djon-text/8" role="progressbar" aria-label={`Conclusão do curso ${course.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={course.percent}>
          <div className="h-full rounded-full bg-djon-accent transition-[width]" style={{ width: `${course.percent}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-djon-text/30">{course.completed} de {course.total} aulas concluídas</p>
      </div>
    </motion.article>
  )
}

function SocialCard({ href, label, value, icon }: { href: string; label: string; value: string; icon: ReactNode }) {
  return (
    <motion.a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 transition-all hover:border-djon-accent/30 hover:brightness-110" {...fadeUp(0.1)} whileHover={{ y: -3 }}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-djon-text/5 text-djon-text/55 transition-colors group-hover:text-djon-accent">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-black tracking-widest text-djon-text">{label}</span><span className="mt-1 block truncate text-xs font-bold text-djon-text/35">{value}</span></span>
      <ExternalLink size={14} className="shrink-0 text-djon-text/20 transition-colors group-hover:text-djon-accent" />
    </motion.a>
  )
}

function EventCard({ ev, i }: { ev: DJEvent; i: number }) {
  return (
    <motion.div
      key={ev.id}
      className="bg-djon-surface-2 border border-djon-text/8 hover:brightness-110 rounded-2xl p-6 transition-all"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ delay: i * 0.07, duration: 0.6 }}
      whileHover={{ y: -4 }}
    >
      <h3 className="text-djon-text font-black text-xl tracking-tight mb-4 leading-tight">{ev.title}</h3>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-djon-text/50 text-xs">
          <Clock size={12} />
          {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "long",
          })} às {ev.time}
        </div>
        <div className="flex items-center gap-2 text-djon-text/50 text-xs">
          <MapPin size={12} />{ev.location}
        </div>
      </div>
      {ev.instagram && (
        <a
          href={`https://instagram.com/${ev.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
        >
          <Instagram size={11} /> @{ev.instagram}
        </a>
      )}
      {ev.description && (
        <p className="text-djon-text/30 text-xs mt-3 pt-3 border-t border-djon-text/8 leading-relaxed">{ev.description}</p>
      )}
    </motion.div>
  )
}
