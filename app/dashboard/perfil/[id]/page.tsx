"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { store, type User } from "@/lib/store"
import { ProfileView } from "@/components/portal/profile-view"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

export default function PublicPerfilPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const cu = store.getCurrentUser()
    if (!cu) { router.replace("/login"); return }
    setCurrentUser(cu)
    let active = true
    store.fetchUserById(id)
      .then((profile) => { if (active) setViewedUser(profile) })
      .catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [id, router])

  if (loadError) return <div className="min-h-[50vh] flex items-center justify-center text-djon-text/50 font-bold">Perfil não encontrado.</div>
  if (!viewedUser || !currentUser) return <DashboardPageSkeleton variant="profile" />

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
      <div className="border-b border-djon-text/8 bg-djon-page">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center sm:px-6">
          <Link
            href="/dashboard/mural"
            className="flex items-center gap-2 text-djon-text/40 hover:text-djon-text text-xs font-bold tracking-wide transition-colors"
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
