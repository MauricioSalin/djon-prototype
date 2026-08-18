"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, type PanInfo } from "framer-motion";
import {
  CalendarDays,
  Check,
  Clock3,
  Headphones,
  UserRound,
} from "lucide-react";
import {
  getNotificationKind,
  getNotificationKindLabel,
} from "@/lib/notification-kinds";
import type { Notification as PortalNotification } from "@/lib/store";
import type { Booking } from "@/lib/store";

type NotificationItemProps = {
  notification: PortalNotification;
  onOpen: () => void;
  onRead: () => void | Promise<void>;
  actions?: ReactNode;
  compact?: boolean;
  dismissOnRead?: boolean;
};

type TrainingRequestActionsProps = {
  request: Booking;
  studentName: string;
  onApprove: () => void;
  onReject: () => void;
};

const kindClasses = {
  notification: "bg-djon-info/10 text-djon-info",
  update: "bg-djon-accent/10 text-djon-accent",
  request: "bg-djon-warning/10 text-djon-warning",
};

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationItem({
  notification,
  onOpen,
  onRead,
  actions,
  compact = false,
  dismissOnRead = false,
}: NotificationItemProps) {
  const dragged = useRef(false);
  const [reading, setReading] = useState(false);
  const [dismissDirection, setDismissDirection] = useState(1);
  const kind = getNotificationKind(notification.type);
  const isUnread = !notification.readAt;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const shouldRead =
      isUnread &&
      (Math.abs(info.offset.x) >= 72 || Math.abs(info.velocity.x) >= 650);
    if (shouldRead) {
      setDismissDirection(info.offset.x < 0 ? -1 : 1);
      setReading(true);
      void Promise.resolve(onRead()).catch(() => setReading(false));
      if (!dismissOnRead) {
        window.setTimeout(() => setReading(false), 320);
      }
    }
    window.setTimeout(() => {
      dragged.current = false;
    }, 0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {isUnread && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-between bg-djon-accent/12 px-4 text-djon-label font-black tracking-widest text-djon-accent"
        >
          <span className="flex items-center gap-1.5">
            <Check size={14} /> LER
          </span>
          <span className="flex items-center gap-1.5">
            LER <Check size={14} />
          </span>
        </div>
      )}

      <motion.article
        layout
        drag={isUnread && !reading ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.32}
        dragSnapToOrigin
        animate={
          reading
            ? { x: dismissDirection * 420, opacity: 0 }
            : { x: 0, opacity: 1 }
        }
        transition={{ duration: 0.24, ease: "easeOut" }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={handleDragEnd}
        className={`relative border bg-djon-surface-2 ${
          compact ? "rounded-xl px-3 py-3" : "rounded-2xl px-4 py-4"
        } ${
          isUnread
            ? "border-djon-accent/15"
            : "border-djon-text/8 text-djon-text/50"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!dragged.current) onOpen();
          }}
          className="block w-full cursor-pointer text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`rounded-full px-2 py-1 text-djon-caption font-black tracking-widest ${kindClasses[kind]}`}
            >
              {getNotificationKindLabel(notification.type)}
            </span>
            <time className="flex shrink-0 items-center gap-1 text-djon-caption font-bold text-djon-text/25">
              <Clock3 size={10} />
              {formatNotificationDate(notification.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-xs font-black text-djon-text">
            {notification.title}
          </p>
          <p className="mt-1 text-djon-meta leading-relaxed text-djon-text/45">
            {notification.body}
          </p>
        </button>

        {actions && (
          <div className="mt-3 border-t border-djon-text/8 pt-3">{actions}</div>
        )}
      </motion.article>
    </div>
  );
}

export function TrainingRequestActions({
  request,
  studentName,
  onApprove,
  onReject,
}: TrainingRequestActionsProps) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-djon-label font-bold text-djon-text/35">
        <span className="flex items-center gap-1">
          <UserRound size={10} /> {studentName}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays size={10} />
          {new Date(`${request.date}T00:00:00`).toLocaleDateString("pt-BR")}
        </span>
        <span className="flex items-center gap-1">
          <Clock3 size={10} /> {request.time} · {request.durationMinutes / 60}h
        </span>
        {request.equipmentName && (
          <span className="flex items-center gap-1">
            <Headphones size={10} /> {request.equipmentName}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="cursor-pointer flex-1 rounded-lg bg-djon-accent py-2 text-djon-label font-black tracking-widest text-djon-ink"
        >
          APROVAR
        </button>
        <button
          type="button"
          onClick={onReject}
          className="cursor-pointer flex-1 rounded-lg border border-djon-danger/20 py-2 text-center text-djon-label font-black tracking-widest text-djon-danger/70 transition-colors hover:bg-djon-danger/10 hover:text-djon-danger"
        >
          RECUSAR
        </button>
      </div>
    </div>
  );
}
