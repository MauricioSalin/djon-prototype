"use client";

import { usePortalRevision } from "@/hooks/use-portal-revision";
import { useCallback, useEffect, useState } from "react";
import {
  Edit2,
  Headphones,
  Plus,
  Power,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useConfirmation } from "@/components/confirmation-provider";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, type Equipment, type Unit } from "@/lib/store";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent/50";
type EquipmentForm = Omit<Equipment, "id" | "unitLabel">;
const empty: EquipmentForm = {
  name: "",
  description: "",
  unitId: "",
  active: true,
  unavailableWeekdays: [],
  unavailableFrom: null,
  unavailableUntil: null,
};
const weekdays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const formatAvailabilityDateTime = (value: string) => {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
};

export default function EquipmentsAdminPage() {
  const dataRevision = usePortalRevision("equipments", "units");
  const { confirm } = useConfirmation();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<EquipmentForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availabilityTarget, setAvailabilityTarget] =
    useState<Equipment | null>(null);
  const [unavailableWeekdays, setUnavailableWeekdays] = useState<number[]>([]);
  const [periodMode, setPeriodMode] = useState(false);
  const [unavailableFrom, setUnavailableFrom] = useState("");
  const [unavailableUntil, setUnavailableUntil] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  useBodyScrollLock(open || Boolean(availabilityTarget));

  const sync = useCallback(() => setEquipments(store.getEquipments()), []);
  const load = useCallback(async () => {
    await store.listAdminEquipments();
    setUnits(store.getUnits().filter((unit) => unit.active));
    sync();
  }, [sync]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load, dataRevision]);

  const openNew = () => {
    setForm({
      ...empty,
      unitId: store.getUnits().find((unit) => unit.active)?.id ?? "",
    });
    setEditingId(null);
    setOpen(true);
  };

  const edit = (equipment: Equipment) => {
    setForm({
      name: equipment.name,
      description: equipment.description ?? "",
      unitId: equipment.unitId,
      active: equipment.active,
      unavailableWeekdays: equipment.unavailableWeekdays,
      unavailableFrom: equipment.unavailableFrom,
      unavailableUntil: equipment.unavailableUntil,
    });
    setEditingId(equipment.id);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await store.saveEquipment(form, editingId ?? undefined);
    setOpen(false);
    setEditingId(null);
    setForm(empty);
    await load();
  };

  const remove = async (equipment: Equipment) => {
    const confirmed = await confirm({
      title: "Excluir equipamento?",
      description: `${equipment.name} será excluído definitivamente. Para impedir agendamentos apenas por algum tempo, use o botão de desativar.`,
      confirmLabel: "EXCLUIR",
    });
    if (confirmed) {
      await store.deleteEquipment(equipment.id, { onChange: sync });
    }
  };

  const openAvailability = (equipment: Equipment) => {
    const hasPeriod = Boolean(
      equipment.unavailableFrom && equipment.unavailableUntil,
    );
    setAvailabilityTarget(equipment);
    setUnavailableWeekdays(hasPeriod ? [] : equipment.unavailableWeekdays);
    setPeriodMode(hasPeriod);
    setUnavailableFrom(equipment.unavailableFrom ?? "");
    setUnavailableUntil(equipment.unavailableUntil ?? "");
    setAvailabilityError("");
  };

  const saveAvailability = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!availabilityTarget) return;
    if (periodMode && unavailableUntil <= unavailableFrom) {
      setAvailabilityError(
        "A data e o horário de fim devem ser posteriores ao início.",
      );
      return;
    }
    await store.saveEquipment(
      {
        name: availabilityTarget.name,
        description: availabilityTarget.description,
        unitId: availabilityTarget.unitId,
        active: availabilityTarget.active,
        unavailableWeekdays: periodMode ? [] : unavailableWeekdays,
        unavailableFrom: periodMode ? unavailableFrom : null,
        unavailableUntil: periodMode ? unavailableUntil : null,
      },
      availabilityTarget.id,
    );
    setAvailabilityTarget(null);
    await load();
  };

  const pagination = useListPagination(equipments);

  if (loading) return <DashboardPageSkeleton variant="equipment" rows={4} />;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-djon-accent">Administração</p>
          <h1 className="text-3xl font-black tracking-tighter text-djon-text">
            Equipamentos
          </h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
        >
          <Plus size={14} /> NOVO EQUIPAMENTO
        </button>
      </div>

      {equipments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-12 text-center text-sm text-djon-text/35">
          Nenhum equipamento cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pagination.paginatedItems.map((equipment) => (
            <article
              key={equipment.id}
              className="flex h-full flex-col rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5"
            >
              <div className="flex flex-1 items-start gap-3">
                <div className="rounded-xl bg-djon-accent/10 p-3 text-djon-accent">
                  <Headphones size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-djon-text">{equipment.name}</p>
                  <p className="mt-1 text-xs text-djon-text/45">
                    {equipment.unitLabel}
                  </p>
                  {equipment.description && (
                    <p className="mt-2 text-xs leading-relaxed text-djon-text/35">
                      {equipment.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => edit(equipment)}
                  aria-label={`Editar ${equipment.name}`}
                  className="p-2 text-djon-text opacity-40 transition-opacity hover:opacity-100"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => openAvailability(equipment)}
                  aria-label={`Configurar indisponibilidade de ${equipment.name}`}
                  title="Configurar indisponibilidade"
                  className="p-2 text-djon-warning-red opacity-60 transition-opacity hover:opacity-100"
                >
                  <Power size={15} />
                </button>
                <button
                  onClick={() => void remove(equipment)}
                  aria-label={`Excluir ${equipment.name}`}
                  title="Excluir equipamento"
                  className="p-2 text-djon-warning-red opacity-60 transition-opacity hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <footer className="mt-4 border-t border-djon-text/8 pt-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${equipment.active ? "border-djon-accent/20 bg-djon-accent/10 text-djon-accent" : "border-djon-warning-red/20 bg-djon-warning-red/10 text-djon-warning-red"}`}
                >
                  {equipment.active ? "ATIVO" : "INATIVO"}
                </span>
                {equipment.unavailableWeekdays.length > 0 && (
                  <span className="ml-2 text-[10px] font-bold text-djon-text/40">
                    Indisponível:{" "}
                    {equipment.unavailableWeekdays
                      .map((day) => weekdays[day].slice(0, 3))
                      .join(", ")}
                  </span>
                )}
                {equipment.unavailableFrom && equipment.unavailableUntil && (
                  <span className="mt-2 block text-[10px] font-bold text-djon-text/40">
                    Bloqueado:{" "}
                    {formatAvailabilityDateTime(equipment.unavailableFrom)} →{" "}
                    {formatAvailabilityDateTime(equipment.unavailableUntil)}
                  </span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      <ListPagination
        totalItems={equipments.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="djon-scroll max-h-[calc(100svh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-djon-accent">
                  {editingId ? "EDITAR" : "NOVO"}
                </p>
                <h2 className="text-xl font-black text-djon-text">
                  Equipamento
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-djon-text opacity-40 transition-opacity hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                NOME
              </label>
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Ex: CDJ-3000 + DJM-A9"
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                UNIDADE
              </label>
              <DjonSelect
                required
                value={form.unitId}
                onChange={(unitId) => setForm({ ...form, unitId })}
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.label,
                }))}
                placeholder="Selecionar unidade..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                DESCRIÇÃO
              </label>
              <textarea
                maxLength={500}
                rows={3}
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Detalhes do setup disponível"
                className={`${field} resize-none`}
              />
            </div>
            {editingId && (
              <label className="flex items-center gap-2 text-sm text-djon-text/60">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                />
                Equipamento ativo
              </label>
            )}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
            >
              <Save size={14} /> SALVAR EQUIPAMENTO
            </button>
          </form>
        </div>
      )}

      {availabilityTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void saveAvailability(event)}
            className="djon-scroll max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-djon-warning-red">
                  DESATIVAR POR DIA
                </p>
                <h2 className="mt-1 text-xl font-black text-djon-text">
                  {availabilityTarget.name}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-djon-text/40">
                  Escolha os dias da semana ou um período específico em que o
                  equipamento não pode receber agendamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityTarget(null)}
                className="text-djon-text/40 hover:text-djon-text"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {weekdays.map((label, index) => {
                const checked = unavailableWeekdays.includes(index);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => {
                      if (periodMode) {
                        setPeriodMode(false);
                        setUnavailableFrom("");
                        setUnavailableUntil("");
                      }
                      setAvailabilityError("");
                      setUnavailableWeekdays((days) =>
                        checked
                          ? days.filter((day) => day !== index)
                          : [...days, index].sort(),
                      );
                    }}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition-colors ${checked ? "border-djon-warning-red/40 bg-djon-warning-red/10 text-djon-warning-red" : "border-djon-text/10 bg-djon-text/5 text-djon-text/55"}`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={periodMode}
                onClick={() => {
                  const nextPeriodMode = !periodMode;
                  setPeriodMode(nextPeriodMode);
                  setAvailabilityError("");
                  if (nextPeriodMode) {
                    setUnavailableWeekdays([]);
                  } else {
                    setUnavailableFrom("");
                    setUnavailableUntil("");
                  }
                }}
                className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition-colors ${periodMode ? "border-djon-warning-red/40 bg-djon-warning-red/10 text-djon-warning-red" : "border-djon-text/10 bg-djon-text/5 text-djon-text/55"}`}
              >
                Por dia e horário
              </button>
            </div>

            {periodMode && (
              <section
                className="mt-4 rounded-xl border border-djon-warning-red/15 bg-djon-warning-red/5 p-4"
                aria-label="Período de indisponibilidade"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="unavailable-from"
                      className="text-[10px] font-black text-djon-text/45"
                    >
                      INÍCIO
                    </Label>
                    <Input
                      id="unavailable-from"
                      type="datetime-local"
                      required
                      value={unavailableFrom}
                      onChange={(event) => {
                        setUnavailableFrom(event.target.value);
                        setAvailabilityError("");
                      }}
                      className="h-auto rounded-xl border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-xs text-djon-text [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="unavailable-until"
                      className="text-[10px] font-black text-djon-text/45"
                    >
                      FIM
                    </Label>
                    <Input
                      id="unavailable-until"
                      type="datetime-local"
                      required
                      min={unavailableFrom || undefined}
                      value={unavailableUntil}
                      onChange={(event) => {
                        setUnavailableUntil(event.target.value);
                        setAvailabilityError("");
                      }}
                      aria-describedby={
                        availabilityError
                          ? "availability-period-error"
                          : undefined
                      }
                      className="h-auto rounded-xl border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-xs text-djon-text [color-scheme:dark]"
                    />
                  </div>
                </div>
                {availabilityError && (
                  <p
                    id="availability-period-error"
                    role="alert"
                    className="mt-2 text-[11px] font-bold text-djon-warning-red"
                  >
                    {availabilityError}
                  </p>
                )}
              </section>
            )}

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink"
            >
              <Save size={14} /> SALVAR INDISPONIBILIDADE
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
