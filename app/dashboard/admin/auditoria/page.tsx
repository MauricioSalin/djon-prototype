"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { DjonSelect } from "@/components/djon-select";
import { store, type AuditLogPage } from "@/lib/store";

const methodOptions = [
  { value: "all", label: "Todos os métodos" },
  { value: "GET", label: "GET — Consulta" },
  { value: "POST", label: "POST — Criação" },
  { value: "PATCH", label: "PATCH — Alteração" },
  { value: "DELETE", label: "DELETE — Exclusão" },
];

const methodColor: Record<string, string> = {
  GET: "border-djon-light-purple/25 bg-djon-light-purple/10 text-djon-light-purple",
  POST: "border-djon-accent/25 bg-djon-accent/10 text-djon-accent",
  PATCH: "border-djon-yellow/25 bg-djon-yellow/10 text-djon-yellow",
  DELETE:
    "border-djon-warning-red/25 bg-djon-warning-red/10 text-djon-warning-red",
};

export default function AuditPage() {
  const [result, setResult] = useState<AuditLogPage | null>(null);
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(
        await store.listAuditLogs(
          page,
          50,
          method === "all" ? undefined : method,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [method, page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !result) return <DashboardPageSkeleton variant="audit" />;

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / 50));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-djon-accent">ADMINISTRAÇÃO</p>
          <h1 className="mt-1 text-3xl font-black tracking-tighter text-djon-text">
            Auditoria
          </h1>
          <p className="mt-2 max-w-xl text-sm text-djon-text/40">
            Histórico das operações realizadas no portal e na API.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <DjonSelect
            value={method}
            options={methodOptions}
            onChange={(value) => {
              setMethod(value);
              setPage(1);
            }}
          />
        </div>
      </header>

      {!result?.items.length ? (
        <div className="rounded-2xl border-2 border-dashed border-djon-text/10 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 text-djon-text/15" size={34} />
          <p className="text-sm font-bold text-djon-text/30">
            Nenhum registro encontrado.
          </p>
        </div>
      ) : (
        <section
          className={`space-y-2 transition-opacity ${loading ? "opacity-45" : "opacity-100"}`}
        >
          {result.items.map((entry) => (
            <article
              key={entry.id}
              className="grid gap-3 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-4 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center"
            >
              <span
                className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-black ${methodColor[entry.method] ?? "border-djon-text/10 text-djon-text/50"}`}
              >
                {entry.method}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-bold text-djon-text/70">
                  {entry.path}
                </p>
                <p className="mt-1 truncate text-xs text-djon-text/35">
                  {entry.actorName}
                  {entry.actorRole ? ` · ${entry.actorRole}` : ""}
                  {entry.targetId ? ` · alvo ${entry.targetId}` : ""}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-black text-djon-text/55">
                  HTTP {entry.statusCode} · {entry.durationMs} ms
                </p>
                <time className="mt-1 block text-[10px] font-bold text-djon-text/30">
                  {new Date(entry.createdAt).toLocaleString("pt-BR")}
                </time>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="flex items-center justify-between border-t border-djon-text/8 pt-4">
        <p className="text-xs font-bold text-djon-text/35">
          {result?.total ?? 0} registros · página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-full border border-djon-text/10 p-2 text-djon-text/50 disabled:opacity-25"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border border-djon-text/10 p-2 text-djon-text/50 disabled:opacity-25"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </main>
  );
}
