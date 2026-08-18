"use client"

import { useEffect, useState } from "react"
import { store, type User } from "@/lib/store"
import { ProfileView } from "@/components/portal/profile-view"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(store.getCurrentUser())
  }, [])

  if (!user) return <DashboardPageSkeleton variant="profile" />

  return <ProfileView user={user} isOwner onUserUpdate={(u) => setUser(u)} />
}
