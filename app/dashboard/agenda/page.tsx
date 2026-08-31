"use client";

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User as UserIcon,
  Calendar,
  List,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import {
  hasPermission,
  store,
  type Booking,
  type Equipment,
  type User,
  type Unit,
} from "@/lib/store";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { BookingDateTimeFields } from "@/components/booking-date-time-fields";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { CohortDetailDialog } from "@/components/cohort-detail-dialog";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { notifyRequestError } from "@/lib/feedback";
import type { Cohort } from "@/lib/store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

function isoToDate(d: string) {
  return new Date(d + "T00:00:00");
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

const STATUS_META: Record<
  string,
  { dot: string; badge: string; text: string; label: string }
> = {
  confirmado: {
    dot: "bg-djon-success",
    badge: "bg-djon-success/10 border-djon-success/20 text-djon-success",
    text: "text-djon-success",
    label: "Confirmado",
  },
  pendente: {
    dot: "bg-djon-light-purple",
    badge:
      "bg-djon-light-purple/10 border-djon-light-purple/20 text-djon-light-purple",
    text: "text-djon-light-purple",
    label: "Pendente",
  },
  cancelado: {
    dot: "bg-djon-warning-red",
    badge:
      "bg-djon-warning-red/10 border-djon-warning-red/20 text-djon-warning-red",
    text: "text-djon-warning-red",
    label: "Cancelado",
  },
};

type ViewMode = "month" | "week" | "list";
type FilterStatus = "todos" | "confirmado" | "pendente" | "cancelado";

interface BookingWithUser extends Booking {
  student: User | null;
}

function bookingDisplayName(booking: BookingWithUser) {
  if (booking.isClassLesson) {
    return booking.cohortName ?? booking.title ?? "Turma";
  }
  return booking.student?.name ?? booking.studentName ?? "Aluno";
}

const inp =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/60 transition-all";

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
  dot?: string;
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-djon-text/10 bg-djon-text/5 px-3 text-xs font-bold text-djon-text transition-all hover:brightness-110 sm:w-auto sm:min-w-[130px]"
      >
        {selected?.dot && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />
        )}
        <span className="flex-1 text-left">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={12}
          className={`text-djon-text/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="djon-scroll absolute right-0 top-full z-50 mt-1.5 max-h-[min(260px,calc(100svh-12rem))] w-[min(180px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-djon-text/10 bg-djon-surface-3 shadow-2xl"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-djon-text opacity-60 transition-opacity hover:opacity-100"
              >
                {opt.dot && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`}
                  />
                )}
                <span className="flex-1 text-left">{opt.label}</span>
                {value === opt.value && (
                  <Check size={11} className="text-djon-accent shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Booking Pill (calendar cells) ───────────────────────────────────────────

function BookingPill({
  bk,
  onClick,
}: {
  bk: BookingWithUser;
  onClick: () => void;
}) {
  const m = STATUS_META[bk.status];
  return (
    <button
      onClick={onClick}
      className="min-h-8 w-full cursor-pointer truncate rounded-lg border border-djon-text/8 bg-djon-text/5 px-2 py-1.5 text-left text-djon-label font-bold text-djon-text/60 transition-all hover:brightness-110"
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${m.dot}`}
      />
      {bk.time} {bookingDisplayName(bk)}
    </button>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({
  weekDays,
  bookings,
  today,
  onSelect,
}: {
  weekDays: Date[];
  bookings: BookingWithUser[];
  today: Date;
  onSelect: (b: BookingWithUser) => void;
}) {
  return (
    <div
      className="djon-scroll overflow-x-auto pb-2"
      style={{ touchAction: "pan-x pan-y" }}
    >
      <div className="min-w-[700px] md:min-w-0">
        <div className="grid grid-cols-8 border-b border-djon-text/8">
          <div className="py-3" />
          {weekDays.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div key={i} className="py-3 text-center">
                <p className="text-djon-text/30 text-djon-label font-bold">
                  {DAYS[d.getDay()]}
                </p>
                <p
                  className={`text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                    isToday ? "bg-djon-accent text-djon-ink" : "text-djon-text"
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        {HOURS.map((h) => (
          <div
            key={h}
            className="grid grid-cols-8 border-b border-djon-text/4 min-h-[56px]"
          >
            <div className="pr-3 pt-1 text-right text-djon-label text-djon-text/20 font-bold shrink-0">
              {String(h).padStart(2, "0")}:00
            </div>
            {weekDays.map((d, di) => {
              const dayBks = bookings.filter((b) => {
                const bd = isoToDate(b.date);
                const bh = parseTime(b.time);
                return sameDay(bd, d) && Math.floor(bh) === h;
              });
              return (
                <div
                  key={di}
                  className="border-l border-djon-text/4 px-1 pt-1 space-y-1"
                >
                  {dayBks.map((b) => (
                    <BookingPill
                      key={b.id}
                      bk={b}
                      onClick={() => onSelect(b)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  bookings,
  today,
  onSelect,
}: {
  year: number;
  month: number;
  bookings: BookingWithUser[];
  today: Date;
  onSelect: (b: BookingWithUser) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rowCount = cells.length / 7;
  const gridRef = useRef<HTMLDivElement>(null);
  const morePopoverRef = useRef<HTMLDivElement>(null);
  const [visibleSlots, setVisibleSlots] = useState(3);

  // Quick popover listing every booking of an overflowing day (Teams style)
  const [moreDay, setMoreDay] = useState<{
    date: Date;
    bks: BookingWithUser[];
    top: number;
    left: number;
    maxHeight: number;
    origin: string;
  } | null>(null);

  useEffect(() => {
    if (!moreDay) return;
    function closeOnPageScroll(e: Event) {
      const target = e.target as Node | null;
      if (target && morePopoverRef.current?.contains(target)) return;
      setMoreDay(null);
    }
    function closeOnResize() {
      setMoreDay(null);
    }
    window.addEventListener("scroll", closeOnPageScroll, true);
    window.addEventListener("resize", closeOnResize);
    return () => {
      window.removeEventListener("scroll", closeOnPageScroll, true);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [moreDay]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const updateVisibleSlots = () => {
      const rowHeight = el.clientHeight / rowCount;
      const availableForItems = Math.max(0, rowHeight - 44);
      const nextSlots = Math.max(1, Math.floor((availableForItems + 2) / 24));
      setVisibleSlots(Math.min(8, nextSlots));
    };

    updateVisibleSlots();
    const observer = new ResizeObserver(updateVisibleSlots);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rowCount]);

  const openMore = (
    e: ReactMouseEvent<HTMLButtonElement>,
    date: Date,
    bks: BookingWithUser[],
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = 280;
    const estimatedHeight = Math.min(340, 58 + bks.length * 38);
    const gutter = 12;
    const sideGap = 8;

    const spaceRight = window.innerWidth - rect.right - gutter;
    const spaceLeft = rect.left - gutter;
    let left =
      spaceRight >= width || spaceRight >= spaceLeft
        ? rect.right + sideGap
        : rect.left - width - sideGap;
    if (left < gutter) left = gutter;
    if (left + width > window.innerWidth - gutter)
      left = window.innerWidth - width - gutter;

    const spaceBelow = window.innerHeight - rect.top - gutter;
    const spaceAbove = rect.bottom - gutter;
    const openDown = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(
      180,
      Math.min(estimatedHeight, openDown ? spaceBelow : spaceAbove),
    );
    let top = openDown ? rect.top : rect.bottom - maxHeight;
    if (top < gutter) top = gutter;
    if (top + maxHeight > window.innerHeight - gutter)
      top = window.innerHeight - maxHeight - gutter;

    setMoreDay({
      date,
      bks,
      top,
      left,
      maxHeight,
      origin: openDown ? "top left" : "bottom left",
    });
  };

  return (
    <div
      className="djon-scroll overflow-x-auto pb-2"
      style={{ touchAction: "pan-x pan-y" }}
    >
      <div
        className="flex min-w-[760px] flex-col md:min-w-0"
        style={{ height: "clamp(520px, calc(100svh - 180px), 760px)" }}
      >
        <div className="grid grid-cols-7 mb-1 shrink-0">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-djon-label font-black text-djon-text/25 py-2 tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          className="grid grid-cols-7 gap-px bg-djon-text/5 rounded-2xl overflow-hidden border border-djon-text/8 flex-1"
          style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="bg-djon-calendar-empty" />;
            const cellDate = new Date(year, month, day);
            const isToday = sameDay(cellDate, today);
            const cellBks = bookings
              .filter((b) => sameDay(isoToDate(b.date), cellDate))
              .sort((a, b) => parseTime(a.time) - parseTime(b.time));
            const hasOverflow = cellBks.length > visibleSlots;
            const visibleCount = hasOverflow
              ? Math.max(0, visibleSlots - 1)
              : visibleSlots;
            const hiddenCount = cellBks.length - visibleCount;
            return (
              <div
                key={i}
                className={`bg-djon-calendar-cell p-2 overflow-hidden ${isToday ? "ring-1 ring-inset ring-djon-accent/40" : ""}`}
              >
                <p
                  className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday
                      ? "bg-djon-accent text-djon-ink"
                      : "text-djon-text/40"
                  }`}
                >
                  {day}
                </p>
                <div className="space-y-0.5">
                  {cellBks.slice(0, visibleCount).map((b) => (
                    <BookingPill
                      key={b.id}
                      bk={b}
                      onClick={() => onSelect(b)}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={(e) => openMore(e, cellDate, cellBks)}
                      className="cursor-pointer w-full h-[22px] rounded-lg bg-djon-text/5 border border-djon-text/8 text-djon-label text-djon-text/45 hover:brightness-110 font-black transition-all flex items-center justify-center"
                      aria-label={`Ver mais ${hiddenCount} agendamentos de ${day}`}
                    >
                      +{hiddenCount}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day popover — lists all bookings for the selected day */}
        <AnimatePresence>
          {moreDay && (
            <>
              {/* Click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreDay(null)}
              />
              <motion.div
                ref={morePopoverRef}
                className="fixed z-50 w-[280px] rounded-xl border border-djon-text/10 bg-djon-surface-3 shadow-2xl overflow-hidden flex flex-col"
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                style={{
                  top: moreDay.top,
                  left: moreDay.left,
                  maxHeight: moreDay.maxHeight,
                  transformOrigin: moreDay.origin,
                }}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                initial={{ opacity: 0, x: -6, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-djon-text/8 shrink-0">
                  <div>
                    <p className="text-djon-text text-sm font-black leading-none">
                      {moreDay.date.getDate()}{" "}
                      {MONTHS[moreDay.date.getMonth()].slice(0, 3)}
                    </p>
                    <p className="text-djon-text/30 text-djon-label font-bold tracking-widest uppercase mt-1">
                      {moreDay.bks.length} agendamento
                      {moreDay.bks.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setMoreDay(null)}
                    className="cursor-pointer text-djon-text opacity-30 transition-opacity hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div
                  className="djon-scroll overflow-y-auto overscroll-contain p-1.5 space-y-1"
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  data-lenis-prevent-touch="true"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {[...moreDay.bks]
                    .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                    .map((b) => {
                      const m = STATUS_META[b.status];
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            onSelect(b);
                            setMoreDay(null);
                          }}
                          className="cursor-pointer w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:brightness-110 transition-colors"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`}
                          />
                          <span className="text-djon-text/40 text-djon-meta font-black tabular-nums shrink-0">
                            {b.time}
                          </span>
                          <span className="text-djon-text text-xs font-bold truncate">
                            {bookingDisplayName(b)}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  bookings,
  onSelect,
}: {
  bookings: BookingWithUser[];
  onSelect: (b: BookingWithUser) => void;
}) {
  const sorted = [...bookings].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return da.getTime() - db.getTime();
  });
  const pagination = useListPagination(sorted);

  const groups: Record<string, BookingWithUser[]> = {};
  pagination.paginatedItems.forEach((b) => {
    if (!groups[b.date]) groups[b.date] = [];
    groups[b.date].push(b);
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar size={48} className="text-djon-text/10 mx-auto mb-4" />
        <p className="text-djon-text/20 text-sm font-bold">
          Nenhum agendamento encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, bks]) => {
        const d = isoToDate(date);
        const label = d.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        return (
          <div key={date}>
            <p className="text-djon-text/30 text-xs font-black tracking-widest uppercase mb-2 capitalize">
              {label}
            </p>
            <div className="space-y-2">
              {bks.map((b) => {
                const m = STATUS_META[b.status];
                return (
                  <motion.button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="cursor-pointer w-full text-left flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-3.5 transition-all hover:brightness-110"
                    whileHover={{ x: 4 }}
                  >
                    <div
                      className={`w-1 h-10 rounded-full shrink-0 ${m.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-djon-text text-sm font-black truncate">
                        {b.isClassLesson ? bookingDisplayName(b) : b.title}
                      </p>
                      <p className="text-djon-text/40 text-xs font-bold mt-0.5">
                        {b.time} — {b.type === "aula" ? "Aula" : "Treino"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-djon-text/50 text-xs font-bold">
                        {b.isClassLesson ? b.title : bookingDisplayName(b)}
                      </p>
                      <span
                        className={`text-djon-label font-black px-2 py-0.5 rounded-full border mt-1 inline-block ${m.badge}`}
                      >
                        {m.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
      <ListPagination
        totalItems={sorted.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<BookingWithUser | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    userId: "",
    title: "",
    date: "",
    time: "",
    type: "aula" as "aula" | "treino",
    status: "confirmado" as Booking["status"],
    notes: "",
    unitId: "",
    professorId: "",
    equipmentId: "",
    durationMinutes: 60,
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canEdit = hasPermission(currentUser, "bookings.manage");
  const canReview = hasPermission(currentUser, "bookings.review");

  const loadBookings = () => {
    const all = store.getBookings();
    const enriched: BookingWithUser[] = all.map((b) => ({
      ...b,
      student: store.getUserById(b.userId),
    }));
    setBookings(enriched);
    setStudents(
      store.getStudents().filter((student) => student.active !== false),
    );
    setProfessors(
      store.getProfessors().filter((professor) => professor.active !== false),
    );
    const activeUnits = store.getUnits().filter((unit) => unit.active);
    setUnits(activeUnits);
    setEquipments(
      store.getEquipments().filter((equipment) => equipment.active),
    );
    setNewForm((current) =>
      current.unitId
        ? current
        : { ...current, unitId: activeUnits[0]?.id ?? "" },
    );
  };

  useEffect(() => {
    let mounted = true;
    void store
      .bootstrap()
      .then((user) => {
        if (!mounted) return;
        if (!user) {
          router.replace("/login");
          return;
        }
        if (user.role === "student") {
          router.replace("/dashboard/student");
          return;
        }
        setCurrentUser(user);
        loadBookings();
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    setWeekStart(d);
  };

  // For list view: show all; for month/week: filter by window
  const visibleBookings = useMemo(() => {
    let bks = bookings;
    if (filterStatus !== "todos")
      bks = bks.filter((b) => b.status === filterStatus);

    if (view === "month") {
      bks = bks.filter((b) => {
        const d = isoToDate(b.date);
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth()
        );
      });
    } else if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      bks = bks.filter((b) => {
        const d = isoToDate(b.date);
        return d >= weekStart && d < end;
      });
    }
    return bks;
  }, [bookings, view, currentDate, weekStart, filterStatus]);

  const monthLabel = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const s = weekStart.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    const e = end.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    return `${s} – ${e}`;
  })();

  const handlePrev = () => {
    if (view === "month") prevMonth();
    else if (view === "week") prevWeek();
  };
  const handleNext = () => {
    if (view === "month") nextMonth();
    else if (view === "week") nextWeek();
  };

  const stats = {
    confirmado: bookings.filter((b) => b.status === "confirmado").length,
    pendente: bookings.filter((b) => b.status === "pendente").length,
  };

  const filterOptions: DropdownOption[] = [
    { value: "todos", label: "Todos" },
    { value: "confirmado", label: "Confirmados", dot: "bg-djon-success" },
    { value: "pendente", label: "Pendentes", dot: "bg-djon-light-purple" },
    { value: "cancelado", label: "Cancelados", dot: "bg-djon-warning-red" },
  ];

  const handleSaved = (updated: BookingWithUser) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelected(updated);
  };

  const handleSelectBooking = async (booking: BookingWithUser) => {
    if (!booking.isClassLesson || !booking.cohortId) {
      setSelected(booking);
      return;
    }
    try {
      const cohort = await store.fetchCohort(booking.cohortId);
      setSelectedLessonId(
        booking.lessonId ??
          cohort.lessons?.find((lesson) => lesson.bookingId === booking.id)?.id,
      );
      setSelectedCohort(cohort);
    } catch (error) {
      notifyRequestError(error);
    }
  };

  const openNewBooking = () => {
    const preferredUnitId =
      currentUser?.role === "professor" && currentUser.unitId
        ? currentUser.unitId
        : newForm.unitId || units[0]?.id || "";
    setNewForm((current) => ({
      ...current,
      date: "",
      time: "",
      unitId: preferredUnitId,
      professorId:
        currentUser?.role === "professor" &&
        currentUser.unitId === preferredUnitId
          ? currentUser.id
          : "",
      equipmentId: equipments.some(
        (equipment) =>
          equipment.id === current.equipmentId &&
          equipment.unitId === preferredUnitId,
      )
        ? current.equipmentId
        : "",
      durationMinutes: 60,
    }));
    setShowNewForm(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await store.addBooking(newForm);
    const student = store.getUserById(created.userId);
    setBookings((prev) => [...prev, { ...created, student }]);
    const preferredUnitId =
      currentUser?.role === "professor" && currentUser.unitId
        ? currentUser.unitId
        : (units[0]?.id ?? "");
    setNewForm({
      userId: "",
      title: "",
      date: "",
      time: "",
      type: "aula",
      status: "confirmado",
      notes: "",
      unitId: preferredUnitId,
      professorId: currentUser?.role === "professor" ? currentUser.id : "",
      equipmentId: "",
      durationMinutes: 60,
    });
    setShowNewForm(false);
  };

  if (loading) return <DashboardPageSkeleton variant="agenda" />;

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-djon-page">
      {/* Header */}
      <div className="relative z-30 shrink-0 border-b border-djon-text/8 bg-djon-page">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap">
          <div className="contents">
            {/* Left: title + nav */}
            <div className="order-1 flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:gap-3">
              {view !== "list" && (
                <>
                  <button
                    onClick={handlePrev}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-djon-text opacity-30 transition-opacity hover:opacity-100"
                    aria-label="Período anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Month/year picker */}
                  <div className="relative" ref={pickerRef}>
                    <button
                      onClick={() => {
                        setPickerYear(currentDate.getFullYear());
                        setPickerOpen((v) => !v);
                      }}
                      className="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 text-base font-black tracking-tight text-djon-text transition-colors hover:brightness-110 sm:min-w-[200px] sm:flex-none sm:text-lg"
                    >
                      {view === "week" ? weekLabel : monthLabel}
                      {view === "month" && (
                        <ChevronDown
                          size={14}
                          className={`text-djon-text/40 transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {pickerOpen && view === "month" && (
                        <motion.div
                          className="absolute left-1/2 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-djon-text/12 bg-djon-surface shadow-2xl"
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                        >
                          {/* Year row */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-djon-text/8">
                            <button
                              onClick={() => setPickerYear((y) => y - 1)}
                              className="cursor-pointer rounded-lg p-1 text-djon-text opacity-30 transition-opacity hover:opacity-100"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-djon-text font-black text-base tracking-tight">
                              {pickerYear}
                            </span>
                            <button
                              onClick={() => setPickerYear((y) => y + 1)}
                              className="cursor-pointer rounded-lg p-1 text-djon-text opacity-30 transition-opacity hover:opacity-100"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                          {/* Month grid */}
                          <div className="grid grid-cols-4 gap-1 p-3">
                            {MONTHS.map((name, idx) => {
                              const isSelected =
                                currentDate.getMonth() === idx &&
                                currentDate.getFullYear() === pickerYear;
                              const isCurrentMonth =
                                today.getMonth() === idx &&
                                today.getFullYear() === pickerYear;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setCurrentDate(
                                      new Date(pickerYear, idx, 1),
                                    );
                                    setPickerOpen(false);
                                  }}
                                  className={`cursor-pointer py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:opacity-80 ${
                                    isSelected
                                      ? "bg-djon-accent text-djon-ink"
                                      : isCurrentMonth
                                        ? "bg-djon-text/8 text-djon-text border border-djon-text/15"
                                        : "text-djon-text/40"
                                  }`}
                                >
                                  {name.slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleNext}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-djon-text opacity-30 transition-opacity hover:opacity-100"
                    aria-label="Próximo período"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={goToday}
                    className="ml-1 h-11 shrink-0 cursor-pointer rounded-lg border border-djon-text/10 px-3 text-xs font-bold text-djon-text/40 transition-opacity hover:opacity-70"
                  >
                    Hoje
                  </button>
                </>
              )}
              {view === "list" && (
                <span className="text-djon-text font-black text-lg tracking-tight">
                  Todos os agendamentos
                </span>
              )}
            </div>

            <div className="order-3 ml-auto flex shrink-0 items-center gap-2">
              <span className="text-djon-label font-black px-2.5 py-1 rounded-full bg-djon-success/10 text-djon-success">
                {stats.confirmado} confirmados
              </span>
              <span className="text-djon-label font-black px-2.5 py-1 rounded-full bg-djon-light-purple/10 text-djon-light-purple">
                {stats.pendente} pendentes
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="contents">
            <div className="order-4 grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 sm:ml-auto sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:justify-end">
              {/* Custom filter dropdown */}
              <CustomDropdown
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as FilterStatus)}
                options={filterOptions}
                placeholder="Filtrar"
              />

              {/* View switcher */}
              <div className="order-3 col-span-2 grid grid-cols-3 items-center gap-0.5 rounded-lg border border-djon-text/10 bg-djon-text/5 p-0.5 sm:order-none sm:col-auto sm:flex">
                {(
                  [
                    ["month", Calendar, "Visualização mensal"],
                    ["week", Clock, "Visualização semanal"],
                    ["list", List, "Visualização em lista"],
                  ] as const
                ).map(([v, Icon, label]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    title={v}
                    aria-label={label}
                    className={`flex h-11 cursor-pointer items-center justify-center rounded-md transition-all hover:opacity-80 sm:w-11 ${
                      view === v
                        ? "bg-djon-accent text-djon-ink"
                        : "text-djon-text/30"
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>

              {canEdit && (
                <button
                  onClick={openNewBooking}
                  className="order-2 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-djon-accent px-4 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:order-none"
                >
                  <Plus size={14} />
                  NOVO
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div
        className="djon-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          {view === "month" && (
            <MonthView
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              bookings={visibleBookings}
              today={today}
              onSelect={(booking) => void handleSelectBooking(booking)}
            />
          )}
          {view === "week" && (
            <WeekView
              weekDays={weekDays}
              bookings={visibleBookings}
              today={today}
              onSelect={(booking) => void handleSelectBooking(booking)}
            />
          )}
          {view === "list" && (
            <ListView
              bookings={visibleBookings}
              onSelect={(booking) => void handleSelectBooking(booking)}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) =>
              e.target === e.currentTarget && setShowNewForm(false)
            }
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-djon-accent text-xs font-black tracking-widest uppercase mb-1">
                    NOVO
                  </p>
                  <h2 className="text-xl font-black text-djon-text tracking-tighter">
                    Agendamento
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    TIPO
                  </label>
                  <div className="flex gap-2">
                    {(["aula", "treino"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setNewForm({
                            ...newForm,
                            type,
                            professorId:
                              type === "aula" &&
                              currentUser?.role === "professor" &&
                              currentUser.unitId === newForm.unitId
                                ? currentUser.id
                                : "",
                            date: "",
                            time: "",
                          })
                        }
                        className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all hover:opacity-80 ${
                          newForm.type === type
                            ? "bg-djon-accent text-djon-ink"
                            : "bg-djon-text/5 text-djon-text/50 border border-djon-text/10"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    UNIDADE
                  </label>
                  <DjonSelect
                    required
                    value={newForm.unitId}
                    onChange={(unitId) =>
                      setNewForm({
                        ...newForm,
                        unitId,
                        professorId:
                          newForm.type === "aula" &&
                          currentUser?.role === "professor" &&
                          currentUser.unitId === unitId
                            ? currentUser.id
                            : "",
                        equipmentId: "",
                        date: "",
                        time: "",
                      })
                    }
                    options={units.map((unit) => ({
                      value: unit.id,
                      label: unit.label,
                    }))}
                    placeholder="Selecionar unidade..."
                  />
                </div>
                {newForm.type === "aula" && (
                  <div>
                    <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                      PROFESSOR
                    </label>
                    <DjonSelect
                      required
                      value={newForm.professorId}
                      onChange={(professorId) =>
                        setNewForm({
                          ...newForm,
                          professorId,
                          date: "",
                          time: "",
                        })
                      }
                      options={professors
                        .filter(
                          (professor) => professor.unitId === newForm.unitId,
                        )
                        .map((professor) => ({
                          value: professor.id,
                          label: professor.name,
                        }))}
                      placeholder="Selecionar professor..."
                    />
                  </div>
                )}
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    EQUIPAMENTO
                  </label>
                  <DjonSelect
                    required
                    value={newForm.equipmentId}
                    onChange={(equipmentId) =>
                      setNewForm({
                        ...newForm,
                        equipmentId,
                        date: "",
                        time: "",
                      })
                    }
                    options={equipments
                      .filter(
                        (equipment) => equipment.unitId === newForm.unitId,
                      )
                      .map((equipment) => ({
                        value: equipment.id,
                        label: equipment.name,
                      }))}
                    placeholder={
                      newForm.unitId
                        ? "Selecionar equipamento..."
                        : "Selecione a unidade primeiro"
                    }
                    disabled={!newForm.unitId}
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    ALUNO
                  </label>
                  <DjonSelect
                    required
                    value={newForm.userId}
                    onChange={(userId) => setNewForm({ ...newForm, userId })}
                    options={students.map((student) => ({
                      value: student.id,
                      label: student.name,
                    }))}
                    placeholder="Selecionar aluno..."
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    TÍTULO
                  </label>
                  <input
                    required
                    value={newForm.title}
                    onChange={(e) =>
                      setNewForm({ ...newForm, title: e.target.value })
                    }
                    placeholder="Ex: Aula de Beat Match"
                    className={inp}
                  />
                </div>
                <BookingDateTimeFields
                  type={newForm.type}
                  unitId={newForm.unitId}
                  professorId={newForm.professorId}
                  equipmentId={newForm.equipmentId}
                  date={newForm.date}
                  time={newForm.time}
                  durationMinutes={newForm.durationMinutes}
                  onDateChange={(date) =>
                    setNewForm((current) => ({ ...current, date }))
                  }
                  onTimeChange={(time) =>
                    setNewForm((current) => ({ ...current, time }))
                  }
                  onDurationChange={(durationMinutes) =>
                    setNewForm((current) => ({ ...current, durationMinutes }))
                  }
                />
                <p className="rounded-xl border border-djon-success/15 bg-djon-success/5 px-3 py-2.5 text-xs font-bold text-djon-success/80">
                  Agendamentos criados por professores e administradores são
                  confirmados automaticamente.
                </p>
                <div>
                  <label className="text-djon-text/40 text-djon-label font-black tracking-widest block mb-1.5">
                    OBSERVAÇÕES
                  </label>
                  <textarea
                    value={newForm.notes}
                    onChange={(e) =>
                      setNewForm({ ...newForm, notes: e.target.value })
                    }
                    rows={2}
                    className={`${inp} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    !newForm.userId ||
                    !newForm.title.trim() ||
                    !newForm.unitId ||
                    !newForm.equipmentId ||
                    (newForm.type === "aula" && !newForm.professorId) ||
                    !newForm.date ||
                    !newForm.time
                  }
                  className="cursor-pointer w-full bg-djon-accent text-djon-ink rounded-xl py-3 text-sm font-black tracking-widest transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  AGENDAR
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail / Edit modal */}
      <AnimatePresence>
        {selected && (
          <BookingDetailsDialog
            bk={selected}
            canEdit={canEdit}
            canReview={canReview}
            units={units}
            professors={professors}
            equipments={equipments}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
            onRemoved={loadBookings}
          />
        )}
      </AnimatePresence>

      {selectedCohort && (
        <CohortDetailDialog
          cohort={selectedCohort}
          currentUser={currentUser}
          focusedLessonId={selectedLessonId}
          onClose={() => {
            setSelectedCohort(null);
            setSelectedLessonId(undefined);
          }}
          onUpdated={setSelectedCohort}
        />
      )}
    </div>
  );
}
