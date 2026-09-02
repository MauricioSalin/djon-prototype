"use client";

import { usePortalRevision } from "@/hooks/use-portal-revision";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Disc3 } from "lucide-react";
import {
  DjonDatePicker,
  DjonTimeSelect,
} from "@/components/djon-date-time-picker";
import { store, type BookingAvailability } from "@/lib/store";
import { DjonSelect } from "@/components/djon-select";

type BookingResource = {
  type: "aula" | "treino";
  unitId: string;
  professorId: string;
  equipmentId: string;
};

type BookingDateTimeFieldsProps = BookingResource & {
  date: string;
  time: string;
  durationMinutes: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (durationMinutes: number) => void;
  excludeBookingId?: string;
};

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonth(value?: string) {
  return value?.slice(0, 7) || toLocalIso(new Date()).slice(0, 7);
}

function todayInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function endOfFollowingWeek(timezone: string) {
  const date = new Date(`${todayInTimezone(timezone)}T12:00:00.000Z`);
  const days = ((7 - date.getUTCDay()) % 7) + 7;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function BookingDateTimeFields({
  type,
  unitId,
  professorId,
  equipmentId,
  date,
  time,
  durationMinutes,
  onDateChange,
  onTimeChange,
  onDurationChange,
  excludeBookingId,
}: BookingDateTimeFieldsProps) {
  const dataRevision = usePortalRevision("bookings", "units", "equipments");
  const ready = Boolean(
    unitId && equipmentId && (type === "treino" || professorId),
  );
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadedMonth, setLoadedMonth] = useState("");
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [dayAvailability, setDayAvailability] = useState<BookingAvailability>({
    availableTimes: [],
    occupiedTimes: [],
    occupiedEquipment: [],
  });
  const requestVersion = useRef(0);
  const timezone =
    store.getUnits().find((unit) => unit.id === unitId)?.timezone ??
    "America/Sao_Paulo";

  const resource = useMemo(
    () => ({
      type,
      professorId: type === "aula" ? professorId : undefined,
      equipmentId,
    }),
    [equipmentId, professorId, type],
  );

  const loadMonth = useCallback(
    async (month: string) => {
      if (!ready) return;
      const version = ++requestVersion.current;
      setLoadingMonth(true);
      try {
        const result = await store.getMonthlyAvailability(
          month,
          unitId,
          resource,
          excludeBookingId,
          durationMinutes,
        );
        if (requestVersion.current !== version) return;
        setAvailableDates(new Set(result.availableDates));
        setLoadedMonth(month);
      } catch {
        if (requestVersion.current !== version) return;
        setAvailableDates(new Set());
        setLoadedMonth(month);
      } finally {
        if (requestVersion.current === version) setLoadingMonth(false);
      }
    },
    [durationMinutes, excludeBookingId, ready, resource, unitId],
  );

  useEffect(() => {
    if (ready) void loadMonth(currentMonth(date));
  }, [date, loadMonth, ready, dataRevision]);

  useEffect(() => {
    if (!ready || !date) {
      setDayAvailability({
        availableTimes: [],
        occupiedTimes: [],
        occupiedEquipment: [],
      });
      return;
    }
    let active = true;
    void store
      .getAvailability(
        date,
        unitId,
        resource,
        excludeBookingId,
        durationMinutes,
      )
      .then((availability) => {
        if (active) setDayAvailability(availability);
      })
      .catch(() => {
        if (active)
          setDayAvailability({
            availableTimes: [],
            occupiedTimes: [],
            occupiedEquipment: [],
          });
      });
    return () => {
      active = false;
    };
  }, [date, durationMinutes, excludeBookingId, ready, resource, unitId, dataRevision]);

  useEffect(() => {
    if (time && !dayAvailability.availableTimes.includes(time))
      onTimeChange("");
  }, [dayAvailability.availableTimes, onTimeChange, time]);

  const isDateDisabled = useCallback(
    (candidate: Date) => {
      const iso = toLocalIso(candidate);
      if (iso < todayInTimezone(timezone)) return true;
      if (
        store.getCurrentUser()?.role === "student" &&
        iso > endOfFollowingWeek(timezone)
      )
        return true;
      if (iso.slice(0, 7) !== loadedMonth) return true;
      return !availableDates.has(iso);
    },
    [availableDates, loadedMonth, timezone],
  );

  const occupiedEquipment = useMemo(() => {
    const seen = new Set<string>();
    return dayAvailability.occupiedEquipment.filter((slot) => {
      const key = `${slot.equipmentId}:${slot.time}:${slot.endTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dayAvailability.occupiedEquipment]);

  return (
    <div className="space-y-3">
      {!ready && (
        <div className="flex items-start gap-2 rounded-xl border border-djon-accent/15 bg-djon-accent/5 px-3 py-2.5 text-xs font-bold text-djon-text/45">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-djon-accent" />
          {type === "aula"
            ? "Selecione a unidade, o professor e o equipamento para liberar as datas."
            : "Selecione a unidade e o equipamento para liberar as datas."}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-black tracking-widest text-djon-text/40">
          DURAÇÃO
        </label>
        <DjonSelect
          required
          value={String(durationMinutes)}
          onChange={(value) => {
            onDurationChange(Number(value));
            onDateChange("");
            onTimeChange("");
          }}
          options={(type === "treino"
            ? [30, 60, 90]
            : Array.from({ length: 16 }, (_, index) => (index + 1) * 30)
          ).map((minutes) => ({
            value: String(minutes),
            label:
              minutes === 30
                ? "30 minutos"
                : minutes % 60 === 0
                  ? `${minutes / 60} ${minutes === 60 ? "hora" : "horas"}`
                  : `${Math.floor(minutes / 60)}h30`,
          }))}
          className="h-12"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-black tracking-widest text-djon-text/40">
            DATA
          </label>
          <DjonDatePicker
            value={date}
            onChange={(nextDate) => {
              onDateChange(nextDate);
              onTimeChange("");
            }}
            isDateDisabled={isDateDisabled}
            disabled={!ready}
            disabledHint="Selecione os recursos do agendamento primeiro"
            loading={loadingMonth}
            onMonthChange={(month) => {
              if (month !== loadedMonth) void loadMonth(month);
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-black tracking-widest text-djon-text/40">
            HORÁRIO
          </label>
          <DjonTimeSelect
            value={time}
            onChange={onTimeChange}
            options={dayAvailability.availableTimes}
            disabled={!date}
            placeholder={date ? "Selecione um horário" : "Escolha a data"}
          />
        </div>
      </div>

      {date && occupiedEquipment.length > 0 && (
        <div
          className="rounded-xl border border-djon-text/8 bg-djon-text/[0.03] px-3 py-3"
          aria-live="polite"
        >
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-djon-text/35">
            <Disc3 size={13} className="text-djon-accent" /> Equipamentos já
            utilizados neste dia
          </p>
          <div className="flex flex-wrap gap-1.5">
            {occupiedEquipment.map((slot) => (
              <span
                key={`${slot.bookingId}:${slot.equipmentId}:${slot.time}`}
                className="rounded-full border border-djon-text/8 bg-djon-page/60 px-2.5 py-1 text-[10px] font-bold text-djon-text/45"
              >
                {slot.time}–{slot.endTime} · {slot.equipmentName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
