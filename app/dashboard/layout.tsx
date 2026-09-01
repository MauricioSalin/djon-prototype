"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CalendarPlus,
  Users,
  Newspaper,
  User,
  LogOut,
  Music2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  X,
  Calendar,
  GraduationCap,
  Search,
  BookOpen,
  Bell,
  CheckCircle,
  Building2,
  Headphones,
  Inbox,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  canReviewBookings,
  getDashboardHome,
  getRequiredAdminPermission,
  hasAllPermissions,
  hasPermission,
  store,
  SESSION_EXPIRED_EVENT,
  CURRENT_USER_UPDATED_EVENT,
  type User as StoreUser,
  type DJEvent,
  type Booking,
  type Material,
  type Notification as PortalNotification,
} from "@/lib/store";
import { useConfirmation } from "@/components/confirmation-provider";
import {
  NotificationItem,
  TrainingRequestActions,
} from "@/components/notification-item";

const studentNav = [
  { label: "Início", href: "/dashboard/student", icon: Home },
  { label: "Agenda", href: "/dashboard/student/agendar", icon: CalendarPlus },
  { label: "Meus Eventos", href: "/dashboard/student/evento", icon: Music2 },
  { label: "Mural", href: "/dashboard/mural", icon: Newspaper },
  {
    label: "Professores",
    href: "/dashboard/student/professores",
    icon: GraduationCap,
  },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Cursos", href: "/dashboard/turmas", icon: GraduationCap },
];

