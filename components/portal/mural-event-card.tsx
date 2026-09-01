"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Instagram, MapPin, Star } from "lucide-react";
import type { DJEvent } from "@/lib/store";

export function MuralEventCard({
  event,
  index,
}: {
  event: DJEvent;
  index: number;
}) {
  const isDJOn = event.type === "djOn";
  const isPast = new Date(`${event.date}T00:00:00`) < new Date();

  return (
    <motion.article
      className={`group relative overflow-hidden rounded-2xl border transition-colors hover:border-djon-accent ${
        isDJOn
          ? "border-djon-accent/40 bg-djon-accent/5"
          : "border-djon-text/8 bg-djon-surface-2"
      } ${isPast ? "opacity-40" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isPast ? 0.4 : 1 }}
      transition={{
        delay: index * 0.06,
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1] as const,
      }}
    >
      {isDJOn && (
        <div className="flex items-center gap-2 bg-djon-accent px-5 py-2">
          <Star
            size={11}
            className="text-djon-ink"
            fill="var(--djon-color-ink)"
          />
          <span className="text-djon-caption font-black uppercase tracking-[0.25em] text-djon-ink">
            Evento Oficial DJ ON
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/dashboard/perfil/${event.createdBy}`}
            className="group/author flex items-center gap-3"
          >
            <div className="djon-avatar-fallback flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-black text-djon-accent">
              {event.createdByAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.createdByAvatar}
                  alt={event.createdByName}
                  className="h-full w-full object-cover"
                />
              ) : (
                event.createdByName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-xs font-black text-djon-text transition-colors group-hover/author:text-djon-accent">
                {event.createdByName}
              </p>
              <p
                className={`text-djon-caption font-black uppercase tracking-widest ${
                  isDJOn
                    ? "text-djon-accent"
                    : event.type === "professor"
                      ? "text-djon-text/50"
                      : "text-djon-text/30"
                }`}
              >
                {isDJOn
                  ? "DJ ON Academy"
                  : event.type === "professor"
                    ? "Professor"
                    : "Aluno"}
              </p>
            </div>
          </Link>
          {isPast && (
            <span className="rounded-full bg-djon-text/5 px-3 py-1 text-djon-caption font-black tracking-widest text-djon-text/30">
              PASSADO
            </span>
          )}
        </div>

        <h3 className="mb-4 text-xl font-black leading-tight tracking-tight text-djon-text md:text-2xl">
          {event.title}
        </h3>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-djon-text/50">
            <Clock size={12} />
            {new Date(`${event.date}T00:00:00`).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            às {event.time}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-djon-text/50">
            <MapPin size={12} />
            {event.location}
          </div>
          {event.instagram && (
            <a
              href={`https://instagram.com/${event.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-djon-text/30 transition-colors hover:text-djon-text"
            >
              <Instagram size={12} />@{event.instagram}
            </a>
          )}
        </div>

        {event.description && (
          <p className="border-t border-djon-text/8 pt-4 text-xs leading-relaxed text-djon-text/40">
            {event.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
