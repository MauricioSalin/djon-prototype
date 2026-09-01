"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Lock,
  MessageSquareText,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { notifyRequestError, notifySuccess } from "@/lib/feedback";
import { hasPermission, store, type Cohort, type User } from "@/lib/store";

const ACCORDION_EASE = [0.22, 1, 0.36, 1] as const;

type CohortDetailViewProps = {
  cohort: Cohort;
  currentUser: User | null;
  focusedLessonId?: string;
  onBack: () => void;
  onUpdated: (cohort: Cohort) => void;
  onConfigure?: (cohort: Cohort) => void;
  onEdit?: (cohort: Cohort) => void;
  onDelete?: (cohort: Cohort) => void;
  variant?: "inline" | "dialog";
};

type CohortDetailDialogProps = Omit<
  CohortDetailViewProps,
  "onBack" | "variant"
> & {
  onClose: () => void;
};

type AttendanceDraft = {
  lessonId: string;
  studentId: string;
  present: boolean;
  materialReleased: boolean;
  observation: string;
};

function attendanceKey(lessonId: string, studentId: string) {
  return `${lessonId}:${studentId}`;
}

function formatLessonDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}

function attendanceDraftFor(
  lessons: NonNullable<Cohort["lessons"]> | undefined,
) {
  return Object.fromEntries(
    (lessons ?? []).flatMap((lesson) =>
      (lesson.attendance ?? []).map((attendance) => [
        attendanceKey(lesson.id, attendance.studentId),
        {
          lessonId: lesson.id,
          studentId: attendance.studentId,
          present: attendance.present,
          materialReleased: attendance.materialReleased,
          observation: attendance.observation ?? "",
        } satisfies AttendanceDraft,
      ]),
    ),
  ) as Record<string, AttendanceDraft>;
}

export function canManageCohort(user: User | null, cohort: Cohort) {
  return Boolean(
    user &&
      (user.role === "admin" ||
        hasPermission(user, "courses.manage") ||
        (user.role === "professor" && cohort.professorId === user.id)),
  );
}

