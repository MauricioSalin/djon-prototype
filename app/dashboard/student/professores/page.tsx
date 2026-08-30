"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { GraduationCap, Instagram, Phone } from "lucide-react"
import { SoundCloudIcon } from "@/components/social-icons"
import { store, type User } from "@/lib/store"
import { formatPhone, whatsappUrl } from "@/lib/phone"
import { ListPagination, useListPagination } from "@/components/list-pagination"

export default function StudentProfessoresPage() {
  const router = useRouter()
  const [professors, setProfessors] = useState<User[]>([])

  useEffect(() => {
    const u = store.getCurrentUser()
    if (!u) { router.replace("/login"); return }
    setProfessors(store.getProfessors())
  }, [router])
  const pagination = useListPagination(professors)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 sm:px-6 sm:py-10">
      <div>
        <p className="text-djon-accent text-xs tracking-widest font-black uppercase mb-1">ACADEMY</p>
        <h1 className="text-3xl font-black text-djon-text tracking-tighter">Equipe de Professores</h1>
        <p className="text-djon-text/30 text-sm mt-1">Conheça quem vai guiar sua jornada na DJ ON Academy.</p>
      </div>

      {professors.length === 0 ? (
        <div className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-8 text-center sm:p-10">
          <GraduationCap size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">Nenhum professor cadastrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pagination.paginatedItems.map((u, i) => (
            <motion.div
              key={u.id}
              className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="djon-avatar-fallback w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-djon-accent font-black text-2xl">{u.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/perfil/${u.id}`}
                    className="block truncate text-base font-black text-djon-text transition-colors hover:text-djon-accent"
                  >
                    {u.name}
                  </Link>
                  <p className="text-djon-accent text-djon-label font-black tracking-widest uppercase">Professor</p>
                </div>
              </div>

              {/* Bio */}
              {u.bio && (
                <p className="text-djon-text/40 text-xs leading-relaxed mb-4">{u.bio}</p>
              )}

              {/* Socials + WhatsApp */}
              <div className="flex items-center gap-3 flex-wrap">
                {u.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${u.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
                  >
                    <Instagram size={16} /> @{u.socials.instagram}
                  </a>
                )}
                {u.socials?.soundcloud && (
                  <a
                    href={`https://soundcloud.com/${u.socials.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
                  >
                    <SoundCloudIcon size={20} /> {u.socials.soundcloud}
                  </a>
                )}
                {u.whatsapp && (
                  <a
                    href={whatsappUrl(u.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-djon-text/30 hover:brightness-110 text-xs font-bold transition-colors"
                  >
                    <Phone size={14} /> {formatPhone(u.whatsapp)}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ListPagination
        totalItems={professors.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  )
}
