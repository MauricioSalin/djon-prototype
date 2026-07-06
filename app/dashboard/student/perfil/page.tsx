"use client"

import { useEffect, useState } from "react"
import { store, type User } from "@/lib/store"
import { ProfileView } from "@/components/portal/profile-view"

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(store.getCurrentUser())
  }, [])

  if (!user) return null

  return <ProfileView user={user} isOwner onUserUpdate={(u) => setUser(u)} />
}
