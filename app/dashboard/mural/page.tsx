"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Music2, RefreshCw, Search } from "lucide-react"
import { store, type DJEvent } from "@/lib/store"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { DashboardPageSkeleton } from "@/components/loading-skeletons"
import { EditablePortalHero } from "@/components/portal/editable-portal-hero"
import { MuralEventCard } from "@/components/portal/mural-event-card"
import { EVENTS_HERO_SECTIONS, MURAL_HERO } from "@/lib/portal-hero-groups"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const, delay },
})

// Futuros primeiro (do mais próximo ao mais distante); passados no fim (mais recentes primeiro)
function sortUpcomingFirst(arr: DJEvent[]) {
  const now = new Date()
  const isFuture = (e: DJEvent) => new Date(e.date + "T00:00:00") >= now
  return [...arr].sort((a, b) => {
    const aF = isFuture(a)
    const bF = isFuture(b)
    if (aF && bF) return new Date(a.date).getTime() - new Date(b.date).getTime()
    if (!aF && !bF) return new Date(b.date).getTime() - new Date(a.date).getTime()
    return aF ? -1 : 1
  })
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export default function MuralPage() {
  const [djOnEvents, setDJOnEvents] = useState<DJEvent[]>(() =>
    sortUpcomingFirst(store.getDJOnEvents()),
  )
  const [studentEvents, setStudentEvents] = useState<DJEvent[]>(() =>
    sortUpcomingFirst(store.getStudentEvents()),
  )
  const [professorEvents, setProfessorEvents] = useState<DJEvent[]>(() =>
    sortUpcomingFirst(store.getProfessorEvents()),
  )
  const [filter, setFilter] = useState<"todos" | "djOn" | "alunos" | "professores">("todos")
  const [search, setSearch] = useState("")
  const [eventsLoaded, setEventsLoaded] = useState(() => store.hasLoadedPortalData())
  const [eventLoadError, setEventLoadError] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)
  const hasLoadedEvents = useRef(store.hasLoadedPortalData())

  useEffect(() => {
    let active = true
    const syncEvents = async (initialLoad = false) => {
      if (initialLoad && !hasLoadedEvents.current) setEventLoadError(false)
      try {
        const events = await store.refreshEvents()
        if (!active) return
        setDJOnEvents(sortUpcomingFirst(events.filter((event) => event.type === "djOn")))
        setStudentEvents(sortUpcomingFirst(events.filter((event) => event.type === "student")))
        setProfessorEvents(sortUpcomingFirst(events.filter((event) => event.type === "professor")))
        hasLoadedEvents.current = true
        setEventsLoaded(true)
        setEventLoadError(false)
      } catch {
        // Uma falha nunca pode ser interpretada visualmente como uma lista vazia.
        if (active && !hasLoadedEvents.current) setEventLoadError(true)
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void syncEvents()
    }

    if (!hasLoadedEvents.current) void syncEvents(true)
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      active = false
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [reloadVersion])

  const allEvents = sortUpcomingFirst([...djOnEvents, ...studentEvents, ...professorEvents])
  const eventsByType =
    filter === "todos" ? allEvents
    : filter === "djOn" ? djOnEvents
    : filter === "alunos" ? studentEvents
    : professorEvents
  const normalizedSearch = normalizeSearchText(search)
  const displayed = normalizedSearch
    ? eventsByType.filter((event) =>
        normalizeSearchText(`${event.title} ${event.createdByName}`).includes(normalizedSearch),
      )
    : eventsByType
  const pagination = useListPagination(displayed, `${filter}:${normalizedSearch}`)

  if (!eventsLoaded && !eventLoadError) return <DashboardPageSkeleton variant="events" />

  if (eventLoadError && !eventsLoaded) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Music2 size={42} className="mb-4 text-djon-text/10" />
        <p className="text-lg font-bold text-djon-text/35">
          Não foi possível carregar os eventos.
        </p>
        <p className="mt-2 max-w-md text-sm text-djon-text/25">
          A lista não será exibida como vazia enquanto a consulta não for concluída.
        </p>
        <button
          type="button"
          onClick={() => setReloadVersion((version) => version + 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink transition-opacity hover:opacity-80"
        >
          <RefreshCw size={14} />
          TENTAR NOVAMENTE
        </button>
      </main>
    )
  }

  return (
    <div className="bg-djon-page">

      <EditablePortalHero
        heroKey="mural"
        defaults={MURAL_HERO}
        bannerKey="mural"
        editorSections={EVENTS_HERO_SECTIONS}
        accentLines={[1]}
        showDivider={false}
      />

      {/* ── FILTER + GRID ──────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Filter tabs */}
          <motion.div className="mb-5 flex flex-wrap items-center gap-2" {...fadeUp(0.1)}>
            {(["todos", "djOn", "professores", "alunos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-widest transition-all hover:opacity-80 ${
                  filter === f
                    ? "bg-djon-accent text-djon-ink"
                    : "bg-djon-text/6 text-djon-text/50 border border-djon-text/10 cursor-pointer"
                }`}
              >
                {f === "todos" ? "TODOS" : f === "djOn" ? "DJ ON" : f === "professores" ? "PROFESSORES" : "ALUNOS"}
              </button>
            ))}
            <span className="w-full text-djon-text/20 text-xs font-bold sm:ml-auto sm:w-auto">
              {displayed.length} evento{displayed.length !== 1 ? "s" : ""}
            </span>
          </motion.div>

          <motion.div className="relative mb-10" {...fadeUp(0.15)}>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar evento ou pessoa que vai tocar"
              placeholder="Buscar pelo nome do evento ou de quem vai tocar..."
              className="w-full rounded-xl border border-djon-text/10 bg-djon-surface-2 py-3 pl-11 pr-4 text-sm text-djon-text outline-none transition-colors placeholder:text-djon-text/25 focus:border-djon-accent/60"
            />
          </motion.div>

          {displayed.length === 0 ? (
            <motion.div
              className="rounded-3xl border-2 border-dashed border-djon-text/8 p-8 text-center sm:p-20"
              {...fadeUp(0.2)}
            >
              <Music2 size={48} className="text-djon-text/15 mx-auto mb-4" />
              <p className="text-djon-text/20 text-sm font-bold">
                {normalizedSearch ? "Nenhum evento encontrado para esta busca." : "Nenhum evento para mostrar."}
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {pagination.paginatedItems.map((ev, i) => (
                <MuralEventCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          )}
          <ListPagination
            totalItems={displayed.length}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>

    </div>
  )
}
