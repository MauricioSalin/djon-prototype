"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Check, Clock, Edit2, Headphones, MapPin, Save, Trash2, User as UserIcon, X } from "lucide-react";
import { BookingDateTimeFields } from "@/components/booking-date-time-fields";
import { useConfirmation } from "@/components/confirmation-provider";
import { DjonSelect } from "@/components/djon-select";
import { store, type Booking, type Equipment, type Unit, type User } from "@/lib/store";

const STATUS_META: Record<string, { dot: string; badge: string; label: string }> = {
  confirmado: { dot: "bg-djon-success", badge: "bg-djon-success/10 border-djon-success/20 text-djon-success", label: "Confirmado" },
  pendente: { dot: "bg-djon-light-purple", badge: "bg-djon-light-purple/10 border-djon-light-purple/20 text-djon-light-purple", label: "Pendente" },
  cancelado: { dot: "bg-djon-warning-red", badge: "bg-djon-warning-red/10 border-djon-warning-red/20 text-djon-warning-red", label: "Cancelado" },
};

interface DropdownOption { value: string; label: string; dot?: string }

export interface BookingWithUser extends Booking { student: User | null }

function bookingStudentName(booking: BookingWithUser) {
  return booking.student?.name ?? booking.studentName ?? "Aluno";
}
function isoToDate(date: string) { return new Date(date + "T00:00:00"); }