export function CohortDetailView({
  cohort,
  currentUser,
  focusedLessonId,
  onBack,
  onUpdated,
  onConfigure,
  onEdit,
  onDelete,
  variant = "inline",
}: CohortDetailViewProps) {
  const mayConfigure = canManageCohort(currentUser, cohort);
  const mayManage = Boolean(
    mayConfigure || hasPermission(currentUser, "attendance.manage"),
  );
  const prefersReducedMotion = useReducedMotion();
  const lessons = useMemo(
    () =>
      focusedLessonId
        ? cohort.lessons?.filter((lesson) => lesson.id === focusedLessonId)
        : cohort.lessons,
    [cohort.lessons, focusedLessonId],
  );
  const initialAttendance = useMemo(
    () => attendanceDraftFor(lessons),
    [lessons],
  );
  const [attendanceDraft, setAttendanceDraft] =
    useState<Record<string, AttendanceDraft>>(initialAttendance);
  const [expandedObservation, setExpandedObservation] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAttendanceDraft(initialAttendance);
  }, [initialAttendance]);

  const hasChanges = Object.entries(attendanceDraft).some(([key, draft]) => {
    const initial = initialAttendance[key];
    return (
      initial &&
      (initial.present !== draft.present ||
        initial.materialReleased !== draft.materialReleased ||
        initial.observation !== draft.observation)
    );
  });

  const toggleAttendance = async (
    lessonId: string,
    studentId: string,
    kind: "present" | "materialReleased",
  ) => {
    if (!mayManage) return;
    const key = attendanceKey(lessonId, studentId);
    const attendance = attendanceDraft[key];
    if (!attendance) return;

    if (variant === "dialog") {
      setSaving(true);
      try {
        const updated = await store.updateLessonAttendance(lessonId, {
          studentId,
          [kind]: !attendance[kind],
        });
        onUpdated(updated);
      } catch (error) {
        notifyRequestError(error);
      } finally {
        setSaving(false);
      }
      return;
    }

    setAttendanceDraft((current) => {
      const currentAttendance = current[key];
      if (!currentAttendance) return current;
      const nextValue = !currentAttendance[kind];
      return {
        ...current,
        [key]: {
          ...currentAttendance,
          [kind]: nextValue,
          ...(kind === "present" && nextValue
            ? { materialReleased: true }
            : {}),
        },
      };
    });
  };

  const updateObservation = (
    lessonId: string,
    studentId: string,
    observation: string,
  ) => {
    if (!mayManage) return;
    const key = attendanceKey(lessonId, studentId);
    setAttendanceDraft((current) => ({
      ...current,
      [key]: { ...current[key], observation },
    }));
  };

  const saveSingleObservation = async (draft: AttendanceDraft) => {
    if (!mayManage || saving) return;
    setSaving(true);
    try {
      const updated = await store.updateLessonAttendance(draft.lessonId, {
        studentId: draft.studentId,
        observation: draft.observation,
      });
      onUpdated(updated);
      notifySuccess("Observação salva", "O registro do aluno foi atualizado.");
    } catch (error) {
      notifyRequestError(error);
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    if (!mayManage || !hasChanges || saving) return;
    setSaving(true);
    try {
      let updated = cohort;
      for (const [key, draft] of Object.entries(attendanceDraft)) {
        const initial = initialAttendance[key];
        if (!initial) continue;

        if (initial.present !== draft.present) {
          updated = await store.updateLessonAttendance(draft.lessonId, {
            studentId: draft.studentId,
            present: draft.present,
          });
        }

        const persistedAttendance = updated.lessons
          ?.find((lesson) => lesson.id === draft.lessonId)
          ?.attendance?.find(
            (attendance) => attendance.studentId === draft.studentId,
          );
        if (
          persistedAttendance?.materialReleased !== draft.materialReleased
        ) {
          updated = await store.updateLessonAttendance(draft.lessonId, {
            studentId: draft.studentId,
            materialReleased: draft.materialReleased,
          });
        }

        const latestAttendance = updated.lessons
          ?.find((lesson) => lesson.id === draft.lessonId)
          ?.attendance?.find(
            (attendance) => attendance.studentId === draft.studentId,
          );
        if ((latestAttendance?.observation ?? "") !== draft.observation) {
          updated = await store.updateLessonAttendance(draft.lessonId, {
            studentId: draft.studentId,
            observation: draft.observation,
          });
        }
      }
      onUpdated(updated);
      notifySuccess(
        "Turma atualizada",
        "Presença, material e observações foram salvos.",
      );
    } catch (error) {
      notifyRequestError(error);
    } finally {
      setSaving(false);
    }
  };

  const renderInlineActions = (showCohortActions = false) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-djon-text/10 px-4 text-xs font-black text-djon-text/55 transition-colors hover:border-djon-accent/30 hover:text-djon-text"
      >
        <ChevronLeft size={15} /> VOLTAR
      </button>
      <div className="flex items-center gap-2">
        {showCohortActions && mayConfigure && onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(cohort)}
            aria-label={`Editar turma ${cohort.name}`}
            title="Editar turma"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-djon-accent/25 bg-djon-accent/10 text-djon-accent transition-[filter] hover:brightness-110"
          >
            <Pencil size={15} />
          </button>
        ) : null}
        {showCohortActions && mayConfigure && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(cohort)}
            aria-label={`Excluir turma ${cohort.name}`}
            title="Excluir turma"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-djon-warning-red/25 bg-djon-warning-red/10 text-djon-warning-red transition-[filter] hover:brightness-110"
          >
            <Trash2 size={15} />
          </button>
        ) : null}
        {mayManage && (
          <button
            type="button"
            onClick={() => void saveAttendance()}
            disabled={!hasChanges || saving}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-djon-accent px-5 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={14} /> {saving ? "SALVANDO..." : "SALVAR"}
          </button>
        )}
      </div>
    </div>
  );

  const content = (
    <>
      {variant === "inline" && renderInlineActions(true)}

      <div
        className={
          variant === "dialog"
            ? "w-full rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:p-6"
            : "w-full"
        }
      >
        {variant === "dialog" && (
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black text-djon-accent">
                {cohort.courseName}
              </p>
              <h2 className="text-2xl font-black text-djon-text">
                {cohort.name}
              </h2>
              <p className="mt-1 text-xs text-djon-text/40">
                {cohort.professorName} · {cohort.unitLabel} ·{" "}
                {cohort.equipmentName}
              </p>
            </div>
            <button type="button" onClick={onBack} aria-label="Fechar">
              <X size={18} className="text-djon-text/40" />
            </button>
          </div>
        )}

        {cohort.status === "configuracao" && mayConfigure && onConfigure && (
          <button
            type="button"
            onClick={() => onConfigure(cohort)}
            className={`${variant === "dialog" ? "mt-5" : ""} rounded-xl bg-djon-accent px-4 py-3 text-xs font-black text-djon-ink`}
          >
            CONFIGURAR AULAS
          </button>
        )}

        {currentUser?.role === "professor" && !mayManage && (
          <div
            className={`${variant === "dialog" ? "mt-5" : ""} flex items-center gap-2 rounded-xl border border-djon-text/10 bg-djon-text/3 px-4 py-3 text-xs text-djon-text/45`}
          >
            <ShieldCheck size={15} className="shrink-0 text-djon-accent" />
            Visualização liberada. Presença, material e observações são gerenciados pelo professor responsável.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {lessons?.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-xl border border-djon-text/8 bg-djon-text/3 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-djon-accent">
                    AULA {lesson.order}
                  </p>
                  <h3 className="font-black text-djon-text">{lesson.title}</h3>
                  <p className="mt-1 flex items-center gap-3 text-xs text-djon-text/35">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} /> {formatLessonDate(lesson.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 size={12} /> {lesson.time}
                    </span>
                  </p>
                </div>
                {currentUser?.role === "student" &&
                  (lesson.locked ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-djon-text/10 px-3 py-1.5 text-[10px] font-black text-djon-text/35">
                      <Lock size={11} /> BLOQUEADO
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/material/${lesson.materialId}`}
                      className="flex items-center gap-1.5 rounded-full bg-djon-accent px-3 py-1.5 text-[10px] font-black text-djon-ink"
                    >
                      <Unlock size={11} /> ABRIR MATERIAL
                    </Link>
                  ))}
              </div>

              {lesson.attendance && (
                <div className="mt-4 space-y-2 border-t border-djon-text/8 pt-4">
                  {lesson.attendance.map((attendance) => (
                    (() => {
                      const draft =
                        attendanceDraft[
                          attendanceKey(lesson.id, attendance.studentId)
                        ] ?? attendance;
                      return (
                        <div
                          key={attendance.studentId}
                          className={`overflow-hidden rounded-lg border bg-djon-black/15 transition-colors ${draft.present ? "border-djon-accent/30" : "border-transparent"}`}
                        >
                          <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              aria-expanded={
                                expandedObservation ===
                                attendanceKey(lesson.id, attendance.studentId)
                              }
                              aria-controls={`observation-${lesson.id}-${attendance.studentId}`}
                              onClick={() => {
                                const key = attendanceKey(
                                  lesson.id,
                                  attendance.studentId,
                                );
                                setExpandedObservation((current) =>
                                  current === key ? null : key,
                                );
                              }}
                              className="group/name -m-2 flex min-h-10 flex-1 cursor-pointer items-center gap-2 p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djon-accent/70"
                            >
                              <span
                                className={`text-xs font-bold transition-colors group-hover/name:text-djon-accent ${draft.present ? "text-djon-accent" : "text-djon-text/60"}`}
                              >
                                {attendance.studentName}
                              </span>
                              {draft.observation.trim() && (
                                <MessageSquareText
                                  size={14}
                                  className="shrink-0 text-djon-light-purple"
                                  aria-label="Aluno com observação"
                                />
                              )}
                              <motion.span
                                aria-hidden="true"
                                animate={{
                                  rotate:
                                    expandedObservation ===
                                    attendanceKey(
                                      lesson.id,
                                      attendance.studentId,
                                    )
                                      ? 180
                                      : 0,
                                }}
                                transition={{
                                  duration: prefersReducedMotion ? 0 : 0.4,
                                  ease: ACCORDION_EASE,
                                }}
                                className="ml-auto flex shrink-0 text-djon-text/30"
                              >
                                <ChevronDown size={14} />
                              </motion.span>
                            </button>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={!mayManage || saving}
                                aria-pressed={draft.present}
                                onClick={() =>
                                  void toggleAttendance(
                                    lesson.id,
                                    attendance.studentId,
                                    "present",
                                  )
                                }
                                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-black transition-[background-color,border-color,color,filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djon-accent/70 disabled:cursor-default disabled:hover:brightness-100 ${draft.present ? "border-djon-accent/30 bg-djon-accent/10 text-djon-accent" : "border-djon-text/10 text-djon-text/35 hover:border-djon-accent/30 hover:bg-djon-accent/10 hover:text-djon-accent"}`}
                              >
                                PRESENÇA
                              </button>
                              <button
                                type="button"
                                disabled={!mayManage || saving}
                                aria-pressed={draft.materialReleased}
                                onClick={() =>
                                  void toggleAttendance(
                                    lesson.id,
                                    attendance.studentId,
                                    "materialReleased",
                                  )
                                }
                                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-black transition-[background-color,border-color,color,filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djon-accent/70 disabled:cursor-default disabled:hover:brightness-100 ${draft.materialReleased ? "border-djon-light-purple/30 bg-djon-light-purple/10 text-djon-light-purple" : "border-djon-text/10 text-djon-text/35 hover:border-djon-light-purple/30 hover:bg-djon-light-purple/10 hover:text-djon-light-purple"}`}
                              >
                                MATERIAL
                              </button>
                            </div>
                          </div>
                          <AnimatePresence initial={false}>
                            {expandedObservation ===
                              attendanceKey(
                                lesson.id,
                                attendance.studentId,
                              ) && (
                              <motion.div
                                key={`observation-${lesson.id}-${attendance.studentId}`}
                                id={`observation-${lesson.id}-${attendance.studentId}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  height: {
                                    duration: prefersReducedMotion ? 0 : 0.52,
                                    ease: ACCORDION_EASE,
                                  },
                                  opacity: {
                                    duration: prefersReducedMotion ? 0 : 0.34,
                                    ease: "easeOut",
                                  },
                                }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-djon-text/8 px-3 pb-3 pt-3">
                              <label className="mb-2 block text-[10px] font-black tracking-widest text-djon-text/35">
                                OBSERVAÇÃO DO ALUNO
                              </label>
                              <textarea
                                value={draft.observation}
                                onChange={(event) =>
                                  updateObservation(
                                    lesson.id,
                                    attendance.studentId,
                                    event.target.value,
                                  )
                                }
                                readOnly={!mayManage}
                                maxLength={2000}
                                rows={4}
                                placeholder="Descreva dificuldades, evolução, pontos de atenção ou orientações para as próximas aulas."
                                className="w-full resize-y rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 py-3 text-sm leading-relaxed text-djon-text outline-none transition-colors placeholder:text-djon-text/20 focus:border-djon-accent/45 read-only:cursor-default read-only:text-djon-text/60"
                              />
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="text-[10px] font-bold text-djon-text/25">
                                  {draft.observation.length}/2000
                                </span>
                                {mayManage && variant === "dialog" && (
                                  <button
                                    type="button"
                                    disabled={
                                      saving ||
                                      initialAttendance[
                                        attendanceKey(
                                          lesson.id,
                                          attendance.studentId,
                                        )
                                      ]?.observation === draft.observation
                                    }
                                    onClick={() =>
                                      void saveSingleObservation(draft)
                                    }
                                    className="rounded-full bg-djon-accent px-4 py-2 text-[10px] font-black text-djon-ink disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    SALVAR OBSERVAÇÃO
                                  </button>
                                )}
                              </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()
                  ))}
                </div>
              )}
            </article>
          ))}

          {!lessons?.length && (
            <div className="rounded-xl border-2 border-dashed border-djon-text/10 px-5 py-10 text-center text-sm text-djon-text/35">
              Nenhuma aula configurada nesta turma.
            </div>
          )}
        </div>
      </div>
      {variant === "inline" && renderInlineActions()}
    </>
  );

  return variant === "dialog" ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/85 p-4 backdrop-blur-sm">
      <div className="my-5 w-full max-w-4xl">{content}</div>
    </div>
  ) : (
    <section className="space-y-5">{content}</section>
  );
}

export function CohortDetailDialog({
  onClose,
  ...props
}: CohortDetailDialogProps) {
  return (
    <CohortDetailView
      {...props}
      onBack={onClose}
      variant="dialog"
    />
  );
}
