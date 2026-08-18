"use client"

import { useEffect, useState } from "react"
import { Inbox, Mail, MapPin, Save, Trash2 } from "lucide-react"
import { store, type Lead } from "@/lib/store"
import { DjonSelect } from "@/components/djon-select"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { useConfirmation } from "@/components/confirmation-provider"

const field = "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none focus:border-djon-accent/50"
const statuses: Lead["status"][] = ["novo", "contatado", "convertido", "arquivado"]

export default function LeadsAdminPage() {
  const { confirm } = useConfirmation()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<Lead["status"] | "todos">("todos")

  const load = () => setLeads(store.getLeads())
  useEffect(load, [])

  const updateLocal = (id: string, changes: Partial<Lead>) =>
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...changes } : lead))

  const save = async (lead: Lead) => {
    await store.updateLead(lead.id, { status: lead.status, internalNotes: lead.internalNotes })
    load()
  }

  const remove = async (lead: Lead) => {
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email
    const confirmed = await confirm({
      title: "Remover contato?",
      description: `${name} será removido da lista. Você poderá desfazer pelo aviso exibido em seguida.`,
      confirmLabel: "REMOVER",
      confirmVariant: "outline",
    })
    if (confirmed) await store.deleteLead(lead.id, { onChange: load })
  }

  const visible = filter === "todos" ? leads : leads.filter((lead) => lead.status === filter)
  const pagination = useListPagination(visible, filter)

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold text-djon-accent">Administração</p><h1 className="text-3xl font-black tracking-tighter text-djon-text">Contatos do site</h1></div>
        <DjonSelect value={filter} onChange={(value) => setFilter(value as typeof filter)}
          options={[{ value: "todos", label: "Todos" }, ...statuses.map((status) => ({ value: status, label: status }))]}
          ariaLabel="Filtrar contatos por status" className="sm:w-48" />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-djon-text/10 p-16 text-center"><Inbox className="mx-auto mb-3 text-djon-text/20" /><p className="text-sm font-bold text-djon-text/35">Nenhum contato encontrado.</p></div>
      ) : pagination.paginatedItems.map((lead) => (
        <article key={lead.id} className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black text-djon-text">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Visitante"}</p>
              <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-2 text-xs font-bold text-djon-accent"><Mail size={12} />{lead.email}</a>
              {lead.unitKey && <p className="mt-2 flex items-center gap-2 text-xs text-djon-text/40"><MapPin size={12} />{lead.unitKey}</p>}
              {lead.message && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-djon-text/4 p-3 text-sm leading-relaxed text-djon-text/60">{lead.message}</p>}
              <p className="mt-3 text-xs text-djon-text/25">{new Date(lead.createdAt).toLocaleString("pt-BR")}</p>
            </div>
            <div className="w-full space-y-3 lg:w-72">
              <DjonSelect value={lead.status} onChange={(status) => updateLocal(lead.id, { status: status as Lead["status"] })}
                options={statuses.map((status) => ({ value: status, label: status }))}
                ariaLabel={`Status do contato de ${lead.firstName || lead.email}`} />
              <textarea value={lead.internalNotes ?? ""} onChange={(e) => updateLocal(lead.id, { internalNotes: e.target.value })} rows={3} placeholder="Notas internas" className={field} />
              <div className="flex gap-2"><button onClick={() => void save(lead)} className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-djon-accent py-2.5 text-xs font-black text-djon-ink"><Save size={13} />SALVAR</button><button onClick={() => void remove(lead)} aria-label="Excluir contato" className="cursor-pointer rounded-xl border border-djon-danger/20 px-3 text-djon-danger"><Trash2 size={14} /></button></div>
            </div>
          </div>
        </article>
      ))}
      <ListPagination
        totalItems={visible.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </main>
  )
}
