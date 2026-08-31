"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  Inbox,
  Search,
  Sparkles,
} from "lucide-react";
import { useConfirmation } from "@/components/confirmation-provider";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import {
  NotificationItem,
  TrainingRequestActions,
} from "@/components/notification-item";
import {
  getNotificationKind,
  NOTIFICATION_KIND_OPTIONS,
  type NotificationKind,
} from "@/lib/notification-kinds";
import {
  hasPermission,
  store,
  type Booking,
  type Notification as PortalNotification,
  type User,
} from "@/lib/store";

const tabIcons = {
  notification: Bell,
  update: Sparkles,
  request: CalendarClock,
};

const searchInputClass =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 py-3 pl-11 pr-4 text-sm text-djon-text outline-none transition-colors placeholder:text-djon-text/20 focus:border-djon-accent/45";

export default function NotificationsPage() {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [user, setUser] = useState<User | null>(() => store.getCurrentUser());
  const [notifications, setNotifications] = useState<PortalNotification[]>(() =>
    store.getNotifications(),
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    store.getBookings(),
  );
  const [activeTab, setActiveTab] = useState<NotificationKind>("notification");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const canReviewRequests = hasPermission(user, "bookings.review");

  const load = useCallback(async () => {
    const currentUser = store.getCurrentUser();
    setUser(currentUser);
    const [notificationItems, bookingItems] = await Promise.all([
      store.refreshNotifications(),
      hasPermission(currentUser, "bookings.review")
        ? store.refreshBookings()
        : Promise.resolve(store.getBookings()),
    ]);
    setNotifications(notificationItems);
    setBookings(bookingItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tabCounts = useMemo(
    () =>
      notifications.reduce<Record<NotificationKind, number>>(
        (counts, notification) => {
          counts[getNotificationKind(notification.type)] += 1;
          return counts;
        },
        { notification: 0, update: 0, request: 0 },
      ),
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return notifications.filter((notification) => {
      if (getNotificationKind(notification.type) !== activeTab) return false;
      if (!query) return true;
      return `${notification.title} ${notification.body}`
        .toLocaleLowerCase("pt-BR")
        .includes(query);
    });
  }, [activeTab, notifications, search]);

  const pagination = useListPagination(
    displayedNotifications,
    `${activeTab}:${search}`,
  );

  const markRead = async (notification: PortalNotification) => {
    if (notification.readAt) return;
    await store.markNotificationRead(notification.id);
    setNotifications(store.getNotifications());
  };

  const openNotification = async (notification: PortalNotification) => {
    await markRead(notification);
    router.push(notification.url);
  };

  const markAllRead = async () => {
    await store.markAllNotificationsRead();
    setNotifications(store.getNotifications());
  };

  const approveRequest = async (
    request: Booking,
    notification: PortalNotification,
  ) => {
    await store.updateBooking(request.id, { status: "confirmado" });
    await markRead(notification);
    setBookings(store.getBookings());
  };

  const rejectRequest = async (
    request: Booking,
    notification: PortalNotification,
  ) => {
    const confirmed = await confirm({
      title: "Recusar solicitação?",
      description: `${request.title} será recusada e o aluno será informado. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "RECUSAR",
    });
    if (!confirmed) return;
    await store.cancelBooking(request.id, {
      onChange: () => setBookings(store.getBookings()),
    });
    await markRead(notification);
    setBookings(store.getBookings());
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  if (loading) return <DashboardPageSkeleton variant="notifications" />;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-djon-accent">
            CENTRAL
          </p>
          <h1 className="text-3xl font-black tracking-tighter text-djon-text">
            Notificações
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-djon-text/40">
            Arraste uma notificação para o lado para marcá-la como lida ou toque
            nela para abrir o conteúdo relacionado.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-djon-accent/25 px-5 py-2.5 text-xs font-black tracking-wide text-djon-accent transition-colors hover:brightness-110 sm:w-auto"
          >
            <CheckCheck size={15} /> MARCAR TODAS COMO LIDAS
          </button>
        )}
      </header>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Tipos de notificação"
      >
        {NOTIFICATION_KIND_OPTIONS.map((option) => {
          const Icon = tabIcons[option.value];
          const isActive = activeTab === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(option.value)}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-black tracking-wide transition-all ${
                isActive
                  ? "border-djon-accent bg-djon-accent text-djon-ink"
                  : "border-djon-text/10 bg-djon-text/5 text-djon-text/50 hover:brightness-110"
              }`}
            >
              <Icon size={12} /> {option.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-djon-caption ${
                  isActive ? "bg-djon-ink/12" : "bg-djon-text/8"
                }`}
              >
                {tabCounts[option.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/25"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título ou conteúdo..."
          aria-label="Buscar notificações"
          className={searchInputClass}
        />
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-10 text-center">
          <Inbox size={32} className="mx-auto mb-3 text-djon-text/20" />
          <p className="text-sm font-bold text-djon-text/30">
            Nenhum item encontrado nesta aba.
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {pagination.paginatedItems.map((notification) => {
              const bookingId =
                typeof notification.metadata.bookingId === "string"
                  ? notification.metadata.bookingId
                  : "";
              const request = bookings.find(
                (booking) => booking.id === bookingId,
              );
              const isPendingRequest =
                canReviewRequests && request?.status === "pendente";

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 120 }}
                >
                  <NotificationItem
                    notification={notification}
                    onOpen={() => void openNotification(notification)}
                    onRead={() => markRead(notification)}
                    actions={
                      isPendingRequest && request ? (
                        <TrainingRequestActions
                          request={request}
                          studentName={
                            store.getUserById(request.userId)?.name ?? "Aluno"
                          }
                          onApprove={() =>
                            void approveRequest(request, notification)
                          }
                          onReject={() =>
                            void rejectRequest(request, notification)
                          }
                        />
                      ) : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <ListPagination
        totalItems={displayedNotifications.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </main>
  );
}
