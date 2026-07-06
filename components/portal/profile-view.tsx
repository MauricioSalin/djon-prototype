"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Camera, Instagram, Youtube, Save, CheckCircle,
  MapPin, Clock, ArrowRight, Edit3, Music, Mail, Phone,
} from "lucide-react"
import { SoundCloudIcon } from "@/components/social-icons"
import { store, type User, type DJEvent } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

const inputCls =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:bg-djon-text/8 transition-all"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador DJ ON",
  professor: "Professor DJ ON Academy",
  student: "Aluno DJ ON Academy",
}

const BANNER_GRADIENTS = [
  "var(--djon-gradient-profile-admin)",
  "var(--djon-gradient-profile-professor)",
  "var(--djon-gradient-profile-student)",
]

interface ProfileViewProps {
  user: User
  isOwner?: boolean
  onUserUpdate?: (u: User) => void
}

export function ProfileView({ user, isOwner = false, onUserUpdate }: ProfileViewProps) {
  const events = store.getEventsByUser(user.id).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp ?? "",
    bio: user.bio ?? "",
    instagram: user.socials?.instagram ?? "",
    soundcloud: user.socials?.soundcloud ?? "",
    youtube: user.socials?.youtube ?? "",
  })
  const [saved, setSaved] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (file: File, field: "avatar" | "banner") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      const updated = store.updateUser(user.id, { [field]: url })
      if (updated && onUserUpdate) onUserUpdate(updated)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const updated = store.updateUser(user.id, {
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      bio: form.bio,
      socials: { instagram: form.instagram, soundcloud: form.soundcloud, youtube: form.youtube },
    })
    if (updated && onUserUpdate) onUserUpdate(updated)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const upcomingEvents = events.filter((e) => new Date(e.date + "T00:00:00") >= new Date())
  const pastEvents = events.filter((e) => new Date(e.date + "T00:00:00") < new Date()).reverse()

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  // Pick a deterministic banner gradient based on user id if no banner uploaded
  const gradientIndex = user.id.charCodeAt(user.id.length - 1) % BANNER_GRADIENTS.length
  const bannerBg = user.banner
    ? `url(${user.banner}) center/cover`
    : BANNER_GRADIENTS[gradientIndex]

  return (
    <div className="bg-djon-page">

      {/* ── BANNER + AVATAR ─────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Banner — purely decorative, no glow */}
        <div
          className={`h-56 md:h-72 relative overflow-hidden ${isOwner ? "cursor-pointer group" : ""}`}
          style={{ background: bannerBg }}
          onClick={isOwner ? () => bannerRef.current?.click() : undefined}
        >

          {/* Subtle static dark vignette at bottom so avatar sits on it */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-djon-page to-transparent" />
          {isOwner && (
            <div className="absolute inset-0 bg-djon-page/0 group-hover:bg-djon-page/30 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-djon-page/70 backdrop-blur rounded-full px-5 py-2.5 flex items-center gap-2 text-djon-text text-xs font-bold">
                <Camera size={13} /> Alterar banner
              </div>
            </div>
          )}
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
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
              className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-djon-page bg-djon-accent/15 sm:h-28 sm:w-28 md:h-36 md:w-36 ${isOwner ? "cursor-pointer group" : ""}`}
              onClick={isOwner ? () => avatarRef.current?.click() : undefined}
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-djon-accent text-4xl font-black sm:text-5xl">{user.name.charAt(0)}</span>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-djon-page/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={22} className="text-djon-text" />
                </div>
              )}
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
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
                className="djon-section-title font-black text-djon-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {user.name}
              </motion.h1>
            </div>

            {/* Edit button — pinned to the right, aligned to bottom of row */}
            {isOwner && (
              <motion.button
                onClick={() => setEditing((v) => !v)}
                className="cursor-pointer hidden md:flex items-center gap-2 shrink-0 mb-2 border border-djon-text/15 text-djon-text/50 hover:text-djon-text hover:border-djon-text/30 px-5 py-2.5 rounded-full text-xs font-black tracking-widest transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Edit3 size={13} /> EDITAR
              </motion.button>
            )}
          </div>

          {/* Bio + socials + private info — full width below the avatar row */}
          <div className="pb-8 pt-4">
            {isOwner && (
              <motion.button
                onClick={() => setEditing((v) => !v)}
                className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-djon-text/15 px-5 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-all hover:border-djon-text/30 hover:text-djon-text md:hidden"
                whileTap={{ scale: 0.97 }}
              >
                <Edit3 size={13} /> EDITAR PERFIL
              </motion.button>
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

            {/* Socials */}
            {(user.socials?.instagram || user.socials?.soundcloud || user.socials?.youtube) && (
              <motion.div
                className="flex flex-wrap gap-4 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {user.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${user.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/40 hover:text-djon-text text-xs font-bold transition-colors"
                  >
                    <Instagram size={18} /> @{user.socials.instagram}
                  </a>
                )}
                {user.socials?.soundcloud && (
                  <a
                    href={`https://soundcloud.com/${user.socials.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/40 hover:text-djon-text text-xs font-bold transition-colors"
                  >
                    <SoundCloudIcon size={22} /> {user.socials.soundcloud}
                  </a>
                )}
                {user.socials?.youtube && (
                  <a
                    href={`https://youtube.com/@${user.socials.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/40 hover:text-djon-text text-xs font-bold transition-colors"
                  >
                    <Youtube size={18} /> {user.socials.youtube}
                  </a>
                )}
              </motion.div>
            )}


          </div>
        </div>
      </section>

      {/* ── EDIT FORM ─────────────────────────────────────────────────────────── */}
      {isOwner && editing && (
        <section className="bg-djon-muted-panel border-t border-djon-text/8 border-b">
          <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2">EDITAR</span>
              <h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2">Seu Perfil</h2>
              <div className="h-[3px] w-10 bg-djon-accent rounded-full mb-10" />
              <form onSubmit={handleSave} className="grid max-w-3xl gap-6 md:grid-cols-2 md:gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">NOME</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">E-MAIL</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">TELEFONE</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="51 9 9999-0000"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">BIO</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      placeholder="Escreva algo sobre você..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">REDES SOCIAIS</label>
                  <div className="relative">
                    <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="instagram" className={`${inputCls} pl-10`} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30">
                      <SoundCloudIcon size={20} />
                    </span>
                    <input value={form.soundcloud} onChange={(e) => setForm({ ...form, soundcloud: e.target.value })} placeholder="soundcloud" className={`${inputCls} pl-10`} />
                  </div>
                  <div className="relative">
                    <Youtube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30" />
                    <input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} placeholder="youtube" className={`${inputCls} pl-10`} />
                  </div>
                  <motion.button
                    type="submit"
                    className="cursor-pointer w-full bg-djon-accent text-djon-ink rounded-xl py-3.5 font-black text-sm tracking-widest flex items-center justify-center gap-2 mt-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {saved ? <><CheckCircle size={15} /> SALVO!</> : <><Save size={15} /> SALVAR PERFIL</>}
                  </motion.button>
                </div>
              </form>
            </motion.div>
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
              {pastEvents.map((ev, i) => (
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
          </div>
        </section>
      )}

      {events.length === 0 && (
        <section className="py-20 bg-djon-page sm:py-24">
          <div className="max-w-7xl mx-auto px-4 text-center sm:px-6">
            <p className="text-djon-text/20 text-sm font-bold">Nenhum evento cadastrado ainda.</p>
          </div>
        </section>
      )}

      {/* ── CTA (somente para o dono da conta) ─────────────────────────────── */}
      {isOwner && (
        <section className="py-16 bg-djon-page border-t border-djon-text/6 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 text-center sm:px-6">
            <motion.h2 className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-6" {...fadeUp(0)}>
              Pronto para o próximo set?
            </motion.h2>
            <motion.div className="flex flex-wrap items-center justify-center gap-3" {...fadeUp(0.2)}>
              <Link
                href="/dashboard/student/agendar"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-8 py-3.5 text-sm font-black tracking-widest text-djon-ink sm:w-auto"
              >
                AGENDAR AULA <ArrowRight size={14} />
              </Link>
              <Link
                href="/dashboard/student/evento"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-djon-text/20 px-8 py-3.5 text-sm font-black tracking-widest text-djon-text transition-all hover:border-djon-text/40 sm:w-auto"
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

function EventCard({ ev, i }: { ev: DJEvent; i: number }) {
  return (
    <motion.div
      key={ev.id}
      className="bg-djon-surface-2 border border-djon-text/8 hover:border-djon-accent/30 rounded-2xl p-6 transition-all"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
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
          className="inline-flex items-center gap-1.5 text-djon-accent text-xs font-bold hover:underline"
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
