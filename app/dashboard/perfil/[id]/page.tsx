"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ApiError, store, type User } from "@/lib/store"
import { ProfileView } from "@/components/portal/profile-view"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"
import { PortalLoadError } from "@/components/portal/portal-load-error"

export default function PublicPerfilPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const cu = store.getCurrentUser()
    if (!cu) { router.replace("/login"); return }
    setCurrentUser(cu)
    let active = true
    setViewedUser(null)
    setLoadError(null)
    setNotFound(false)
    store.fetchUserById(id)
      .then((profile) => { if (active) setViewedUser(profile) })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 404) setNotFound(true)
        else setLoadError(error)
      })
    return () => { active = false }
  }, [id, router, loadAttempt])

  if (loadError) return <PortalLoadError error={loadError} onRetry={() => setLoadAttempt((value) => value + 1)} />
  if (notFound) return <div className="min-h-[50vh] flex items-center justify-center text-djon-text/50 font-bold">Perfil não encontrado.</div>
  if (!viewedUser || !currentUser) return <DashboardPageSkeleton variant="profile" />

  const isOwner = currentUser.id === viewedUser.id

  return (
    <div>
      {/* Back bar */}
      <div className="border-b border-djon-text/8 bg-djon-page">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-djon-text opacity-40 text-xs font-bold tracking-wide transition-opacity hover:opacity-100"
          >
            <ArrowLeft size={13} /> Voltar
          </button>
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
