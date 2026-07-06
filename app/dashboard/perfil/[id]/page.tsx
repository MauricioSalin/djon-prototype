"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { store, type User } from "@/lib/store"
import { ProfileView } from "@/components/portal/profile-view"

export default function PublicPerfilPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const cu = store.getCurrentUser()
    if (!cu) { router.replace("/login"); return }
    setCurrentUser(cu)
    const u = store.getUserById(id)
    if (!u) { router.replace("/dashboard/mural"); return }
    setViewedUser(u)
  }, [id, router])

  if (!viewedUser || !currentUser) return null

  const isOwner = currentUser.id === viewedUser.id

  const backHref =
    currentUser.role === "admin"
      ? "/dashboard/admin"
      : currentUser.role === "professor"
      ? "/dashboard/professor"
      : "/dashboard/student"

  return (
    <div>
      {/* Back bar */}
      <div className="border-b border-white/8 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center">
          <Link
            href="/dashboard/mural"
            className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold tracking-wide transition-colors"
          >
            <ArrowLeft size={13} /> Voltar ao Mural
          </Link>
        </div>
      </div>
      <ProfileView
        user={viewedUser}
        isOwner={isOwner}
        onUserUpdate={(u) => setViewedUser(u)}
      />
    </div>
  )
}
