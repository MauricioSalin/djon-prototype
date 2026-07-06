"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Save, CheckCircle, Instagram, Music, Youtube, Camera } from "lucide-react"
import { store, type User } from "@/lib/store"
import { useRef } from "react"

const inp = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all"

export default function AdminConfigPage() {
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: "", bio: "", instagram: "", soundcloud: "", youtube: "" })
  const [saved, setSaved] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = store.getCurrentUser()
    setUser(u)
    if (u) {
      setForm({ name: u.name, bio: u.bio ?? "", instagram: u.socials?.instagram ?? "", soundcloud: u.socials?.soundcloud ?? "", youtube: u.socials?.youtube ?? "" })
    }
  }, [])

  const handleImageUpload = (file: File, field: "avatar" | "banner") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      if (!user) return
      store.updateUser(user.id, { [field]: url })
      setUser(store.getCurrentUser())
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    store.updateUser(user.id, { name: form.name, bio: form.bio, socials: { instagram: form.instagram, soundcloud: form.soundcloud, youtube: form.youtube } })
    setUser(store.getCurrentUser())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!user) return null

  const totalStudents = store.getUsers().filter((u) => u.role === "student").length
  const totalEvents = store.getEvents().length
  const totalBookings = store.getBookings().length

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">ADMINISTRAÇÃO</p>
        <h1 className="text-3xl font-black text-djon-text tracking-tighter">Configurações</h1>
      </div>

      {/* Profile card with banner */}
      <motion.div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div
          className="h-28 relative cursor-pointer group"
          style={{ background: user.banner ? `url(${user.banner}) center/cover` : "var(--djon-gradient-config-banner)" }}
          onClick={() => bannerRef.current?.click()}
        >
          <div className="absolute inset-0 bg-djon-page/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-djon-page/60 rounded-xl px-4 py-2 flex items-center gap-2 text-djon-text text-xs font-bold">
              <Camera size={13} /> Alterar banner
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "banner")} />
        </div>
        <div className="px-4 pb-6 sm:px-6">
          <div className="-mt-8 mb-4 flex items-end gap-4">
            <div
              className="w-14 h-14 rounded-full border-4 border-djon-surface-2 bg-djon-accent flex items-center justify-center cursor-pointer group relative overflow-hidden shrink-0"
              onClick={() => avatarRef.current?.click()}
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-djon-ink text-xl font-black">{user.name.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-djon-page/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={14} className="text-djon-text" />
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "avatar")} />
            </div>
            <div>
              <h2 className="text-djon-text font-black text-xl tracking-tight">{user.name}</h2>
              <p className="text-djon-accent text-xs font-bold tracking-wide">ADMINISTRADOR</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Alunos", value: totalStudents, color: "var(--djon-color-accent)" },
          { label: "Eventos", value: totalEvents, color: "var(--djon-color-info)" },
          { label: "Agendamentos", value: totalBookings, color: "var(--djon-color-purple)" },
        ].map((s, i) => (
          <motion.div key={s.label} className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-djon-text/40 text-djon-label font-bold tracking-wide mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Edit form */}
      <motion.div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="text-djon-accent text-xs tracking-wide font-bold mb-1">PERFIL DA ACADEMIA</p>
        <h2 className="text-xl font-black text-djon-text tracking-tighter mb-4">Editar dados</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">NOME</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">BIO</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3} className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">REDES SOCIAIS</label>
            <div className="space-y-2">
              <div className="relative">
                <Instagram size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-djon-text/30" />
                <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="instagram" className={`${inp} pl-9`} />
              </div>
              <div className="relative">
                <Music size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-djon-text/30" />
                <input value={form.soundcloud} onChange={(e) => setForm({ ...form, soundcloud: e.target.value })}
                  placeholder="soundcloud" className={`${inp} pl-9`} />
              </div>
              <div className="relative">
                <Youtube size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-djon-text/30" />
                <input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                  placeholder="youtube" className={`${inp} pl-9`} />
              </div>
            </div>
          </div>
          <motion.button type="submit"
            className="w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {saved ? <><CheckCircle size={15} /> SALVO!</> : <><Save size={15} /> SALVAR CONFIGURAÇÕES</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
