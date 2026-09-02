"use client";

import { usePortalRevision } from "@/hooks/use-portal-revision";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Music2 } from "lucide-react";
import { store, type DJEvent } from "@/lib/store";
import { MuralEventCard } from "@/components/portal/mural-event-card";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: {
    duration: 0.7,
    ease: [0.25, 0.4, 0.25, 1] as const,
    delay,
  },
});

function eventTimestamp(event: DJEvent) {
  return new Date(`${event.date}T${event.time || "00:00"}`).getTime();
}

function getUpcomingEvents(events: DJEvent[]) {
  const now = Date.now();
  return [...events]
    .filter((event) => eventTimestamp(event) >= now)
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b))
    .slice(0, 6);
}

export function UpcomingEventsSection({
  background = "page",
}: {
  background?: "page" | "muted";
}) {
  const dataRevision = usePortalRevision("events");
  const [events, setEvents] = useState<DJEvent[]>(() =>
    getUpcomingEvents(store.getEvents()),
  );

  useEffect(() => {
    let active = true;

    void store
      .refreshEvents()
      .then((refreshedEvents) => {
        if (active) setEvents(getUpcomingEvents(refreshedEvents));
      })
      .catch(() => {
        // Mantém os dados já carregados pela inicialização do portal.
      });

    return () => {
      active = false;
    };
  }, [dataRevision]);

  return (
    <section
      className={`py-16 sm:py-20 ${
        background === "muted" ? "bg-djon-muted-panel" : "bg-djon-page"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.span
              className="mb-2 block text-xs font-black uppercase tracking-widest text-djon-accent"
              {...fadeUp(0)}
            >
              COMUNIDADE
            </motion.span>
            <motion.h2
              className="text-3xl font-black tracking-tighter text-djon-text md:text-5xl"
              {...fadeUp(0.1)}
            >
              Próximos Eventos
            </motion.h2>
            <motion.div
              className="mt-3 h-[3px] w-10 rounded-full bg-djon-accent"
              {...fadeUp(0.2)}
            />
          </div>

          <motion.div {...fadeUp(0.1)}>
            <Link
              href="/dashboard/mural"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:w-auto"
            >
              VER TODOS <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        {events.length === 0 ? (
          <motion.div
            className="rounded-2xl border-2 border-dashed border-djon-text/10 p-8 text-center sm:p-16"
            {...fadeUp(0.2)}
          >
            <Music2 size={40} className="mx-auto mb-4 text-djon-text/15" />
            <p className="text-sm font-bold text-djon-text/30">
              Nenhum evento futuro no mural.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, index) => (
              <MuralEventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
