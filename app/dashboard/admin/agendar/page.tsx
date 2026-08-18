"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Edit2,
} from "lucide-react";
import {
  store,
  type Booking,
  type Equipment,
  type User,
  type Unit,
} from "@/lib/store";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { useConfirmation } from "@/components/confirmation-provider";
import { BookingDateTimeFields } from "@/components/booking-date-time-fields";

const inp =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all";

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = {
    confirmado: "bg-djon-accent/15 text-djon-accent",
    pendente: "bg-yellow-400/15 text-yellow-400",
    cancelado: "bg-djon-danger/15 text-djon-danger",
  };
  return (
    <span
      className={`text-djon-label font-black px-2 py-0.5 rounded-full tracking-wide ${map[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

type FormState = {
  userId: string;
  title: string;
  date: string;
  time: string;
  type: "aula" | "treino";
  notes: string;
  status: Booking["status"];
  unitId: string;
  professorId: string;
  equipmentId: string;
  durationMinutes: number;
};
const emptyForm: FormState = {
  userId: "",
  title: "",
  date: "",
  time: "",
  type: "aula",
  notes: "",
  status: "confirmado",
  unitId: "",
  professorId: "",
  equipmentId: "",
  durationMinutes: 60,
};

export default function AdminAgendarPage() {
  const { confirm } = useConfirmation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");

  const load = () => {
    setBookings(
      store
        .getBookings()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    );
    setStudents(
      store
        .getUsers()
        .filter((u) => u.role === "student" && u.active !== false),
    );
    setProfessors(
      store
        .getUsers()
        .filter((u) => u.role === "professor" && u.active !== false),
    );
    setUnits(store.getUnits().filter((unit) => unit.active));
    setEquipments(
      store.getEquipments().filter((equipment) => equipment.active),
    );
  };

  useEffect(() => {
    let mounted = true;
    void store.bootstrap().then((user) => {
      if (mounted && user?.role === "admin") load();
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openNew = () => {
    setForm({
      ...emptyForm,
      unitId: store.getUnits().find((unit) => unit.active)?.id ?? "",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (b: Booking) => {
    setForm({
      userId: b.userId,
      title: b.title,
      date: b.date,
      time: b.time,
      type: b.type,
      notes: b.notes ?? "",
      status: b.status,
      unitId: b.unitId ?? "",
      professorId: b.professorId ?? "",
      equipmentId: b.equipmentId ?? "",
      durationMinutes: b.durationMinutes,
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const previous = bookings.find((booking) => booking.id === editingId);
      if (
        previous &&
        previous.status !== "cancelado" &&
        form.status === "cancelado"
      ) {
        const confirmed = await confirm({
          title: "Cancelar agendamento?",
          description: `${form.title} será cancelado e o horário será liberado. Você poderá desfazer pelo aviso exibido em seguida.`,
          confirmLabel: "CANCELAR AGENDAMENTO",
        });
        if (!confirmed) return;
        await store.updateBooking(
          editingId,
          { ...form, status: previous.status },
          { silent: true },
        );
        await store.cancelBooking(editingId, { onChange: load });
      } else {
        await store.updateBooking(editingId, { ...form });
      }
    } else {
      await store.addBooking({ ...form });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (booking: Booking) => {
    const confirmed = await confirm({
      title: "Cancelar agendamento?",
      description: `${booking.title} será cancelado e o horário será liberado. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "CANCELAR AGENDAMENTO",
    });
    if (confirmed) await store.cancelBooking(booking.id, { onChange: load });
  };

  const filtered = bookings.filter((b) => {
    const u = store.getUserById(b.userId);
    return (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      u?.name.toLowerCase().includes(search.toLowerCase())
    );
  });
  const pagination = useListPagination(filtered, search);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">
            Administração
          </p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">
            Agendamentos
          </h1>
        </div>
        <motion.button
          onClick={openNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} /> NOVO
        </motion.button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por aluno ou título..."
        className={inp}
      />

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-page/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-djon-text tracking-tighter">
                  {editingId ? "Editar Agendamento" : "Novo Agendamento"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-djon-text/40 hover:text-djon-text"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
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
                        className={`cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all ${
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
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
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
                    <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
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
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
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
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    ALUNO
                  </label>
                  <DjonSelect
                    required
                    value={form.userId}
                    onChange={(userId) => setForm({ ...form, userId })}
                    options={students.map((student) => ({
                      value: student.id,
                      label: student.name,
                    }))}
                    placeholder="Selecionar aluno..."
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    TÍTULO
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Ex: Aula de Beat Match"
                    className={inp}
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
                  excludeBookingId={editingId ?? undefined}
                />
                {editingId && (
                  <div>
                    <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                      STATUS
                    </label>
                    <div className="flex gap-2">
                      {(form.status === "pendente"
                        ? ([
                            "confirmado",
                            "pendente",
                            "cancelado",
                          ] as Booking["status"][])
                        : (["confirmado", "cancelado"] as Booking["status"][])
                      ).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, status: s })}
                          className={`cursor-pointer flex-1 py-2 rounded-xl text-djon-label font-black tracking-wide transition-all ${
                            form.status === s
                              ? "bg-djon-accent text-djon-ink"
                              : "bg-djon-text/5 text-djon-text/40 border border-djon-text/10"
                          }`}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    OBSERVAÇÕES
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                    className={`${inp} resize-none`}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={
                    !form.userId ||
                    !form.title.trim() ||
                    !form.unitId ||
                    !form.equipmentId ||
                    (form.type === "aula" && !form.professorId) ||
                    !form.date ||
                    !form.time
                  }
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {editingId ? "SALVAR" : "AGENDAR"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <Calendar size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">
            Nenhum agendamento encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagination.paginatedItems.map((b, i) => {
            const owner = store.getUserById(b.userId);
            const ownerName = owner?.name ?? b.studentName ?? "Aluno";
            return (
              <motion.div
                key={b.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-4 sm:flex sm:items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="w-9 h-9 rounded-full bg-djon-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-djon-accent font-black text-sm">
                    {ownerName.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-djon-text text-sm font-bold truncate">
                    {b.title}
                  </p>
                  <p className="text-djon-text/40 text-xs">
                    {ownerName} · <span className="capitalize">{b.type}</span>
                    {b.unitLabel ? ` · ${b.unitLabel}` : ""}
                  </p>
                </div>
                <div className="col-span-2 flex w-full flex-wrap items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-djon-text/50 text-xs">
                      <Calendar size={11} />
                      {new Date(b.date + "T00:00:00").toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "short" },
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-djon-text/30 text-xs mt-0.5 justify-end">
                      <Clock size={11} />
                      {b.time}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                  <button
                    aria-label={`Editar agendamento ${b.title}`}
                    onClick={() => openEdit(b)}
                    className="cursor-pointer text-djon-text/20 hover:text-djon-accent transition-colors p-1"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    aria-label={`Cancelar agendamento ${b.title}`}
                    onClick={() => void handleDelete(b)}
                    className="cursor-pointer text-djon-text/20 hover:text-djon-danger transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <ListPagination
        totalItems={filtered.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}
