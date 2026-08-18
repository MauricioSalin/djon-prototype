"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { store } from "@/lib/store"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    store.bootstrap().then((user) => {
      if (user?.role === "admin") setAllowed(true)
      else if (user) router.replace(user.role === "professor" ? "/dashboard/professor" : "/dashboard/student")
      else router.replace("/login")
    }).catch(() => router.replace("/login"))
  }, [router])

  if (!allowed) return <DashboardPageSkeleton />
  return children
}
