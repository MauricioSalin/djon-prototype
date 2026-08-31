"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasPermission, store } from "@/lib/store";
import type { Permission } from "@/lib/store";
import { DashboardRouteSkeleton } from "@/components/loading-skeletons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    setAllowed(false);
    store
      .restoreSession(true)
      .then((user) => {
        if (!active) return;
        const permissionByPath: Record<string, Permission> = {
          "/dashboard/admin/alunos": "users.manage",
          "/dashboard/admin/professores": "users.manage",
          "/dashboard/admin/leads": "leads.manage",
          "/dashboard/admin/unidades": "units.manage",
          "/dashboard/admin/equipamentos": "equipments.manage",
          "/dashboard/admin/agendar": "bookings.manage",
          "/dashboard/admin/auditoria": "audit.read",
        };
        const required = Object.entries(permissionByPath).find(([prefix]) =>
          pathname.startsWith(prefix),
        )?.[1];
        if (
          user?.role === "admin" ||
          (required && hasPermission(user, required))
        )
          setAllowed(true);
        else if (user)
          router.replace(
            user.role === "professor"
              ? "/dashboard/professor"
              : "/dashboard/student",
          );
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!allowed) return <DashboardRouteSkeleton />;
  return children;
}
