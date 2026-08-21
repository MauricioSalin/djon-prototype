"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  FileText,
  X,
  MapPin,
} from "lucide-react";
import {
  store,
  type Booking,
  type Equipment,
  type TrainingBalance,
  type Unit,
} from "@/lib/store";
import { academyLocationStorageKey } from "@/lib/locations";
import { BookingDateTimeFields } from "@/components/booking-date-time-fields";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { useConfirmation } from "@/components/confirmation-provider";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
});

const inputCls =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:brightness-110 transition-all";
function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = {
    confirmado: "bg-djon-accent/15 text-djon-accent",
    pendente: "bg-djon-light-purple/15 text-djon-light-purple",
    cancelado: "bg-djon-warning-red/15 text-djon-warning-red",
  };
  return (
    <span
      className={`text-djon-caption font-black px-2.5 py-1 rounded-full tracking-widest ${map[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default function AgendarPage() {
  const { confirm } = useConfirmation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reschedulingFrom, setReschedulingFrom] = useState<Booking | null>(
    null,
  );
  const [units, setUnits] = useState<Unit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [trainingBalance, setTrainingBalance] =
    useState<TrainingBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    type: "treino" as const,
    notes: "",
    unitId: "",
    professorId: "",
    equipmentId: "",
    durationMinutes: 60,
  });

  const load = () => {
    const u = store.getCurrentUser();
    if (u)
      setBookings(
        store
          .getBookingsByUser(u.id)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
      );
  };

  const syncLocalTrainingBalance = () => {
    setTrainingBalance((current) => {
      if (!current) return current;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeTrainings = store
        .getBookingsByUser(store.getCurrentUser()?.id ?? "")
        .filter(
          (booking) =>
            booking.type === "treino" &&
            booking.status !== "cancelado" &&
            new Date(`${booking.date}T00:00:00`) >= today,
        );
      const replacedBookingIds = new Set(
        activeTrainings
          .map((booking) => booking.originalBookingId)
          .filter((id): id is string => Boolean(id)),
      );
      const reservedHours = activeTrainings
        .filter((booking) => !replacedBookingIds.has(booking.id))
        .reduce((total, booking) => total + booking.durationMinutes / 60, 0);
      return {
        limitHours: current.limitHours,
        reservedHours,
        remainingHours: Math.max(0, current.limitHours - reservedHours),
      };
    });
  };

  useEffect(() => {
    load();
    const availableUnits = store.getUnits().filter((unit) => unit.active);
    setUnits(availableUnits);
    setEquipments(
      store.getEquipments().filter((equipment) => equipment.active),
    );
    void store.getTrainingBalance()
      .then(setTrainingBalance)
      .finally(() => setLoading(false));
    const selectedKey = window.localStorage.getItem(academyLocationStorageKey);
    const studentUnitId = store.getCurrentUser()?.unitId;
    const preferred =
      availableUnits.find((unit) => unit.id === studentUnitId) ??
      availableUnits.find((unit) => unit.key === selectedKey) ??
      availableUnits[0];
    if (preferred) setForm((current) => ({ ...current, unitId: preferred.id }));
  }, []);

  const openRequest = (booking?: Booking) => {
    setReschedulingFrom(booking ?? null);
    setForm({
      title: booking?.title ?? "",
      date: "",
      time: "",
      notes: booking?.notes ?? "",
      type: "treino",
      unitId: booking?.unitId ?? form.unitId,
      professorId: booking?.professorId ?? "",
      equipmentId: booking?.equipmentId ?? "",
      durationMinutes: booking?.durationMinutes ?? 60,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = store.getCurrentUser();
    if (!u) return;
    const payload: Omit<Booking, "id" | "createdAt"> = {
      ...form,
      title: form.title.trim() || "Solicitação de treino",
      notes: reschedulingFrom
        ? `Remarcação solicitada para "${reschedulingFrom.title}". ${form.notes}`.trim()
        : form.notes,
      userId: u.id,
      type: "treino",
      status: "pendente",
    };
    if (reschedulingFrom)
      await store.rescheduleBooking(reschedulingFrom.id, payload);
    else await store.addBooking(payload);
    setForm((current) => ({
      title: "",
      date: "",
      time: "",
      type: "treino",
      notes: "",
      unitId: current.unitId,
      professorId: "",
      equipmentId: current.equipmentId,
      durationMinutes: 60,
    }));
    setReschedulingFrom(null);
    setShowForm(false);
    load();
    setTrainingBalance(await store.getTrainingBalance());
  };

  const handleCancel = async (booking: Booking) => {
    const confirmed = await confirm({
      title: "Cancelar agendamento?",
      description: `${booking.title} será cancelado. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "CANCELAR AGENDAMENTO",
    });
    if (confirmed) {
      await store.cancelBooking(booking.id, {
        onChange: () => {
          load();
          syncLocalTrainingBalance();
        },
      });
    }
  };

  const upcoming = bookings.filter(
    (b) => new Date(b.date + "T00:00:00") >= new Date(),
  );
  const past = bookings.filter(
    (b) => new Date(b.date + "T00:00:00") < new Date(),
  );
  const upcomingPagination = useListPagination(upcoming);
  const historyPagination = useListPagination(past);

  const fmt = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  if (loading) return <DashboardPageSkeleton variant="list" />;

  return (
    <div className="bg-djon-page">
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/djon-hero.png"
            alt=""
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/80 to-djon-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div>
            <motion.span
              className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
              {...fadeUp(0.1)}
            >
              PORTAL DO ALUNO
            </motion.span>
            <motion.h1
              className="djon-hero-title font-black text-djon-text"
              {...fadeUp(0.2)}
            >
              Agendamentos
            </motion.h1>
            <motion.div
              className="h-[3px] w-10 bg-djon-accent rounded-full mt-4"
              {...fadeUp(0.3)}
            />
            <motion.p
              className="text-djon-text/40 text-base max-w-md leading-relaxed mt-4"
              {...fadeUp(0.35)}
            >
              Solicite seus treinos nos horários disponíveis. Aulas são
              agendadas diretamente pelos professores ou pela administração.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── FORM MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-djon-text/12 bg-djon-surface p-5 shadow-2xl sm:my-6 sm:p-8"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.4, 0.25, 1] as const,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-djon-accent text-xs font-black tracking-widest uppercase mb-1">
                    {reschedulingFrom ? "REMARCAR" : "NOVO"}
                  </p>
                  <h2 className="text-2xl font-black text-djon-text tracking-tighter">
                    {reschedulingFrom ? "Remarcar treino" : "Solicitar treino"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 flex items-center justify-center text-djon-text/50 hover:brightness-110 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl border border-djon-accent/15 bg-djon-accent/5 px-4 py-3">
                  <p className="text-xs font-black tracking-widest text-djon-accent">
                    SOLICITAÇÃO DE TREINO
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-djon-text/40">
                    O horário e o equipamento ficam reservados enquanto um
                    professor analisa a solicitação.
                  </p>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">
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
                    placeholder="Selecione uma unidade"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">
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
                        ? "Selecione um equipamento"
                        : "Selecione a unidade primeiro"
                    }
                    disabled={!form.unitId}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">
                    TÍTULO
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Ex: Treino de Beat Match"
                    className={inputCls}
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
                  excludeBookingId={reschedulingFrom?.id}
                />
                <div>
                  <label className="text-djon-text/40 text-xs font-black tracking-widest mb-2 block">
                    OBSERVAÇÕES
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Conte o que você quer trabalhar neste agendamento."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={
                    !form.title.trim() ||
                    !form.unitId ||
                    !form.equipmentId ||
                    !form.date ||
                    !form.time
                  }
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3.5 font-black text-sm tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {reschedulingFrom
                    ? "SOLICITAR REMARCAÇÃO"
                    : "SOLICITAR TREINO"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UPCOMING ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-djon-muted-panel sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {trainingBalance && (
            <div className="mb-8 grid gap-3 rounded-2xl border border-djon-accent/15 bg-djon-accent/5 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <p className="text-djon-label font-black tracking-widest text-djon-text/35">
                  LIMITE DE TREINO
                </p>
                <p className="mt-1 text-xl font-black text-djon-text">
                  {trainingBalance.limitHours}h
                </p>
              </div>
              <div>
                <p className="text-djon-label font-black tracking-widest text-djon-text/35">
                  HORAS RESERVADAS
                </p>
                <p className="mt-1 text-xl font-black text-djon-light-purple">
                  {trainingBalance.reservedHours}h
                </p>
              </div>
              <div>
                <p className="text-djon-label font-black tracking-widest text-djon-text/35">
                  DISPONÍVEIS
                </p>
                <p className="mt-1 text-xl font-black text-djon-accent">
                  {trainingBalance.remainingHours}h
                </p>
              </div>
            </div>
          )}
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <motion.span
                className="block text-djon-accent text-xs tracking-widest font-black uppercase mb-2"
                {...fadeUp(0)}
              >
                PRÓXIMOS
              </motion.span>
              <motion.h2
                className="text-3xl md:text-5xl font-black text-djon-text tracking-tighter mb-2"
                {...fadeUp(0.1)}
              >
                Próximos Agendamentos
              </motion.h2>
              <motion.div
                className="h-[3px] w-10 bg-djon-accent rounded-full"
                {...fadeUp(0.15)}
              />
            </div>
            <motion.button
              onClick={() => openRequest()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink sm:w-auto relative overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              {...fadeUp(0.1)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-djon-text/30 to-transparent -translate-x-full"
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5 }}
              />
              <Plus size={15} className="relative z-10" />
              <span className="relative z-10">SOLICITAR TREINO</span>
            </motion.button>
          </div>

          {upcoming.length === 0 ? (
            <motion.div
              className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-20"
              {...fadeUp(0.2)}
            >
              <Calendar size={48} className="text-djon-text/12 mx-auto mb-4" />
              <p className="text-djon-text/25 text-sm font-bold mb-6">
                Nenhum agendamento solicitado
              </p>
              <button
                onClick={() => openRequest()}
                className="inline-flex items-center gap-2 bg-djon-accent text-djon-ink px-7 py-3 rounded-full font-black text-sm tracking-widest"
              >
                <Plus size={14} /> SOLICITAR TREINO
              </button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPagination.paginatedItems.map((b, i) => (
                <motion.div
                  key={b.id}
                  className="bg-djon-surface-2 border border-djon-text/8 hover:brightness-110 rounded-2xl p-6 transition-all"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        b.type === "aula"
                          ? "bg-djon-accent/12"
                          : "bg-djon-light-purple/12"
                      }`}
                    >
                      {b.type === "aula" ? (
                        <FileText size={18} className="text-djon-accent" />
                      ) : (
                        <Clock size={18} className="text-djon-light-purple" />
                      )}
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <h3 className="text-djon-text font-black text-lg tracking-tight mb-3 leading-tight">
                    {b.title}
                  </h3>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Calendar size={11} />
                      {fmt(b.date)}
                    </div>
                    <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                      <Clock size={11} />
                      {b.time} · {b.durationMinutes / 60}h
                    </div>
                    {b.unitLabel && (
                      <div className="flex items-center gap-2 text-djon-text/40 text-xs">
                        <MapPin size={11} />
                        {b.unitLabel}
                      </div>
                    )}
                  </div>
                  {b.notes && (
                    <p className="text-djon-text/30 text-xs leading-relaxed border-t border-djon-text/8 pt-3">
                      {b.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {b.type === "treino" && b.status !== "cancelado" && (
                      <button
                        onClick={() => openRequest(b)}
                        className="cursor-pointer text-djon-text/35 hover:brightness-110 transition-colors flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Calendar size={12} /> Remarcar
                      </button>
                    )}
                    {b.status !== "cancelado" && (
                      <button
                        onClick={() => void handleCancel(b)}
                        className="cursor-pointer text-djon-text/15 hover:brightness-110 transition-colors flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Trash2 size={12} /> Cancelar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <ListPagination
            totalItems={upcoming.length}
            page={upcomingPagination.page}
            pageSize={upcomingPagination.pageSize}
            totalPages={upcomingPagination.totalPages}
            onPageChange={upcomingPagination.setPage}
            onPageSizeChange={upcomingPagination.setPageSize}
          />
        </div>
      </section>

      {/* ── HISTÓRICO ─────────────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="py-16 bg-djon-page sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.span
              className="block text-djon-text/25 text-xs tracking-widest font-black uppercase mb-2"
              {...fadeUp(0)}
            >
              HISTÓRICO
            </motion.span>
            <motion.h2
              className="text-3xl md:text-5xl font-black text-djon-text/50 tracking-tighter mb-2"
              {...fadeUp(0.1)}
            >
              Histórico
            </motion.h2>
            <motion.div
              className="h-[3px] w-10 bg-djon-text/15 rounded-full mb-10"
              {...fadeUp(0.15)}
            />
            <div className="space-y-3">
              {historyPagination.paginatedItems.map((b, i) => (
                <motion.div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-djon-text/6 bg-djon-surface px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-djon-text/5 flex items-center justify-center shrink-0">
                    {b.type === "aula" ? (
                      <FileText size={15} className="text-djon-text/20" />
                    ) : (
                      <Clock size={15} className="text-djon-text/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text/40 font-black text-sm truncate">
                      {b.title}
                    </p>
                    <p className="text-djon-text/20 text-xs mt-0.5 capitalize">
                      {b.type}
                    </p>
                  </div>
                  <div className="shrink-0 text-djon-text/20 text-xs font-bold">
                    {fmt(b.date)}
                  </div>
                  {b.status !== "cancelado" && (
                    <button
                      onClick={() => void handleCancel(b)}
                      className="cursor-pointer text-djon-text/10 hover:brightness-110 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            <ListPagination
              totalItems={past.length}
              page={historyPagination.page}
              pageSize={historyPagination.pageSize}
              totalPages={historyPagination.totalPages}
              onPageChange={historyPagination.setPage}
              onPageSizeChange={historyPagination.setPageSize}
            />
          </div>
        </section>
      )}
    </div>
  );
}
