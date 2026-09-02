"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { ProfileView } from "@/components/portal/profile-view"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

export default function PerfilPage() {
  const user = useCurrentUser()

  if (!user) return <DashboardPageSkeleton variant="profile" />

  return <ProfileView user={user} isOwner />
}