const inp = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/60 transition-all";
export function BookingDetailsDialog({
  bk,
  canEdit,
  units,
  professors,
  equipments,
  onClose,
  onSaved,
  onRemoved,
}: {
  bk: BookingWithUser;
  canEdit: boolean;
  units: Unit[];
  professors: User[];
  equipments: Equipment[];
  onClose: () => void;
  onSaved: (updated: BookingWithUser) => void;
  onRemoved: () => void;
}) {
  const { confirm } = useConfirmation();
  const mountedRef = useRef(true);
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState<"accept" | "reject" | null>(
    null,
  );
  const [form, setForm] = useState({
    title: bk.title,
    date: bk.date,
    time: bk.time,
    type: bk.type as "aula" | "treino",
    status: bk.status as Booking["status"],
    notes: bk.notes ?? "",
    unitId: bk.unitId ?? "",
    professorId: bk.professorId ?? "",
    equipmentId: bk.equipmentId ?? "",
    durationMinutes: bk.durationMinutes,
  });

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const m = STATUS_META[form.status];

  const dateLabel = isoToDate(bk.date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleSave = async () => {
    if (bk.status !== "cancelado" && form.status === "cancelado") {
      const confirmed = await confirm({
        title: "Cancelar agendamento?",
        description: `${form.title} será cancelado e o horário será liberado. Você poderá desfazer pelo aviso exibido em seguida.`,
        confirmLabel: "CANCELAR AGENDAMENTO",
      });
      if (!confirmed) return;
      await store.updateBooking(
        bk.id,
        { ...form, status: bk.status },
        { silent: true },
      );
      await store.cancelBooking(bk.id, {
        onChange: () => {
          const current = store
            .getBookings()
            .find((booking) => booking.id === bk.id);
          if (current) onSaved({ ...current, student: bk.student });
        },
      });
    } else {
      const saved = await store.updateBooking(bk.id, form);
      onSaved({ ...saved, student: bk.student });
    }
    setEditing(false);
  };

  const handleRemove = async () => {
    const confirmed = await confirm({
      title: "Remover agendamento?",
      description: `${bk.title} será removido da agenda. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "REMOVER",
      confirmVariant: "outline",
    });
    if (!confirmed) return;

    await store.deleteBooking(bk.id, { onChange: onRemoved });
    onClose();
  };

  const syncReviewedBooking = (booking: Booking) => {
    if (!mountedRef.current) return;
    setForm((current) => ({ ...current, status: booking.status }));
    onSaved({ ...booking, student: bk.student });
  };

  const handleAccept = async () => {
    if (reviewing) return;
    setReviewing("accept");
    try {
      const accepted = await store.updateBooking(bk.id, {
        status: "confirmado",
      });
      syncReviewedBooking(accepted);
    } catch {
      // A camada da API já apresenta o erro em um toast compreensível.
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async () => {
    if (reviewing) return;
    const confirmed = await confirm({
      title: "Recusar solicitação?",
      description: `${bk.title} será recusada e o aluno será informado. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "RECUSAR",
    });
    if (!confirmed) return;

    setReviewing("reject");
    try {
      const rejected = await store.cancelBooking(bk.id, {
        onChange: () => {
          onRemoved();
          const current = store
            .getBookings()
            .find((booking) => booking.id === bk.id);
          if (current) syncReviewedBooking(current);
        },
      });
      syncReviewedBooking(rejected);
    } catch {
      // A camada da API já apresenta o erro em um toast compreensível.
    } finally {
      setReviewing(null);
    }
  };

  const statusOptions: DropdownOption[] = [
    { value: "confirmado", label: "Confirmado", dot: "bg-djon-success" },
    ...(bk.status === "pendente"
      ? [{ value: "pendente", label: "Pendente", dot: "bg-djon-light-purple" }]
      : []),
    { value: "cancelado", label: "Cancelado", dot: "bg-djon-warning-red" },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/60 p-4 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-djon-text/12 bg-djon-surface p-5 shadow-2xl sm:my-6 sm:p-6"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-djon-label font-black tracking-widest border ${m.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label.toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                aria-label="Editar agendamento"
                className="cursor-pointer p-1 text-djon-text opacity-30 transition-opacity hover:opacity-100"
              >
                <Edit2 size={14} />
              </button>
            )}
            {canEdit && !editing && (
              <button
                onClick={() => void handleRemove()}
                aria-label="Remover agendamento"
                className="cursor-pointer p-1 text-djon-text opacity-30 transition-opacity hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Fechar detalhes"
              className="cursor-pointer text-djon-text opacity-30 transition-opacity hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!editing ? (
          /* ── Read mode ── */
          <div>
            <h3 className="text-djon-text text-xl font-black tracking-tight mb-1">
              {bk.title}
            </h3>
            <p className="text-djon-text/40 text-xs font-bold mb-5 uppercase tracking-widest">
              {bk.type === "aula" ? "Aula" : "Treino"} — {bk.time}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                <Calendar size={14} className="shrink-0" />
                <span className="capitalize">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                <Clock size={14} className="shrink-0" />
                {bk.time} · {bk.durationMinutes / 60}{" "}
                {bk.durationMinutes === 60 ? "hora" : "horas"}
              </div>
              {bk.unitLabel && (
                <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                  <MapPin size={14} className="shrink-0" />
                  {bk.unitLabel}
                </div>
              )}
              {bk.professorName && (
                <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                  <UserIcon size={14} className="shrink-0" />
                  Professor: {bk.professorName}
                </div>
              )}
              {bk.equipmentName && (
                <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                  <Headphones size={14} className="shrink-0" />
                  Equipamento:{" "}
                  {bk.equipmentName}
                </div>
              )}
              {(bk.student || bk.studentName) && (
                <div className="flex items-center gap-3 text-djon-text/50 text-xs">
                  <UserIcon size={14} className="shrink-0" />
                  {bookingStudentName(bk)}
                  {bk.student?.socials?.instagram && (
                    <span className="text-djon-text/30">
                      @{bk.student.socials.instagram}
                    </span>
                  )}
                </div>
              )}
              {bk.notes && (
                <div className="bg-djon-text/4 rounded-xl px-4 py-3 mt-2">
                  <p className="text-djon-text/40 text-xs leading-relaxed">
                    {bk.notes}
                  </p>
                </div>
              )}
            </div>

            {canEdit && bk.status === "pendente" && (
              <div className="-mx-5 -mb-5 mt-5 flex gap-2 border-t border-djon-text/10 px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={reviewing !== null}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-djon-warning-red/25 bg-djon-warning-red/10 py-2.5 text-xs font-black tracking-wide text-djon-warning-red transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={14} />
                  {reviewing === "reject" ? "RECUSANDO..." : "RECUSAR"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAccept()}
                  disabled={reviewing !== null}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-djon-accent py-2.5 text-xs font-black tracking-wide text-djon-ink transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={14} />
                  {reviewing === "accept" ? "ACEITANDO..." : "ACEITAR"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="space-y-4">
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                TIPO
              </label>
              <div className="flex gap-2">
                {(["aula", "treino"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type,
                        professorId: "",
                        date: "",
                        time: "",
                      })
                    }
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all hover:opacity-80 ${
                      form.type === type
                        ? "bg-djon-accent text-djon-ink"
                        : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10"
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                TÍTULO
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                UNIDADE
              </label>
              <DjonSelect
                required
                value={form.unitId}
                onChange={(unitId) =>
                  setForm({
                    ...form,
                    unitId,
                    professorId: "",
                    equipmentId: "",
                    date: "",
                    time: "",
                  })
                }
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.label,
                }))}
                placeholder="Selecionar unidade..."
              />
            </div>
            {form.type === "aula" && (
              <div>
                <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                  PROFESSOR
                </label>
                <DjonSelect
                  required
                  value={form.professorId}
                  onChange={(professorId) =>
                    setForm({ ...form, professorId, date: "", time: "" })
                  }
                  options={professors
                    .filter((professor) => professor.unitId === form.unitId)
                    .map((professor) => ({
                      value: professor.id,
                      label: professor.name,
                    }))}
                  placeholder="Selecionar professor..."
                />
              </div>
            )}
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                EQUIPAMENTO
              </label>
              <DjonSelect
                required
                value={form.equipmentId}
                onChange={(equipmentId) =>
                  setForm({ ...form, equipmentId, date: "", time: "" })
                }
                options={equipments
                  .filter((equipment) => equipment.unitId === form.unitId)
                  .map((equipment) => ({
                    value: equipment.id,
                    label: equipment.name,
                  }))}
                placeholder={
                  form.unitId
                    ? "Selecionar equipamento..."
                    : "Selecione a unidade primeiro"
                }
                disabled={!form.unitId}
              />
            </div>
            <BookingDateTimeFields
              type={form.type}
              unitId={form.unitId}
              professorId={form.professorId}
              equipmentId={form.equipmentId}
              date={form.date}
              time={form.time}
              durationMinutes={form.durationMinutes}
              onDateChange={(date) =>
                setForm((current) => ({ ...current, date }))
              }
              onTimeChange={(time) =>
                setForm((current) => ({ ...current, time }))
              }
              onDurationChange={(durationMinutes) =>
                setForm((current) => ({ ...current, durationMinutes }))
              }
              excludeBookingId={bk.id}
            />
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                STATUS
              </label>
              <div className="flex gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, status: s.value as Booking["status"] })
                    }
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-djon-label font-black tracking-wide transition-all flex items-center justify-center gap-1.5 hover:opacity-80 ${
                      form.status === s.value
                        ? "bg-djon-accent text-djon-ink"
                        : "bg-djon-text/5 text-djon-text/40 border border-djon-text/10"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.status === s.value ? "bg-djon-ink" : s.dot
                      }`}
                    />
                    {s.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                OBSERVAÇÕES
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={`${inp} resize-none`}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-djon-text/5 border border-djon-text/10 text-djon-text/50 text-xs font-black transition-all hover:brightness-110"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.title.trim() ||
                  !form.unitId ||
                  !form.equipmentId ||
                  (form.type === "aula" && !form.professorId) ||
                  !form.date ||
                  !form.time
                }
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-djon-accent text-djon-ink text-xs font-black flex items-center justify-center gap-1.5 transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={12} /> SALVAR
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
