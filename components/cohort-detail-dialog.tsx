"use client";

import Link from "next/link";
import { CalendarDays, Clock3, Lock, ShieldCheck, Unlock, X } from "lucide-react";
import { notifyRequestError } from "@/lib/feedback";
import { store, type Cohort, type User } from "@/lib/store";

type CohortDetailDialogProps = {
  cohort: Cohort;
  currentUser: User | null;
  focusedLessonId?: string;
  onClose: () => void;
  onUpdated: (cohort: Cohort) => void;
  onConfigure?: (cohort: Cohort) => void;
};

export function canManageCohort(user: User | null, cohort: Cohort) {
  return Boolean(
    user &&
      (user.role === "admin" ||
        (user.role === "professor" && cohort.professorId === user.id)),
  );
}

export function CohortDetailDialog({
  cohort,
  currentUser,
  focusedLessonId,
  onClose,
  onUpdated,
  onConfigure,
}: CohortDetailDialogProps) {
  const mayManage = canManageCohort(currentUser, cohort);
  const lessons = focusedLessonId
    ? cohort.lessons?.filter((lesson) => lesson.id === focusedLessonId)
    : cohort.lessons;

  const toggleAttendance = async (
    lessonId: string,
    studentId: string,
    kind: "present" | "materialReleased",
    current: boolean,
  ) => {
    if (!mayManage) return;
    try {
      const updated = await store.updateLessonAttendance(lessonId, {
        studentId,
        [kind]: !current,
      });
      onUpdated(updated);
    } catch (error) {
      notifyRequestError(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/85 p-4 backdrop-blur-sm">
      <div className="my-5 w-full max-w-4xl rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black text-djon-accent">
              {cohort.courseName}
            </p>
            <h2 className="text-2xl font-black text-djon-text">
              {cohort.name}
            </h2>
            <p className="mt-1 text-xs text-djon-text/40">
              {cohort.professorName} · {cohort.unitLabel} · {cohort.equipmentName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} className="text-djon-text/40" />
          </button>
        </div>

        {cohort.status === "configuracao" && mayManage && onConfigure && (
          <button
            type="button"
            onClick={() => onConfigure(cohort)}
            className="mt-5 rounded-xl bg-djon-accent px-4 py-3 text-xs font-black text-djon-ink"
          >
            CONFIGURAR AULAS
          </button>
        )}

        {currentUser?.role === "professor" && !mayManage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-djon-text/10 bg-djon-text/3 px-4 py-3 text-xs text-djon-text/45">
            <ShieldCheck size={15} className="shrink-0 text-djon-accent" />
            Visualização liberada. Presença e material são gerenciados pelo professor responsável.
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
                      <CalendarDays size={12} /> {lesson.date}
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
                    <div
                      key={attendance.studentId}
                      className="flex flex-col gap-2 rounded-lg bg-djon-black/15 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-xs font-bold text-djon-text/60">
                        {attendance.studentName}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!mayManage}
                          aria-pressed={attendance.present}
                          onClick={() =>
                            void toggleAttendance(
                              lesson.id,
                              attendance.studentId,
                              "present",
                              attendance.present,
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-black disabled:cursor-default ${attendance.present ? "border-djon-accent/30 bg-djon-accent/10 text-djon-accent" : "border-djon-text/10 text-djon-text/35"}`}
                        >
                          PRESENÇA
                        </button>
                        <button
                          type="button"
                          disabled={!mayManage}
                          aria-pressed={attendance.materialReleased}
                          onClick={() =>
                            void toggleAttendance(
                              lesson.id,
                              attendance.studentId,
                              "materialReleased",
                              attendance.materialReleased,
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-black disabled:cursor-default ${attendance.materialReleased ? "border-djon-light-purple/30 bg-djon-light-purple/10 text-djon-light-purple" : "border-djon-text/10 text-djon-text/35"}`}
                        >
                          MATERIAL
                        </button>
                      </div>
                    </div>
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
    </div>
  );
}
