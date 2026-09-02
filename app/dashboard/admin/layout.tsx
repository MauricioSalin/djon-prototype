"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getDashboardHome,
  getRequiredAdminPermission,
  hasPermission,
} from "@/lib/store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const required = getRequiredAdminPermission(pathname);
  const allowed = Boolean(user && required && hasPermission(user, required));

  useEffect(() => {
    if (!allowed) {
      router.replace(user ? getDashboardHome(user) : "/login");
    }
  }, [allowed, router, user]);

  return allowed ? children : null;
}
