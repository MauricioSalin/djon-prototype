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
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#AFFF00]/50 focus:bg-white/8 transition-all"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador DJ ON",
  professor: "Professor DJ ON Academy",
  student: "Aluno DJ ON Academy",
}

const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #111 0%, #0f1a0a 60%, #121212 100%)",
  "linear-gradient(135deg, #0a0a12 0%, #0d0d1a 60%, #121212 100%)",
  "linear-gradient(135deg, #110a0a 0%, #1a0f0a 60%, #121212 100%)",
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
    <div className="bg-[#0a0a0a]">

      {/* ── BANNER + AVATAR ─────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Banner — purely decorative, no glow */}
        <div
          className={`h-56 md:h-72 relative overflow-hidden ${isOwner ? "cursor-pointer group" : ""}`}
          style={{ background: bannerBg }}
          onClick={isOwner ? () => bannerRef.current?.click() : undefined}
        >

          {/* Subtle static dark vignette at bottom so avatar sits on it */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          {isOwner && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur rounded-full px-5 py-2.5 flex items-center gap-2 text-white text-xs font-bold">
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
        <div className="max-w-7xl mx-auto px-6">
          {/* Row: avatar + info + edit button */}
          <div className="flex items-end gap-5 -mt-14 md:-mt-16 pb-2 relative z-10">
            {/* Avatar */}
            <div
              className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#0a0a0a] bg-[#AFFF00]/15 flex items-center justify-center relative overflow-hidden shrink-0 ${isOwner ? "cursor-pointer group" : ""}`}
              onClick={isOwner ? () => avatarRef.current?.click() : undefined}
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#AFFF00] text-5xl font-black">{user.name.charAt(0)}</span>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={22} className="text-white" />
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
                className="inline-block bg-[#AFFF00]/15 text-[#AFFF00] text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {ROLE_LABELS[user.role] ?? "DJ ON Academy"}
              </motion.div>
              <motion.h1
                className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight"
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
                className="cursor-pointer hidden md:flex items-center gap-2 shrink-0 mb-2 border border-white/15 text-white/50 hover:text-white hover:border-white/30 px-5 py-2.5 rounded-full text-xs font-black tracking-widest transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Edit3 size={13} /> EDITAR
              </motion.button>
            )}
          </div>

          {/* Bio + socials + private info — full width below the avatar row */}
          <div className="pb-8 pt-4">
            {user.bio && (
              <motion.p
                className="text-white/50 text-sm max-w-xl leading-relaxed mb-3"
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
                    className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Instagram size={18} /> @{user.socials.instagram}
                  </a>
                )}
                {user.socials?.soundcloud && (
                  <a
                    href={`https://soundcloud.com/${user.socials.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold transition-colors"
                  >
                    <SoundCloudIcon size={22} /> {user.socials.soundcloud}
                  </a>
                )}
                {user.socials?.youtube && (
                  <a
                    href={`https://youtube.com/@${user.socials.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold transition-colors"
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
        <section className="bg-[#0f0f0f] border-t border-white/8 border-b">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2">EDITAR</span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">Seu Perfil</h2>
              <div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" />
              <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-8 max-w-3xl">
                <div className="space-y-5">
                  <div>
                    <label className="text-white/40 text-xs font-black tracking-widest mb-2 block">NOME</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs font-black tracking-widest mb-2 block">E-MAIL</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs font-black tracking-widest mb-2 block">TELEFONE</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
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
                    <label className="text-white/40 text-xs font-black tracking-widest mb-2 block">BIO</label>
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
                  <label className="text-white/40 text-xs font-black tracking-widest mb-2 block">REDES SOCIAIS</label>
                  <div className="relative">
                    <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="instagram" className={`${inputCls} pl-10`} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                      <SoundCloudIcon size={20} />
                    </span>
                    <input value={form.soundcloud} onChange={(e) => setForm({ ...form, soundcloud: e.target.value })} placeholder="soundcloud" className={`${inputCls} pl-10`} />
                  </div>
                  <div className="relative">
                    <Youtube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} placeholder="youtube" className={`${inputCls} pl-10`} />
                  </div>
                  <motion.button
                    type="submit"
                    className="cursor-pointer w-full bg-[#AFFF00] text-[#121212] rounded-xl py-3.5 font-black text-sm tracking-widest flex items-center justify-center gap-2 mt-2"
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
        <section className="py-20 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.span className="block text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>PRÓXIMOS</motion.span>
            <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2" {...fadeUp(0.1)}>Eventos Futuros</motion.h2>
            <motion.div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-10" {...fadeUp(0.15)} />
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
        <section className="py-20 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.span className="block text-white/30 text-xs tracking-widest font-black uppercase mb-2" {...fadeUp(0)}>HISTÓRICO</motion.span>
            <motion.h2 className="text-3xl md:text-5xl font-black text-white/60 tracking-tighter mb-2" {...fadeUp(0.1)}>Eventos Passados</motion.h2>
            <motion.div className="h-[3px] w-10 bg-white/20 rounded-full mb-10" {...fadeUp(0.15)} />
            <div className="space-y-3">
              {pastEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  className="flex items-center gap-5 bg-[#141414] border border-white/6 rounded-2xl px-6 py-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white/20">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 font-black text-sm truncate">{ev.title}</p>
                    <p className="text-white/25 text-xs mt-0.5 flex items-center gap-1.5"><MapPin size={10} />{ev.location}</p>
                  </div>
                  <div className="shrink-0 text-white/25 text-xs font-bold">{fmt(ev.date)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {events.length === 0 && (
        <section className="py-24 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-white/20 text-sm font-bold">Nenhum evento cadastrado ainda.</p>
          </div>
        </section>
      )}

      {/* ── CTA (somente para o dono da conta) ─────────────────────────────── */}
      {isOwner && (
        <section className="py-20 bg-[#0a0a0a] border-t border-white/6">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6" {...fadeUp(0)}>
              Pronto para o próximo set?
            </motion.h2>
            <motion.div className="flex flex-wrap items-center justify-center gap-3" {...fadeUp(0.2)}>
              <Link
                href="/dashboard/student/agendar"
                className="inline-flex items-center gap-2 bg-[#AFFF00] text-[#121212] px-8 py-3.5 rounded-full font-black text-sm tracking-widest"
              >
                AGENDAR AULA <ArrowRight size={14} />
              </Link>
              <Link
                href="/dashboard/student/evento"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-3.5 rounded-full font-black text-sm tracking-widest hover:border-white/40 transition-all"
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
      className="bg-[#161616] border border-white/8 hover:border-[#AFFF00]/30 rounded-2xl p-6 transition-all"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ delay: i * 0.07, duration: 0.6 }}
      whileHover={{ y: -4 }}
    >
      <h3 className="text-white font-black text-xl tracking-tight mb-4 leading-tight">{ev.title}</h3>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <Clock size={12} />
          {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "long",
          })} às {ev.time}
        </div>
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <MapPin size={12} />{ev.location}
        </div>
      </div>
      {ev.instagram && (
        <a
          href={`https://instagram.com/${ev.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#AFFF00] text-xs font-bold hover:underline"
        >
          <Instagram size={11} /> @{ev.instagram}
        </a>
      )}
      {ev.description && (
        <p className="text-white/30 text-xs mt-3 pt-3 border-t border-white/8 leading-relaxed">{ev.description}</p>
      )}
    </motion.div>
  )
}
