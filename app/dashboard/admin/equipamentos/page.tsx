"use client"

import { useCallback, useEffect, useState } from "react"
import { Edit2, Headphones, Plus, Save, Trash2, X } from "lucide-react"
import { DjonSelect } from "@/components/djon-select"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { useConfirmation } from "@/components/confirmation-provider"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"
import { store, type Equipment, type Unit } from "@/lib/store"

const field = "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent/50"
type EquipmentForm = Omit<Equipment, "id" | "unitLabel">
const empty: EquipmentForm = { name: "", description: "", unitId: "", active: true }

export default function EquipmentsAdminPage() {
  const { confirm } = useConfirmation()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [form, setForm] = useState<EquipmentForm>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const sync = useCallback(() => setEquipments(store.getEquipments()), [])
  const load = useCallback(async () => {
    await store.listAdminEquipments()
    setUnits(store.getUnits().filter((unit) => unit.active))
    sync()
  }, [sync])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const openNew = () => {
    setForm({ ...empty, unitId: store.getUnits().find((unit) => unit.active)?.id ?? "" })
    setEditingId(null)
    setOpen(true)
  }

  const edit = (equipment: Equipment) => {
    setForm({
      name: equipment.name,
      description: equipment.description ?? "",
      unitId: equipment.unitId,
      active: equipment.active,
    })
    setEditingId(equipment.id)
    setOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await store.saveEquipment(form, editingId ?? undefined)
    setOpen(false)
    setEditingId(null)
    setForm(empty)
    await load()
  }

  const deactivate = async (equipment: Equipment) => {
    const confirmed = await confirm({
      title: "Desativar equipamento?",
      description: `${equipment.name} deixará de aparecer para novos treinos. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "DESATIVAR",
    })
    if (confirmed) await store.deactivateEquipment(equipment.id, { onChange: sync })
  }

  const pagination = useListPagination(equipments)

  if (loading) return <DashboardPageSkeleton variant="grid" rows={4} />

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-djon-accent">Administração</p>
          <h1 className="text-3xl font-black tracking-tighter text-djon-text">Equipamentos</h1>
        </div>
        <button onClick={openNew} className="flex items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90">
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
            <article key={equipment.id} className="flex h-full flex-col rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5">
              <div className="flex flex-1 items-start gap-3">
                <div className="rounded-xl bg-djon-accent/10 p-3 text-djon-accent"><Headphones size={19} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-djon-text">{equipment.name}</p>
                  <p className="mt-1 text-xs text-djon-text/45">{equipment.unitLabel}</p>
                  {equipment.description && <p className="mt-2 text-xs leading-relaxed text-djon-text/35">{equipment.description}</p>}
                </div>
                <button onClick={() => edit(equipment)} aria-label={`Editar ${equipment.name}`} className="p-2 text-djon-text opacity-40 transition-opacity hover:opacity-100">
                  <Edit2 size={15} />
                </button>
                {equipment.active && (
                  <button onClick={() => void deactivate(equipment)} aria-label={`Desativar ${equipment.name}`} className="p-2 text-djon-warning-red opacity-60 transition-opacity hover:opacity-100">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <footer className="mt-4 border-t border-djon-text/8 pt-4">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${equipment.active ? "border-djon-accent/20 bg-djon-accent/10 text-djon-accent" : "border-djon-warning-red/20 bg-djon-warning-red/10 text-djon-warning-red"}`}>
                  {equipment.active ? "ATIVO" : "INATIVO"}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}

      <ListPagination totalItems={equipments.length} page={pagination.page} pageSize={pagination.pageSize}
        totalPages={pagination.totalPages} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="my-6 w-full max-w-lg space-y-4 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-djon-accent">{editingId ? "EDITAR" : "NOVO"}</p>
                <h2 className="text-xl font-black text-djon-text">Equipamento</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-djon-text opacity-40 transition-opacity hover:opacity-100"><X size={18} /></button>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">NOME</label>
              <input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ex: CDJ-3000 + DJM-A9" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">UNIDADE</label>
              <DjonSelect required value={form.unitId} onChange={(unitId) => setForm({ ...form, unitId })}
                options={units.map((unit) => ({ value: unit.id, label: unit.label }))} placeholder="Selecionar unidade..." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">DESCRIÇÃO</label>
              <textarea maxLength={500} rows={3} value={form.description ?? ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Detalhes do setup disponível" className={`${field} resize-none`} />
            </div>
            {editingId && (
              <label className="flex items-center gap-2 text-sm text-djon-text/60">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                Equipamento ativo
              </label>
            )}
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90">
              <Save size={14} /> SALVAR EQUIPAMENTO
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