const adminNav = [
  { label: "Início", href: "/dashboard/admin", icon: Home },
  { label: "Alunos", href: "/dashboard/admin/alunos", icon: Users },
  {
    label: "Professores",
    href: "/dashboard/admin/professores",
    icon: GraduationCap,
  },
  { label: "Eventos", href: "/dashboard/admin/eventos", icon: Music2 },
  { label: "Mural", href: "/dashboard/mural", icon: Newspaper },
  { label: "Contatos", href: "/dashboard/admin/leads", icon: Inbox },
  { label: "Unidades", href: "/dashboard/admin/unidades", icon: Building2 },
  {
    label: "Equipamentos",
    href: "/dashboard/admin/equipamentos",
    icon: Headphones,
  },
  { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { label: "Turmas", href: "/dashboard/turmas", icon: Users },
];

const professorNav = [
  { label: "Início", href: "/dashboard/professor", icon: Home },
  { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { label: "Meus Eventos", href: "/dashboard/professor/evento", icon: Music2 },
  { label: "Mural", href: "/dashboard/mural", icon: Newspaper },
  { label: "Alunos", href: "/dashboard/professor/alunos", icon: Users },
  {
    label: "Professores",
    href: "/dashboard/professor/professores",
    icon: GraduationCap,
  },
  { label: "Material", href: "/dashboard/material", icon: BookOpen },
  { label: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { label: "Turmas", href: "/dashboard/turmas", icon: Users },
];

function getNav(user: StoreUser) {
  if (user.role === "admin" || hasAllPermissions(user)) return adminNav;
  if (user.role === "professor") {
    const managesUsers = hasPermission(user, "users.manage");
    const baseNavigation = professorNav.filter((item) => {
      if (
        managesUsers &&
        (item.href === "/dashboard/professor/alunos" ||
          item.href === "/dashboard/professor/professores")
      ) {
        return false;
      }
      return true;
    });
    const privileged = [
      hasPermission(user, "admin.access")
        ? { label: "Administração", href: "/dashboard/admin", icon: Home }
        : null,
      managesUsers
        ? { label: "Alunos", href: "/dashboard/admin/alunos", icon: Users }
        : null,
      managesUsers
        ? {
            label: "Professores",
            href: "/dashboard/admin/professores",
            icon: GraduationCap,
          }
        : null,
      hasPermission(user, "leads.manage")
        ? { label: "Contatos", href: "/dashboard/admin/leads", icon: Inbox }
        : null,
      hasPermission(user, "events.manage")
        ? {
            label: "Eventos oficiais",
            href: "/dashboard/admin/eventos",
            icon: Music2,
          }
        : null,
      hasPermission(user, "units.manage")
        ? {
            label: "Unidades",
            href: "/dashboard/admin/unidades",
            icon: Building2,
          }
        : null,
      hasPermission(user, "equipments.manage")
        ? {
            label: "Equipamentos",
            href: "/dashboard/admin/equipamentos",
            icon: Headphones,
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));
    return [...baseNavigation, ...privileged];
  }
  return studentNav;
}

function getPerfilHref(user: StoreUser) {
  if (user.role === "admin") return `/dashboard/perfil/${user.id}`;
  if (user.role === "professor") return `/dashboard/perfil/${user.id}`;
  return `/dashboard/student/perfil`;
}

type SearchResult =
  | { kind: "user"; item: StoreUser }
  | { kind: "event"; item: DJEvent }
  | { kind: "material"; item: Material };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { confirm } = useConfirmation();
  const [user, setUser] = useState<StoreUser | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [bootstrapVersion, setBootstrapVersion] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [pushState, setPushState] = useState<
    "hidden" | "available" | "enabled" | "error"
  >("hidden");
  const [desktopNavState, setDesktopNavState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [desktopNavDragging, setDesktopNavDragging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopNavDragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  });
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);

  const updateDesktopNavState = useCallback(() => {
    const navigation = desktopNavRef.current;
    if (!navigation) return;
    const maximum = Math.max(
      0,
      navigation.scrollWidth - navigation.clientWidth,
    );
    const nextState = {
      hasOverflow: maximum > 1,
      canScrollLeft: navigation.scrollLeft > 1,
      canScrollRight: navigation.scrollLeft < maximum - 1,
    };
    setDesktopNavState((current) =>
      current.hasOverflow === nextState.hasOverflow &&
      current.canScrollLeft === nextState.canScrollLeft &&
      current.canScrollRight === nextState.canScrollRight
        ? current
        : nextState,
    );
  }, []);

  const syncPendingRequests = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requests = store
      .getBookings()
      .filter(
        (b) =>
          b.type === "treino" &&
          b.status === "pendente" &&
          new Date(b.date + "T00:00:00") >= today,
      )
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime(),
      );
    setPendingRequests(requests);
  }, []);

  const loadPendingRequests = useCallback(async () => {
    try {
      await store.refreshBookings();
      syncPendingRequests();
    } catch {
      // A camada HTTP já exibiu o toast e encerra a sessão quando necessário.
    }
  }, [syncPendingRequests]);

  useEffect(() => {
    const handleSessionExpired = () => {
      store.logout();
      setUser(null);
      setPortalReady(false);
      setSessionError("Sua sessão expirou. Entre novamente.");
      router.replace("/login");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [router]);

  useEffect(() => {
    const syncCurrentUser = () => setUser(store.getCurrentUser());
    window.addEventListener(CURRENT_USER_UPDATED_EVENT, syncCurrentUser);
    return () =>
      window.removeEventListener(CURRENT_USER_UPDATED_EVENT, syncCurrentUser);
  }, []);

  useEffect(() => {
    let active = true;
    setSessionError("");
    store
      .bootstrap(true)
      .then((authenticatedUser) => {
        if (!active) return;
        if (!authenticatedUser) {
          router.replace("/login");
          return;
        }
        setUser(authenticatedUser);
        setPortalReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setPortalReady(false);
        setSessionError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o portal.",
        );
      });
    return () => {
      active = false;
    };
  }, [bootstrapVersion, router]);

  useEffect(() => {
    let active = true;
    const refreshPermissions = () => {
      void store
        .restoreSession(true)
        .then((authenticatedUser) => {
          if (active && authenticatedUser) setUser(authenticatedUser);
        })
        .catch(() => undefined);
    };
    window.addEventListener("focus", refreshPermissions);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshPermissions);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const requiredProfilePath = getPerfilHref(user);
    if (user.passwordChangeRequired && pathname !== requiredProfilePath) {
      router.replace(`${requiredProfilePath}?changePassword=required`);
      return;
    }
    const delegatedPermission = getRequiredAdminPermission(pathname);
    if (
      pathname.startsWith("/dashboard/admin") &&
      user.role !== "admin" &&
      (!delegatedPermission || !hasPermission(user, delegatedPermission))
    ) {
      router.replace(
        getDashboardHome(user),
      );
    } else if (
      pathname.startsWith("/dashboard/professor") &&
      user.role !== "professor"
    ) {
      router.replace(
        getDashboardHome(user),
      );
    } else if (
      pathname.startsWith("/dashboard/student") &&
      user.role !== "student"
    ) {
      router.replace(
        getDashboardHome(user),
      );
    } else if (pathname === "/dashboard/agenda" && user.role === "student") {
      router.replace("/dashboard/student/agendar");
    }
  }, [pathname, router, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) {
        setMobileMenuOpen(false);
      }
    };

    closeOnDesktop();
    media.addEventListener("change", closeOnDesktop);

    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const navigation = desktopNavRef.current;
    const activeItem = navigation?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!navigation || !activeItem) return;

    const itemStart = activeItem.offsetLeft;
    const itemEnd = itemStart + activeItem.offsetWidth;
    const visibleStart = navigation.scrollLeft;
    const visibleEnd = visibleStart + navigation.clientWidth;
    if (itemStart < visibleStart || itemEnd > visibleEnd) {
      navigation.scrollTo({
        left: Math.max(
          0,
          itemStart - (navigation.clientWidth - activeItem.offsetWidth) / 2,
        ),
        behavior: "smooth",
      });
    }
    window.requestAnimationFrame(updateDesktopNavState);
  }, [pathname, updateDesktopNavState, user]);

  useEffect(() => {
    const navigation = desktopNavRef.current;
    if (!navigation || !user) return;

    const update = () => updateDesktopNavState();
    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(navigation);
    navigation.addEventListener("scroll", update, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      navigation.removeEventListener("scroll", update);
    };
  }, [updateDesktopNavState, user]);

  useEffect(() => {
    if (!user || user.role === "student") return;
    syncPendingRequests();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadPendingRequests();
    };
    void loadPendingRequests();
    const interval = window.setInterval(refreshWhenVisible, 15000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [user, loadPendingRequests, syncPendingRequests]);

  useEffect(() => {
    if (!user) return;
    setNotifications(store.getNotifications());
    const load = () =>
      store
        .refreshNotifications()
        .then(setNotifications)
        .catch(() => undefined);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    const interval = window.setInterval(refreshWhenVisible, 30000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [user]);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
    if (
      !user ||
      !publicKey ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;
    setPushState(
      Notification.permission === "granted" ? "enabled" : "available",
    );
  }, [user]);

  // Close search bar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchBarOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setMobileMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const openSearch = useCallback(() => {
    setNotificationsOpen(false);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setSearchBarOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchBarOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  useEffect(() => {
    if (!searchBarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        searchButtonRef.current?.contains(target) ||
        searchPanelRef.current?.contains(target)
      ) {
        return;
      }
      closeSearch();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeSearch, searchBarOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((v) => {
      const next = !v;
      if (next) {
        closeSearch();
        setNotificationsOpen(false);
        setDropdownOpen(false);
      }
      return next;
    });
  }, [closeSearch]);

  const scrollDesktopNavigation = useCallback((event: WheelEvent) => {
    const navigation = desktopNavRef.current;
    if (!navigation) return;
    if (navigation.scrollWidth <= navigation.clientWidth) return;

    const rawDelta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    if (!rawDelta) return;
    const multiplier =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? navigation.clientWidth
          : 1;
    const maximum = navigation.scrollWidth - navigation.clientWidth;
    const nextPosition = Math.min(
      maximum,
      Math.max(0, navigation.scrollLeft + rawDelta * multiplier),
    );
    event.preventDefault();
    event.stopPropagation();
    navigation.scrollLeft = nextPosition;
  }, []);

  const moveDesktopNavigation = useCallback((direction: -1 | 1) => {
    const navigation = desktopNavRef.current;
    if (!navigation) return;
    navigation.scrollBy({
      left: direction * Math.max(240, navigation.clientWidth * 0.65),
      behavior: "smooth",
    });
  }, []);

  const startDesktopNavDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const navigation = desktopNavRef.current;
      if (
        !navigation ||
        event.button !== 0 ||
        navigation.scrollWidth <= navigation.clientWidth
      )
        return;

      desktopNavDragRef.current = {
        active: true,
        moved: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: navigation.scrollLeft,
      };
    },
    [],
  );

  const dragDesktopNavigation = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const navigation = desktopNavRef.current;
      const drag = desktopNavDragRef.current;
      if (!navigation || !drag.active || drag.pointerId !== event.pointerId)
        return;

      const delta = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(delta) <= 8) return;
      if (!drag.moved) {
        drag.moved = true;
        navigation.setPointerCapture(event.pointerId);
        setDesktopNavDragging(true);
      }
      navigation.scrollLeft = drag.startScrollLeft - delta;
      event.preventDefault();
    },
    [],
  );

  const stopDesktopNavDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const navigation = desktopNavRef.current;
      const drag = desktopNavDragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      drag.active = false;
      if (navigation?.hasPointerCapture(event.pointerId)) {
        navigation.releasePointerCapture(event.pointerId);
      }
      setDesktopNavDragging(false);
      window.setTimeout(() => {
        desktopNavDragRef.current.moved = false;
      }, 0);
    },
    [],
  );

  const preventClickAfterDesktopNavDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!desktopNavDragRef.current.moved) return;
      event.preventDefault();
      event.stopPropagation();
      desktopNavDragRef.current.moved = false;
    },
    [],
  );

  useEffect(() => {
    const navigation = desktopNavRef.current;
    if (!navigation || !user) return;
    navigation.addEventListener("wheel", scrollDesktopNavigation, {
      passive: false,
    });
    return () =>
      navigation.removeEventListener("wheel", scrollDesktopNavigation);
  }, [scrollDesktopNavigation, user]);

  const runSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = window.setTimeout(() => {
      void store
        .search(q)
        .then((result) => {
          if (q !== searchInputRef.current?.value) return;
          setSearchResults([
            ...result.users.map((item) => ({ kind: "user" as const, item })),
            ...result.events.map((item) => ({ kind: "event" as const, item })),
            ...result.materials.map((item) => ({
              kind: "material" as const,
              item,
            })),
          ]);
        })
        .catch(() => setSearchResults([]));
    }, 250);
  }, []);

  if (!user || !portalReady) {
    if (!sessionError) return <div className="min-h-svh bg-djon-page" />;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-djon-page px-4 text-center">
        <p className="max-w-md text-sm font-bold text-djon-text/50">
          {sessionError}
        </p>
        <button
          type="button"
          onClick={() => setBootstrapVersion((version) => version + 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink transition-opacity hover:opacity-80"
        >
          <RefreshCw size={14} />
          TENTAR NOVAMENTE
        </button>
      </div>
    );
  }

  const nav = getNav(user);
  const portalHomeHref = nav[0].href;
  const perfilHref = getPerfilHref(user);

  const handleLogout = () => {
    store.logout();
    router.push("/");
  };

  const handleReadNotification = async (notification: PortalNotification) => {
    if (notification.readAt) return;
    await store.markNotificationRead(notification.id);
    setNotifications(store.getNotifications());
  };

  const handleApproveRequest = async (
    id: string,
    notification?: PortalNotification,
  ) => {
    await store.updateBooking(id, { status: "confirmado" });
    if (notification) await handleReadNotification(notification);
    await loadPendingRequests();
  };

  const handleRejectRequest = async (
    id: string,
    notification?: PortalNotification,
  ) => {
    const request = pendingRequests.find((booking) => booking.id === id);
    if (!request) return;
    const confirmed = await confirm({
      title: "Recusar solicitação?",
      description: `${request.title} será recusada, permanecerá na agenda para histórico e o aluno será informado.`,
      confirmLabel: "RECUSAR",
    });
    if (confirmed) {
      await store.updateBooking(id, { status: "recusado" });
      syncPendingRequests();
      if (notification) await handleReadNotification(notification);
    }
  };

  const handleNotification = async (notification: PortalNotification) => {
    await handleReadNotification(notification);
    setNotificationsOpen(false);
    router.push(notification.url);
  };

  const enablePush = async () => {
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
    if (!publicKey) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("error");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const raw = atob(
        (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/"),
      );
      const key = Uint8Array.from(
        [...raw].map((character) => character.charCodeAt(0)),
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      await store.subscribePush(subscription.toJSON());
      setPushState("enabled");
    } catch {
      setPushState("error");
    }
  };

  const roleLabel =
    user.role === "admin"
      ? "Admin"
      : user.role === "professor"
        ? "Professor"
        : "Aluno";
  const canReviewRequests = canReviewBookings(user);
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const totalNotifications = unreadNotifications.length;

  return (
    <div className="min-h-screen bg-djon-page">
      <header className="fixed top-0 left-0 right-0 z-50 bg-djon-page/95 backdrop-blur-xl border-b border-djon-text/8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Logo */}
          <Link
            href={portalHomeHref}
            className="flex min-h-11 shrink-0 items-center gap-2 transition-opacity hover:opacity-70 sm:mr-2"
          >
            <Image
              src="/images/djon-verde.png"
              alt="DJ ON Academy"
              width={111}
              height={28}
              priority
              className="h-5 w-auto min-[360px]:h-6 sm:h-7"
            />
            <span className="text-djon-caption text-djon-accent font-black tracking-[0.2em] uppercase hidden sm:block">
              Portal
            </span>
          </Link>

          <button
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-djon-text opacity-60 transition-opacity hover:opacity-100 md:hidden"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop nav */}
          <div className="relative hidden min-w-0 flex-1 items-center gap-2 md:flex">
            {desktopNavState.hasOverflow && (
              <button
                type="button"
                onClick={() => moveDesktopNavigation(-1)}
                disabled={!desktopNavState.canScrollLeft}
                aria-label="Ver itens anteriores do menu"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-djon-text/5 text-djon-accent transition-colors hover:brightness-110 disabled:cursor-default disabled:bg-transparent disabled:text-djon-text/15 disabled:hover:brightness-110"
              >
                <ChevronLeft size={15} />
              </button>
            )}

            <nav
              ref={desktopNavRef}
              className={`djon-header-scroll hidden min-w-0 flex-1 select-none items-center gap-1 overflow-x-auto overscroll-x-contain px-2 touch-pan-y md:flex ${
                desktopNavDragging ? "cursor-grabbing" : "cursor-default"
              }`}
              data-lenis-prevent-wheel="true"
              onPointerDown={startDesktopNavDrag}
              onPointerMove={dragDesktopNavigation}
              onPointerUp={stopDesktopNavDrag}
              onPointerCancel={stopDesktopNavDrag}
              onClickCapture={preventClickAfterDesktopNavDrag}
              onDragStart={(event) => event.preventDefault()}
            >
              {nav.map((item) => {
                const isHome = item.label === "Início";
                const active = isHome
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    draggable={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-center rounded-full text-xs font-bold tracking-wide transition-all ${
                      active
                        ? "bg-djon-accent text-djon-ink"
                        : "text-djon-text opacity-50 hover:opacity-100"
                    }`}
                  >
                    <item.icon size={13} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {desktopNavState.hasOverflow && (
              <button
                type="button"
                onClick={() => moveDesktopNavigation(1)}
                disabled={!desktopNavState.canScrollRight}
                aria-label="Ver próximos itens do menu"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-djon-text/5 text-djon-accent transition-colors hover:brightness-110 disabled:cursor-default disabled:bg-transparent disabled:text-djon-text/15 disabled:hover:brightness-110"
              >
                <ChevronRight size={15} />
              </button>
            )}
          </div>

          {/* Search icon + avatar */}
          <div className="relative ml-auto flex shrink-0 items-center gap-2">
            {
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDropdownOpen(false);
                    setNotificationsOpen((open) => {
                      const next = !open;
                      if (next) closeSearch();
                      return next;
                    });
                    void store
                      .refreshNotifications()
                      .then(setNotifications)
                      .catch(() => undefined);
                    if (canReviewRequests) void loadPendingRequests();
                  }}
                  className="relative flex size-11 cursor-pointer items-center justify-center rounded-full text-djon-text transition-all hover:opacity-40"
                  aria-label="Notificações"
                >
                  <Bell size={16} />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-djon-accent text-djon-ink text-djon-caption font-black flex items-center justify-center">
                      {totalNotifications}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      className="absolute right-0 top-[calc(100%+18px)] z-50 w-[min(360px,calc(100vw-1rem))] rounded-2xl overflow-hidden border border-djon-text/10 bg-djon-calendar-cell/95 backdrop-blur-xl shadow-2xl max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.5rem] max-sm:w-auto"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between border-b border-djon-text/8 px-4 py-3">
                        <div>
                          <p className="text-djon-text text-sm font-black">
                            Notificações
                          </p>
                          <p className="text-djon-text/30 text-djon-meta font-bold">
                            {totalNotifications === 0
                              ? "Tudo em dia"
                              : `${totalNotifications} ${totalNotifications === 1 ? "item pendente" : "itens pendentes"}`}
                          </p>
                        </div>
                        {totalNotifications > 0 && (
                          <button
                            onClick={() =>
                              void store
                                .markAllNotificationsRead()
                                .then(() =>
                                  setNotifications(store.getNotifications()),
                                )
                                .catch(() => undefined)
                            }
                            className="cursor-pointer text-djon-accent text-djon-label font-black transition-[filter] hover:brightness-110"
                          >
                            LER TODAS
                          </button>
                        )}
                      </div>
                      {pushState !== "hidden" && pushState !== "enabled" && (
                        <button
                          onClick={() => void enablePush()}
                          className="mx-3 mt-3 w-[calc(100%-1.5rem)] rounded-xl border border-djon-accent/20 bg-djon-accent/5 px-3 py-2 text-xs font-black text-djon-accent transition-[filter] hover:brightness-110"
                        >
                          {pushState === "error"
                            ? "TENTAR ATIVAR ALERTAS NOVAMENTE"
                            : "ATIVAR ALERTAS NESTE DISPOSITIVO"}
                        </button>
                      )}
                      {totalNotifications === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <CheckCircle
                            size={24}
                            className="mx-auto mb-2 text-djon-accent/60"
                          />
                          <p className="text-xs font-bold text-djon-text/30">
                            Nenhuma notificação.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="djon-scroll max-h-[480px] space-y-1.5 overflow-y-auto overscroll-contain p-2 pr-1.5"
                          data-lenis-prevent="true"
                          data-lenis-prevent-wheel="true"
                          data-lenis-prevent-touch="true"
                          onWheel={(event) => event.stopPropagation()}
                          onTouchMove={(event) => event.stopPropagation()}
                        >
                          <AnimatePresence initial={false} mode="popLayout">
                            {unreadNotifications.map((notification) => {
                              const bookingId =
                                typeof notification.metadata.bookingId ===
                                "string"
                                  ? notification.metadata.bookingId
                                  : "";
                              const request = pendingRequests.find(
                                (booking) => booking.id === bookingId,
                              );

                              return (
                                <motion.div
                                  key={notification.id}
                                  layout
                                  exit={{
                                    opacity: 0,
                                    x: 120,
                                    height: 0,
                                    marginBottom: 0,
                                  }}
                                >
                                  <NotificationItem
                                    compact
                                    dismissOnRead
                                    notification={notification}
                                    onOpen={() =>
                                      void handleNotification(
                                        notification,
                                      ).catch(() => undefined)
                                    }
                                    onRead={() =>
                                      handleReadNotification(notification)
                                    }
                                    actions={
                                      canReviewRequests && request ? (
                                        <TrainingRequestActions
                                          request={request}
                                          studentName={
                                            store.getUserById(request.userId)
                                              ?.name ??
                                            request.studentName ??
                                            "Aluno"
                                          }
                                          onApprove={() =>
                                            void handleApproveRequest(
                                              request.id,
                                              notification,
                                            ).catch(() => undefined)
                                          }
                                          onReject={() =>
                                            void handleRejectRequest(
                                              request.id,
                                              notification,
                                            ).catch(() => undefined)
                                          }
                                        />
                                      ) : undefined
                                    }
                                  />
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      )}
                      <div className="border-t border-djon-text/8 p-2">
                        <Link
                          href="/dashboard/notificacoes"
                          onClick={() => setNotificationsOpen(false)}
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-djon-label font-black tracking-widest text-djon-accent transition-colors hover:brightness-110"
                        >
                          VER TODAS <ArrowRight size={13} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            }

            <button
              ref={searchButtonRef}
              onClick={searchBarOpen ? closeSearch : openSearch}
              className={`flex size-11 cursor-pointer items-center justify-center rounded-full transition-all ${searchBarOpen ? "bg-djon-accent text-djon-ink" : "text-djon-text opacity-40 hover:opacity-100"}`}
              aria-label="Buscar"
            >
              {searchBarOpen ? <X size={16} /> : <Search size={16} />}
            </button>

            {/* Search dropdown panel — anchored to right side */}
            <AnimatePresence>
              {searchBarOpen && (
                <motion.div
                  ref={searchPanelRef}
                  className="absolute right-0 top-[calc(100%+18px)] z-50 w-[min(480px,calc(100vw-1rem))] rounded-2xl overflow-hidden max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.5rem] max-sm:w-auto"
                  style={{
                    background: "rgb(0 0 0 / 0.85)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="px-3 py-3">
                    {/* Input pill */}
                    <div className="flex items-center gap-3 bg-djon-surface-3 rounded-full px-4 py-2.5">
                      <Search
                        size={14}
                        className="text-djon-text/30 shrink-0"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => runSearch(e.target.value)}
                        placeholder="Buscar alunos, professores, eventos..."
                        className="bg-transparent text-djon-text text-sm font-medium placeholder:text-djon-text/25 outline-none flex-1"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                            searchInputRef.current?.focus();
                          }}
                          className="cursor-pointer text-djon-text/25 hover:brightness-110 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        className="djon-scroll max-h-[360px] overflow-y-auto overscroll-contain px-2 pb-2 pr-1.5 flex flex-col"
                        data-lenis-prevent="true"
                        data-lenis-prevent-wheel="true"
                        data-lenis-prevent-touch="true"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        {searchResults.map((r, i) => {
                          if (r.kind === "user") {
                            const u = r.item;
                            const rLabel =
                              u.role === "admin"
                                ? "Admin"
                                : u.role === "professor"
                                  ? "Professor"
                                  : "Aluno";
                            const href = `/dashboard/perfil/${u.id}`;
                            return (
                              <Link
                                key={i}
                                href={href}
                                onClick={closeSearch}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:brightness-110 transition-colors"
                              >
                                <div className="djon-avatar-fallback w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                  {u.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={u.avatar}
                                      alt={u.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-djon-accent text-djon-meta font-black">
                                      {u.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-djon-text text-xs font-bold truncate">
                                    {u.name}
                                  </p>
                                  <p className="text-djon-text/30 text-djon-label tracking-widest uppercase">
                                    {rLabel}
                                  </p>
                                </div>
                              </Link>
                            );
                          }
                          if (r.kind === "material") {
                            return (
                              <Link
                                key={i}
                                href={`/dashboard/material/${r.item.id}`}
                                onClick={closeSearch}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:brightness-110 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-djon-accent/10 flex items-center justify-center shrink-0">
                                  <BookOpen
                                    size={12}
                                    className="text-djon-accent"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-djon-text text-xs font-bold truncate">
                                    {r.item.title}
                                  </p>
                                  <p className="text-djon-text/30 text-djon-label truncate">
                                    {r.item.category}
                                  </p>
                                </div>
                              </Link>
                            );
                          }
                          const ev = r.item;
                          return (
                            <Link
                              key={i}
                              href="/dashboard/mural"
                              onClick={closeSearch}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:brightness-110 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-djon-text/8 flex items-center justify-center shrink-0">
                                <Music2
                                  size={12}
                                  className="text-djon-text/40"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-djon-text text-xs font-bold truncate">
                                  {ev.title}
                                </p>
                                <p className="text-djon-text/30 text-djon-label truncate">
                                  {ev.location}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                    {searchQuery.trim().length >= 2 &&
                      searchResults.length === 0 && (
                        <motion.p
                          className="px-4 pb-4 text-djon-text/20 text-xs text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Nenhum resultado para &quot;{searchQuery}&quot;
                        </motion.p>
                      )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => {
                    closeSearch();
                    setNotificationsOpen(false);
                    setMobileMenuOpen(false);
                    setDropdownOpen((v) => !v);
                  }}
                  className="flex size-11 cursor-pointer items-center justify-center gap-0 rounded-full border border-djon-text/10 bg-djon-text/6 p-0 transition-all hover:brightness-110 min-[360px]:h-auto min-[360px]:min-h-11 min-[360px]:w-auto min-[360px]:gap-2 min-[360px]:py-1.5 min-[360px]:pl-1.5 min-[360px]:pr-2 sm:gap-2.5 sm:pr-3"
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="djon-avatar-fallback w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-djon-accent text-xs font-black">
                        {user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-djon-text text-xs font-bold leading-tight truncate max-w-[120px]">
                      {user.name.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="text-djon-accent text-djon-caption font-black tracking-widest uppercase leading-tight">
                      {roleLabel}
                    </p>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`hidden text-djon-text/40 transition-transform min-[360px]:block ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-[min(13rem,calc(100vw-1rem))] bg-djon-surface border border-djon-text/12 rounded-2xl py-2 shadow-2xl overflow-hidden"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-3 border-b border-djon-text/8 mb-1">
                        <p className="text-djon-text text-sm font-black truncate">
                          {user.name}
                        </p>
                        <p className="text-djon-text/40 text-xs truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-djon-text opacity-60 text-xs font-bold tracking-wide transition-opacity hover:opacity-100"
                      >
                        <ExternalLink size={13} />
                        Acessar site
                      </Link>
                      <Link
                        href={perfilHref}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-djon-text opacity-60 text-xs font-bold tracking-wide transition-opacity hover:opacity-100"
                      >
                        <User size={13} />
                        Meu perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-djon-warning-red opacity-70 text-xs font-bold tracking-wide transition-opacity hover:opacity-100"
                      >
                        <LogOut size={13} />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="fixed inset-x-0 bottom-0 top-16 z-40 bg-djon-mobile-overlay md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.nav
                className="djon-scroll max-h-full overflow-y-auto border-t border-djon-text/8 bg-djon-page px-3 py-5 pb-10 sm:px-4"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                data-lenis-prevent
                data-lenis-prevent-wheel
                data-lenis-prevent-touch
              >
                <div className="flex flex-col gap-1">
                  {nav.map((item) => {
                    const isHome = item.label === "Início";
                    const active = isHome
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                          active
                            ? "bg-djon-accent text-djon-ink"
                            : "text-djon-text opacity-50 hover:opacity-100"
                        }`}
                      >
                        <item.icon size={14} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16 overflow-x-hidden">
        {user.passwordChangeRequired && (
          <div className="border-b border-djon-accent/20 bg-djon-accent/10 px-4 py-3">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-djon-text/70 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <strong className="text-djon-accent">
                  Senha temporária em uso.
                </strong>{" "}
                Crie uma senha pessoal antes de continuar usando o portal.
              </span>
              <Link
                href={`${perfilHref}?changePassword=required`}
                className="font-black text-djon-accent underline underline-offset-4"
              >
                ALTERAR SENHA
              </Link>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
