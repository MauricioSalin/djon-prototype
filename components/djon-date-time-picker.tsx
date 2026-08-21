"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
} from "lucide-react";

export type DjonDateRange = {
  from?: string;
  to?: string;
};

type DatePickerMode = "single" | "range";

type DjonDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  mode?: DatePickerMode;
  range?: DjonDateRange;
  onRangeChange?: (range: DjonDateRange) => void;
  isDateDisabled?: (date: Date) => boolean;
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
  loading?: boolean;
  onMonthChange?: (month: string) => void;
};

type DjonTimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
};

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromIso(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatSelectedDate(value: string) {
  const date = fromIso(value);
  if (!date) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function DjonDatePicker({
  value,
  onChange,
  mode = "single",
  range,
  onRangeChange,
  isDateDisabled,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  disabledHint,
  loading = false,
  onMonthChange,
}: DjonDatePickerProps) {
  const selectedDate = useMemo(() => fromIso(value), [value]);
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 16, top: 16 });
  const [viewDate, setViewDate] = useState(selectedDate ?? new Date());
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      const target = e.target as Node;
      if (
        !ref.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnViewportChange = () => setOpen(false);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  const goToMonth = (direction: -1 | 1) => {
    setViewDate((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + direction,
        1,
      );
      onMonthChange?.(
        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
      );
      return next;
    });
  };

  const pickDate = (date: Date) => {
    if (isDateDisabled?.(date)) return;

    if (mode === "range") {
      const iso = toIso(date);
      if (!range?.from || range.to) {
        onRangeChange?.({ from: iso });
      } else if (iso < range.from) {
        onRangeChange?.({ from: iso, to: range.from });
      } else {
        onRangeChange?.({ from: range.from, to: iso });
      }
    }

    onChange(toIso(date));
    setOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const pickerWidth = Math.min(292, window.innerWidth - 32);
      const pickerHeight = 360;
      const left = Math.max(
        16,
        Math.min(rect.left, window.innerWidth - pickerWidth - 16),
      );
      const top =
        rect.bottom + pickerHeight + 8 <= window.innerHeight - 16
          ? rect.bottom + 8
          : Math.max(16, rect.top - pickerHeight - 8);
      setPopoverPosition({ left, top });
    }
    setOpen((current) => {
      const next = !current;
      if (next) {
        onMonthChange?.(
          `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`,
        );
      }
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        title={disabled ? disabledHint : undefined}
        className={`w-full h-12 bg-djon-text/5 border rounded-xl px-4 text-left text-sm font-bold transition-all flex items-center justify-between ${
          disabled
            ? "cursor-not-allowed border-djon-text/8 text-djon-text/18"
            : open
              ? "cursor-pointer border-djon-accent/60 bg-djon-text/8"
              : "cursor-pointer border-djon-text/10 hover:brightness-110"
        } ${value ? "text-djon-text" : "text-djon-text/30"}`}
      >
        <span>{formatSelectedDate(value) || placeholder}</span>
        <Calendar
          size={15}
          className={open ? "text-djon-accent" : "text-djon-text/35"}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="djon-scroll fixed z-[100] max-h-[calc(100svh-2rem)] w-[min(292px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-popover p-3 shadow-2xl sm:p-4"
            style={popoverPosition}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="cursor-pointer w-9 h-9 rounded-lg bg-djon-text/5 border border-djon-text/8 text-djon-text/45 hover:brightness-110 transition-all flex items-center justify-center"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-djon-text text-sm font-black">
                {MONTHS[viewDate.getMonth()]} de {viewDate.getFullYear()}
              </p>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="cursor-pointer w-9 h-9 rounded-lg bg-djon-text/5 border border-djon-text/8 text-djon-text/45 hover:brightness-110 transition-all flex items-center justify-center"
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="h-8 flex items-center justify-center text-djon-meta text-djon-text/45 font-bold"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date) => {
                const disabled = isDateDisabled?.(date) ?? false;
                const selected = selectedDate
                  ? sameDay(date, selectedDate)
                  : false;
                const isToday = sameDay(date, today);
                const outside = date.getMonth() !== viewDate.getMonth();

                return (
                  <button
                    key={toIso(date)}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDate(date)}
                    className={`h-8 rounded-lg text-xs font-bold transition-all ${
                      selected
                        ? "bg-djon-accent text-djon-ink"
                        : disabled
                          ? "cursor-not-allowed text-djon-text/12 line-through"
                          : isToday
                            ? "bg-djon-text/8 text-djon-accent hover:brightness-110"
                            : outside
                              ? "text-djon-text/22 hover:brightness-110"
                              : "text-djon-text/80 hover:brightness-110"
                    }`}
                    title={
                      disabled ? "Dia sem horários disponíveis" : undefined
                    }
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            {loading && (
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-djon-accent/70">
                Consultando disponibilidade...
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function DjonTimeSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "--:--",
}: DjonTimeSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasOptions = options.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => hasOptions && setOpen((v) => !v)}
        className={`w-full h-12 bg-djon-text/5 border rounded-xl px-4 text-left text-sm font-bold transition-all flex items-center justify-between ${
          disabled
            ? "cursor-not-allowed border-djon-text/8 text-djon-text/18"
            : open
              ? "cursor-pointer border-djon-accent/60 bg-djon-text/8 text-djon-text"
              : "cursor-pointer border-djon-text/10 hover:brightness-110 text-djon-text"
        } ${value ? "text-djon-text" : "text-djon-text/30"}`}
      >
        <span>{value || placeholder}</span>
        <div className="flex items-center gap-2">
          <Clock
            size={14}
            className={open ? "text-djon-accent" : "text-djon-text/35"}
          />
          <ChevronDown
            size={13}
            className={`text-djon-text/30 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div
          className="djon-scroll absolute left-0 top-[calc(100%+8px)] z-[70] max-h-56 w-full overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-popover p-1.5 shadow-2xl"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {hasOptions ? (
            options.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
                className={`cursor-pointer w-full rounded-xl px-3 py-2.5 text-left text-xs font-black transition-all ${
                  value === time
                    ? "bg-djon-accent text-djon-ink"
                    : "text-djon-text/65 hover:brightness-110"
                }`}
              >
                {time}
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-xs font-bold text-djon-text/30">
              Nenhum horário disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}
