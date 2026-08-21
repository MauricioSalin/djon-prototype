"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { store, type Unit } from "@/lib/store";
import { ListPagination, useListPagination } from "@/components/list-pagination";
import { useConfirmation } from "@/components/confirmation-provider";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none focus:border-djon-accent/50";
type UnitForm = Omit<Unit, "id">;
const empty: UnitForm = {
  key: "",
  label: "",
  shortLabel: "",
  address: "",
  mapSrc: "",
  mapsHref: "",
  timezone: "America/Sao_Paulo",
  active: true,
};

export default function UnitsAdminPage() {
  const { confirm } = useConfirmation();
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<UnitForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(() => setUnits(store.getUnits()), []);
  const load = useCallback(async () => {
    await store.listAdminUnits();
    sync();
  }, [sync]);
  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const edit = (unit: Unit) => {
    const { id, ...values } = unit;
    void id;
    setForm(values);
    setEditingId(unit.id);
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await store.saveUnit(form, editingId ?? undefined);
    setOpen(false);
    setEditingId(null);
    setForm(empty);
    await load();
  };
  const deactivate = async (unit: Unit) => {
    const confirmed = await confirm({
      title: "Desativar unidade?",
      description: `${unit.label} deixará de aparecer para novos agendamentos. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "DESATIVAR",
    });
    if (confirmed) await store.deactivateUnit(unit.id, { onChange: sync });
  };
  const pagination = useListPagination(units);

  if (loading) return <DashboardPageSkeleton variant="grid" rows={4} />;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-djon-accent">Administração</p>
          <h1 className="text-3xl font-black tracking-tighter text-djon-text">
            Unidades
          </h1>
        </div>
        <button
          onClick={() => {
            setForm(empty);
            setEditingId(null);
            setOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
        >
          <Plus size={14} />
          NOVA UNIDADE
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {pagination.paginatedItems.map((unit) => (
          <article
            key={unit.id}
            className="flex h-full flex-col rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5"
          >
            <div className="flex flex-1 items-start gap-3">
              <div className="rounded-xl bg-djon-accent/10 p-3 text-djon-accent">
                <Building2 size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-djon-text">{unit.label}</p>
                <p className="mt-1 text-xs text-djon-text/40">{unit.address}</p>
              </div>
              <button
                onClick={() => edit(unit)}
                aria-label="Editar unidade"
                className="p-2 text-djon-text opacity-40 transition-opacity hover:opacity-100"
              >
                <Edit2 size={15} />
              </button>
              {unit.active && (
                <button
                  onClick={() => void deactivate(unit)}
                  aria-label="Desativar unidade"
                  className="p-2 text-djon-warning-red opacity-60 transition-opacity hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <footer className="mt-4 border-t border-djon-text/8 pt-4">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${
                  unit.active
                    ? "border-djon-accent/20 bg-djon-accent/10 text-djon-accent"
                    : "border-djon-warning-red/20 bg-djon-warning-red/10 text-djon-warning-red"
                }`}
              >
                {unit.active ? "ATIVA" : "INATIVA"}
              </span>
            </footer>
          </article>
        ))}
      </div>
      <ListPagination
        totalItems={units.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="my-6 w-full max-w-lg space-y-4 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-djon-text">
                {editingId ? "Editar unidade" : "Nova unidade"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-djon-text opacity-40 transition-opacity hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="Identificador (poa)"
                className={field}
              />
              <input
                required
                value={form.shortLabel}
                onChange={(e) =>
                  setForm({ ...form, shortLabel: e.target.value })
                }
                placeholder="Nome curto"
                className={field}
              />
            </div>
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Nome da unidade"
              className={field}
            />
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Endereço completo"
              className={field}
            />
            <input
              value={form.mapSrc ?? ""}
              onChange={(e) => setForm({ ...form, mapSrc: e.target.value })}
              placeholder="URL do mapa incorporado"
              className={field}
            />
            <input
              value={form.mapsHref ?? ""}
              onChange={(e) => setForm({ ...form, mapsHref: e.target.value })}
              placeholder="URL para abrir no mapa"
              className={field}
            />
            <input
              required
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="Fuso horário"
              className={field}
            />
            <label className="flex items-center gap-2 text-sm text-djon-text/60">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Unidade ativa
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
            >
              <Save size={14} />
              SALVAR UNIDADE
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
