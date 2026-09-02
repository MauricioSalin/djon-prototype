"use client";

import { usePortalRevision } from "@/hooks/use-portal-revision";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Edit2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { store, type SaveUnitInput, type Unit } from "@/lib/store";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { useConfirmation } from "@/components/confirmation-provider";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { formatPhone } from "@/lib/phone";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { academyLocations } from "@/lib/locations";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none focus:border-djon-accent/50";
type UnitForm = SaveUnitInput;
const empty: UnitForm = {
  label: "",
  address: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  openingHours: "Segunda à sexta das 9h às 18h",
  active: true,
};

const label =
  "mb-1.5 block text-djon-label font-black uppercase tracking-widest text-djon-text/40";

export default function UnitsAdminPage() {
  const dataRevision = usePortalRevision("units");
  const { confirm } = useConfirmation();
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<UnitForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  useBodyScrollLock(open);

  const sync = useCallback(() => setUnits(store.getUnits()), []);
  const load = useCallback(async () => {
    await store.listAdminUnits();
    sync();
  }, [sync]);
  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load, dataRevision]);

  const edit = (unit: Unit) => {
    const fallback = academyLocations[unit.key];
    setForm({
      label: unit.label,
      address: unit.address,
      phone: unit.phone ?? fallback?.phone ?? "",
      email: unit.email ?? fallback?.email ?? "",
      instagram: unit.instagram ?? fallback?.instagram ?? "",
      facebook: unit.facebook ?? fallback?.facebook ?? "",
      openingHours: unit.openingHours ?? fallback?.openingHours ?? "",
      active: unit.active,
    });
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

  if (loading) return <DashboardPageSkeleton variant="units" rows={4} />;

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
                <p className="mt-1 flex items-start gap-1.5 text-xs text-djon-text/40">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  {unit.address}
                </p>
                {(unit.phone ?? academyLocations[unit.key]?.phone) && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-djon-text/50">
                    <Phone size={12} className="shrink-0" />
                    {unit.phone ?? academyLocations[unit.key]?.phone}
                  </p>
                )}
                {(unit.email ?? academyLocations[unit.key]?.email) && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-djon-text/50">
                    <Mail size={12} className="shrink-0" />
                    {unit.email ?? academyLocations[unit.key]?.email}
                  </p>
                )}
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unit-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={submit}
            className="djon-scroll max-h-[calc(100svh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            <div className="flex items-center justify-between">
              <h2
                id="unit-dialog-title"
                className="text-xl font-black text-djon-text"
              >
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
            <section>
              <p className="mb-3 text-xs font-black tracking-widest text-djon-accent">
                INFORMAÇÕES DA UNIDADE
              </p>
              <div className="space-y-4">
                <label className="block">
                  <span className={label}>Nome da unidade</span>
                  <input
                    required
                    value={form.label}
                    onChange={(e) =>
                      setForm({ ...form, label: e.target.value })
                    }
                    placeholder="Ex.: Porto Alegre / RS"
                    maxLength={150}
                    className={field}
                  />
                </label>
                <label className="block">
                  <span className={label}>Endereço completo</span>
                  <input
                    required
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Rua, número, complemento, bairro, cidade e estado"
                    maxLength={300}
                    autoComplete="street-address"
                    className={field}
                  />
                </label>
                <p className="flex gap-2 rounded-xl border border-djon-accent/15 bg-djon-accent/5 px-3 py-2.5 text-xs leading-relaxed text-djon-text/50">
                  <Globe2
                    size={15}
                    className="mt-0.5 shrink-0 text-djon-accent"
                  />
                  Mapa, link de localização, identificador interno e fuso
                  horário são definidos automaticamente.
                </p>
              </div>
            </section>
            <div className="border-t border-djon-text/8 pt-4">
              <p className="mb-3 text-xs font-black tracking-widest text-djon-accent">
                CONTATO E SITE
              </p>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>Telefone público</span>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-djon-text/30"
                      />
                      <input
                        required
                        value={form.phone ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            phone: formatPhone(e.target.value),
                          })
                        }
                        placeholder="(51) 99999-0000"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={15}
                        className={`${field} pl-9`}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className={label}>E-mail de contato</span>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-djon-text/30"
                      />
                      <input
                        required
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="contato@unidade.com"
                        autoComplete="email"
                        className={`${field} pl-9`}
                      />
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className={label}>Horário de atendimento</span>
                  <input
                    required
                    value={form.openingHours ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, openingHours: e.target.value })
                    }
                    placeholder="Ex.: Segunda à sexta, das 9h às 18h"
                    maxLength={120}
                    className={field}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>
                      Instagram{" "}
                      <span className="font-normal opacity-60">(opcional)</span>
                    </span>
                    <input
                      type="url"
                      value={form.instagram ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, instagram: e.target.value })
                      }
                      placeholder="https://instagram.com/..."
                      className={field}
                    />
                  </label>
                  <label className="block">
                    <span className={label}>
                      Facebook{" "}
                      <span className="font-normal opacity-60">(opcional)</span>
                    </span>
                    <input
                      type="url"
                      value={form.facebook ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, facebook: e.target.value })
                      }
                      placeholder="https://facebook.com/..."
                      className={field}
                    />
                  </label>
                </div>
              </div>
            </div>
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
