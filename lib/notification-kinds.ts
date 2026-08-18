export type NotificationKind = "notification" | "update" | "request";

export const NOTIFICATION_KIND_OPTIONS: Array<{
  value: NotificationKind;
  label: string;
}> = [
  { value: "notification", label: "NOTIFICAÇÕES" },
  { value: "update", label: "ATUALIZAÇÕES" },
  { value: "request", label: "SOLICITAÇÕES" },
];

const UPDATE_TYPES = new Set([
  "event.published",
  "lead.created",
  "material.published",
]);

export function getNotificationKind(type: string): NotificationKind {
  if (type === "booking.requested") return "request";
  if (UPDATE_TYPES.has(type)) return "update";
  return "notification";
}

export function getNotificationKindLabel(type: string) {
  const kind = getNotificationKind(type);
  if (kind === "request") return "SOLICITAÇÃO";
  if (kind === "update") return "ATUALIZAÇÃO";
  return "NOTIFICAÇÃO";
}
