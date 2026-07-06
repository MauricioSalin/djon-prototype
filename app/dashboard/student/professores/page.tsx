"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { GraduationCap, Instagram, Phone } from "lucide-react"
import { SoundCloudIcon } from "@/components/social-icons"
import { store, type User } from "@/lib/store"

export default function StudentProfessoresPage() {
  const router = useRouter()
  const [professors, setProfessors] = useState<User[]>([])

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    setProfessors(store.getProfessors())
  }, [router])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <p className="text-[#AFFF00] text-xs tracking-widest font-black uppercase mb-1">ACADEMY</p>
        <h1 className="text-3xl font-black text-white tracking-tighter">Equipe de Professores</h1>
        <p className="text-white/30 text-sm mt-1">Conheça quem vai guiar sua jornada na DJ ON Academy.</p>
      </div>

      {professors.length === 0 ? (
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-10 text-center">
          <GraduationCap size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Nenhum professor cadastrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {professors.map((u, i) => (
            <motion.div
              key={u.id}
              className="bg-[#161616] border border-white/8 rounded-2xl p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#AFFF00]/15 flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#AFFF00] font-black text-2xl">{u.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/perfil/${u.id}`}
                    className="block text-white hover:text-[#AFFF00] font-black text-base truncate transition-colors underline-offset-4 hover:underline"
                  >
                    {u.name}
                  </Link>
                  <p className="text-[#AFFF00] text-[10px] font-black tracking-widest uppercase">Professor</p>
                </div>
              </div>

              {/* Bio */}
              {u.bio && (
                <p className="text-white/40 text-xs leading-relaxed mb-4">{u.bio}</p>
              )}

              {/* Socials + WhatsApp */}
              <div className="flex items-center gap-3 flex-wrap">
                {u.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${u.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Instagram size={16} /> @{u.socials.instagram}
                  </a>
                )}
                {u.socials?.soundcloud && (
                  <a
                    href={`https://soundcloud.com/${u.socials.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold transition-colors"
                  >
                    <SoundCloudIcon size={20} /> {u.socials.soundcloud}
                  </a>
                )}
                {u.whatsapp && (
                  <a
                    href={`https://wa.me/55${u.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Phone size={14} /> {u.whatsapp}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
