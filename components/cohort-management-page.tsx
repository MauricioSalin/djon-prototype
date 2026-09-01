"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Pencil,
  GraduationCap,
  Search,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  canManageCohort,
  CohortDetailView,
} from "@/components/cohort-detail-dialog";
import { DjonSelect } from "@/components/djon-select";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { EditablePortalHero } from "@/components/portal/editable-portal-hero";
import {
  COURSES_HERO_SECTIONS,
  STAFF_COURSES_HERO,
  STUDENT_COURSES_HERO,
} from "@/lib/portal-hero-groups";
import {
  ApiError,
  hasPermission,
  store,
  type Cohort,
  type CohortScheduleConflict,
  type Course,
  type Material,
  type User,
} from "@/lib/store";
import { notifyError, notifyRequestError } from "@/lib/feedback";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent/50";
const durationOptions = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h30" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.15 },
  transition: {
    duration: 0.55,
    ease: [0.25, 0.4, 0.25, 1] as const,
    delay,
  },
});

type CohortForm = {
  name: string;
  courseId: string;
  unitId: string;
  professorId: string;
  equipmentId: string;
  studentIds: string[];
  lessonCount: number;
  durationMinutes: number;
};

type LessonForm = { materialId: string; date: string; time: string };
type StudentFilter = "all" | "selected" | "unselected";
type CohortStatusFilter = "all" | Cohort["status"];

const emptyCohort: CohortForm = {
  name: "",
  courseId: "",
  unitId: "",
  professorId: "",
  equipmentId: "",
  studentIds: [],
  lessonCount: 0,
  durationMinutes: 60,
};

function personLabel(user: Pick<User, "name" | "projectName">) {
  return user.projectName ? `${user.projectName} — ${user.name}` : user.name;
}

function formatConflictDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function CourseArtwork({ course }: { course?: Course }) {
  const [imageError, setImageError] = useState(false);

  if (course?.coverImage && !imageError) {
    return (
      <Image
        loader={({ src }) => src}
        unoptimized
        src={course.coverImage}
        alt={`Capa do curso ${course.name}`}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-djon-surface to-djon-muted-panel">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-djon-accent/10">
        <GraduationCap size={27} className="text-djon-accent" />
      </div>
    </div>
  );
}

function CohortCard({
  cohort,
  course,
  showProgress,
  index,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: {
  cohort: Cohort;
  course?: Course;
  showProgress: boolean;
  index: number;
  canManage?: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const statusLabel =
    cohort.status === "ativa"
      ? "ATIVA"
      : cohort.status === "concluida"
        ? "CONCLUÍDA"
        : "EM CONFIGURAÇÃO";

  return (
    <motion.article
      className="group relative overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2 text-left transition-all hover:border-djon-accent/30 hover:brightness-105 focus-within:ring-2 focus-within:ring-djon-accent/70"
      {...fadeUp(index * 0.05)}
      whileHover={{ y: -4 }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir turma ${cohort.name}`}
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none"
      />
      <div className="relative h-40 overflow-hidden bg-djon-muted-panel">
        <CourseArtwork course={course} />
        <div className="absolute inset-0 bg-gradient-to-t from-djon-black/75 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5">
          {canManage ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Editar turma ${cohort.name}`}
                title="Editar turma"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-page/80 text-djon-accent backdrop-blur-sm transition-[filter] hover:brightness-110"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Excluir turma ${cohort.name}`}
                title="Excluir turma"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-page/80 text-djon-warning-red backdrop-blur-sm transition-[filter] hover:brightness-110"
              >
                <Trash2 size={12} />
              </button>
            </>
          ) : null}
          <span className="rounded-full border border-djon-text/10 bg-djon-page/80 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-text/60 backdrop-blur-sm">
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-black text-djon-accent">
          {cohort.courseName ?? course?.name ?? "Curso"}
        </p>
        <h3 className="mt-1 text-xl font-black tracking-tight text-djon-text">
          {cohort.name}
        </h3>
        <p className="mt-2 text-xs text-djon-text/40">
          {[cohort.professorName, cohort.unitLabel].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-djon-text/8">
          <div
            className="h-full rounded-full bg-djon-accent"
            style={{ width: `${cohort.progress.percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[11px] font-bold text-djon-text/35">
          <span>
            {cohort.lessonCount} aulas · {cohort.durationMinutes} min
          </span>
          {showProgress ? <span>{cohort.progress.percent}%</span> : null}
        </div>
      </div>
    </motion.article>
  );
}

export function CohortManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortModal, setCohortModal] = useState(false);
  const [cohortStep, setCohortStep] = useState<1 | 2>(1);
  const [cohortForm, setCohortForm] = useState<CohortForm>(emptyCohort);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [cohortSearch, setCohortSearch] = useState("");
  const [cohortStatus, setCohortStatus] =
    useState<CohortStatusFilter>("all");
  const [newCohort, setNewCohort] = useState<CohortForm | null>(null);
  const [configuring, setConfiguring] = useState<Cohort | null>(null);
  const [lessonForms, setLessonForms] = useState<LessonForm[]>([]);
  const [scheduleConflicts, setScheduleConflicts] = useState<
    CohortScheduleConflict[]
  >([]);
  const [detail, setDetail] = useState<Cohort | null>(null);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCohort, setDeletingCohort] = useState<Cohort | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreateCohort = user?.role === "admin" || user?.role === "professor";
  const canManageAllCourses = hasPermission(user, "courses.manage");
  const users = store.getUsers();
  const units = store.getUnits().filter((unit) => unit.active);
  const equipments = store
    .getEquipments()
    .filter((equipment) => equipment.active);

  const load = useCallback(async () => {
    const current = await store.bootstrap();
    if (!current) return;
    const [availableCourses, availableCohorts] = await Promise.all([
      store.listCourses(false),
      store.listCohorts(),
      current.role === "student"
        ? Promise.resolve(store.getUsers())
        : store.listAdminUsers(false),
    ]);
    setUser(current);
    setCourses(availableCourses);
    setCohorts(availableCohorts);
    setMaterials(store.getMaterials());
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const openCohort = () => {
    if (!user) return;
    const unitId =
      user.role === "professor" && !canManageAllCourses
        ? (user.unitId ?? "")
        : (units.find((unit) => unit.key === "poa")?.id ?? units[0]?.id ?? "");
    setCohortForm({
      ...emptyCohort,
      courseId: courses.find((course) => course.active)?.id ?? "",
      unitId,
      professorId:
        user.role === "professor" && !canManageAllCourses ? user.id : "",
      equipmentId:
        equipments.find((equipment) => equipment.unitId === unitId)?.id ?? "",
    });
    setCohortStep(1);
    setStudentSearch("");
    setStudentFilter("all");
    setCohortModal(true);
  };

  const closeCohortModal = () => {
    setCohortModal(false);
    setCohortStep(1);
    setStudentSearch("");
    setStudentFilter("all");
  };

  const professors = users.filter(
    (person) =>
      person.role === "professor" &&
      person.active !== false &&
      (!cohortForm.unitId || person.unitId === cohortForm.unitId),
  );
  const students = users.filter(
    (person) =>
      person.role === "student" &&
      person.active !== false &&
      (!cohortForm.unitId || person.unitId === cohortForm.unitId),
  );
  const normalizedStudentSearch = studentSearch
    .trim()
    .toLocaleLowerCase("pt-BR");
  const visibleStudents = students.filter((student) => {
    const selected = cohortForm.studentIds.includes(student.id);
    const matchesFilter =
      studentFilter === "all" ||
      (studentFilter === "selected" && selected) ||
      (studentFilter === "unselected" && !selected);
    const matchesSearch =
      !normalizedStudentSearch ||
      [student.name, student.projectName, student.email].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(normalizedStudentSearch),
      );
    return matchesFilter && matchesSearch;
  });
  const unitEquipments = equipments.filter(
    (equipment) => equipment.unitId === cohortForm.unitId,
  );
  const lessonConfiguration = newCohort ?? configuring;
  const courseMaterials = useMemo(
    () =>
      materials.filter(
        (material) =>
          material.courseId === lessonConfiguration?.courseId &&
          material.status === "published",
      ),
    [lessonConfiguration?.courseId, materials],
  );
  const courseById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses],
  );
  const enrolledCourseIds = useMemo(
    () => new Set(cohorts.map((cohort) => cohort.courseId)),
    [cohorts],
  );
  const inProgressCohorts = useMemo(
    () => cohorts.filter((cohort) => cohort.status !== "concluida"),
    [cohorts],
  );
  const completedCohorts = useMemo(
    () => cohorts.filter((cohort) => cohort.status === "concluida"),
    [cohorts],
  );
  const visibleManagedCohorts = useMemo(() => {
    const search = cohortSearch.trim().toLocaleLowerCase("pt-BR");
    return cohorts.filter((cohort) => {
      const matchesStatus =
        cohortStatus === "all" || cohort.status === cohortStatus;
      const matchesSearch =
        !search ||
        [
          cohort.name,
          cohort.courseName,
          cohort.professorName,
          cohort.unitLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [cohortSearch, cohortStatus, cohorts]);
  const possibleCourses = useMemo(
    () =>
      courses.filter(
        (course) => course.active && !enrolledCourseIds.has(course.id),
      ),
    [courses, enrolledCourseIds],
  );

  const saveCohort = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cohortForm.studentIds.length) {
      notifyError(
        "Selecione os alunos",
        "A turma precisa ter pelo menos um aluno.",
      );
      return;
    }
    closeCohortModal();
    setConfiguring(null);
    setNewCohort({
      ...cohortForm,
      studentIds: [...cohortForm.studentIds],
    });
    setLessonForms(
      Array.from({ length: cohortForm.lessonCount }, () => ({
        materialId: "",
        date: "",
        time: "",
      })),
    );
    setScheduleConflicts([]);
  };

  const continueToStudents = (event: React.FormEvent) => {
    event.preventDefault();
    if (cohortForm.lessonCount < 1 || cohortForm.lessonCount > 200) {
      notifyError(
        "Quantidade de aulas inválida",
        "Informe uma quantidade entre 1 e 200 aulas.",
      );
      return;
    }
    setCohortStep(2);
  };

  const toggleStudent = (studentId: string) => {
    setCohortForm((current) => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter((id) => id !== studentId)
        : [...current.studentIds, studentId],
    }));
  };

  const selectVisibleStudents = () => {
    setCohortForm((current) => ({
      ...current,
      studentIds: Array.from(
        new Set([
          ...current.studentIds,
          ...visibleStudents.map((student) => student.id),
        ]),
      ),
    }));
  };

  const configureLessons = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonConfiguration) return;
    setScheduleConflicts([]);
    setSaving(true);
    try {
      const updated = newCohort
        ? await store.createCohortWithLessons(newCohort, lessonForms)
        : await store.configureCohortLessons(configuring!.id, lessonForms);
      setNewCohort(null);
      setConfiguring(null);
      setLessonForms([]);
      setDetail(updated);
      await load();
    } catch (error) {
      const conflicts =
        error instanceof ApiError && Array.isArray(error.payload?.conflicts)
          ? (error.payload.conflicts as CohortScheduleConflict[])
          : [];
      if (conflicts.length) {
        setScheduleConflicts(conflicts);
        notifyError(
          "Conflitos na agenda",
          conflicts.length === 1
            ? "Revise a aula destacada antes de criar a agenda."
            : `Revise as ${new Set(conflicts.map((item) => item.lessonIndex)).size} aulas destacadas antes de criar a agenda.`,
        );
      } else {
        notifyRequestError(error);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateLessonForm = (index: number, changes: Partial<LessonForm>) => {
    setLessonForms((items) =>
      items.map((item, position) =>
        position === index ? { ...item, ...changes } : item,
      ),
    );
    if ("date" in changes || "time" in changes) setScheduleConflicts([]);
  };

  const openDetail = async (cohort: Cohort) => {
    setDetail(await store.fetchCohort(cohort.id));
  };

  const openEditCohort = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setEditingName(cohort.name);
  };

  const saveEditedCohort = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCohort || !editingName.trim()) return;
    setSaving(true);
    try {
      const updated = await store.updateCohort(editingCohort.id, {
        name: editingName.trim(),
      });
      setCohorts((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDetail((current) =>
        current?.id === updated.id ? updated : current,
      );
      setEditingCohort(null);
    } catch (error) {
      notifyRequestError(error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCohort = async () => {
    if (!deletingCohort) return;
    setSaving(true);
    try {
      await store.deleteCohort(deletingCohort.id);
      setCohorts((items) =>
        items.filter((item) => item.id !== deletingCohort.id),
      );
      setDetail((current) =>
        current?.id === deletingCohort.id ? null : current,
      );
      setDeletingCohort(null);
    } catch (error) {
      notifyRequestError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardPageSkeleton variant="cohorts" rows={4} />;
  const overview = !detail;
  const studentOverview = user?.role === "student" && overview;
  const heroKey = user?.role === "student" ? "student-courses" : "staff-courses";
  const heroDefaults =
    user?.role === "student" ? STUDENT_COURSES_HERO : STAFF_COURSES_HERO;

  return (
    <div className="min-h-screen bg-djon-page">
      {overview && user ? (
        <EditablePortalHero
          heroKey={heroKey}
          defaults={heroDefaults}
          bannerKey="student-courses"
          editorSections={COURSES_HERO_SECTIONS}
        />
      ) : null}

      <main
        className={
          studentOverview
            ? "mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 sm:py-16"
            : "mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10"
        }
      >
        {detail ? (
          <>
            <header>
              <p className="text-xs font-black text-djon-accent">
                {detail.courseName}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tighter text-djon-text">
                {detail.name}
              </h1>
              <p className="mt-2 text-sm text-djon-text/40">
                {[
                  detail.professorName,
                  detail.unitLabel,
                  detail.equipmentName,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>
            <CohortDetailView
              cohort={detail}
              currentUser={user}
              onBack={() => setDetail(null)}
              onUpdated={(updated) => {
                setDetail(updated);
                setCohorts((items) =>
                  items.map((item) =>
                    item.id === updated.id ? updated : item,
                  ),
                );
              }}
              onConfigure={(cohort) => {
                setNewCohort(null);
                setConfiguring(cohort);
                setLessonForms(
                  Array.from({ length: cohort.lessonCount }, () => ({
                    materialId: "",
                    date: "",
                    time: "",
                  })),
                );
                setScheduleConflicts([]);
                setDetail(null);
              }}
              onEdit={openEditCohort}
              onDelete={setDeletingCohort}
            />
          </>
        ) : user?.role === "student" ? (
          <>
            <section>
              <motion.div className="mb-7" {...fadeUp()}>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-djon-accent">
                  SUA JORNADA
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tighter text-djon-text sm:text-4xl">
                  Em andamento
                </h2>
                <div className="mt-3 h-[3px] w-10 rounded-full bg-djon-accent" />
              </motion.div>
              <div className="grid gap-5 md:grid-cols-2">
                {inProgressCohorts.map((cohort, index) => (
                  <CohortCard
                    key={cohort.id}
                    cohort={cohort}
                    course={courseById.get(cohort.courseId)}
                    showProgress
                    index={index}
                    onOpen={() => void openDetail(cohort)}
                  />
                ))}
                {!inProgressCohorts.length ? (
                  <div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-10 text-center text-sm text-djon-text/35 md:col-span-2">
                    Você ainda não possui um curso em andamento.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="border-t border-djon-text/8 pt-12">
              <motion.div className="mb-7" {...fadeUp()}>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-djon-accent">
                  CONTINUE EVOLUINDO
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tighter text-djon-text sm:text-4xl">
                  Outros cursos
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-djon-text/40">
                  Conheça as formações ativas configuradas pela equipe da DJ ON
                  Academy que ainda não fazem parte da sua jornada.
                </p>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {possibleCourses.map((course, index) => (
                  <motion.article
                    key={course.id}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2 outline-none transition-all focus-within:border-djon-accent/50"
                    {...fadeUp(index * 0.05)}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/dashboard/material?category=Cursos&course=${encodeURIComponent(course.id)}`}
                      aria-label={`Acessar materiais do curso ${course.name}`}
                      className="absolute inset-0 z-10 cursor-pointer"
                    />
                    <div className="relative h-44 overflow-hidden bg-djon-muted-panel">
                      <CourseArtwork course={course} />
                      <div className="absolute inset-0 bg-gradient-to-t from-djon-black/70 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full border border-djon-accent/25 bg-djon-page/80 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-accent backdrop-blur-sm">
                        DISPONÍVEL
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-black tracking-tight text-djon-text">
                        {course.name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-djon-text/40">
                        {course.description ||
                          "Uma nova possibilidade para continuar sua formação na DJ ON Academy."}
                      </p>
                    </div>
                  </motion.article>
                ))}
                {!possibleCourses.length ? (
                  <div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-10 text-center text-sm text-djon-text/35 sm:col-span-2 lg:col-span-3">
                    Você já está matriculado em todos os cursos disponíveis.
                  </div>
                ) : null}
              </div>
            </section>

            {completedCohorts.length ? (
              <section className="border-t border-djon-text/8 pt-12">
                <motion.div className="mb-7" {...fadeUp()}>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-djon-accent">
                    HISTÓRICO
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tighter text-djon-text sm:text-4xl">
                    Concluídos
                  </h2>
                </motion.div>
                <div className="grid gap-5 md:grid-cols-2">
                  {completedCohorts.map((cohort, index) => (
                    <CohortCard
                      key={cohort.id}
                      cohort={cohort}
                      course={courseById.get(cohort.courseId)}
                      showProgress
                      index={index}
                      onOpen={() => void openDetail(cohort)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section>
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 transition-colors focus-within:border-djon-accent/50">
                <Search size={16} className="shrink-0 text-djon-text/30" />
                <input
                  type="search"
                  value={cohortSearch}
                  onChange={(event) => setCohortSearch(event.target.value)}
                  placeholder="Buscar por turma, curso, professor ou unidade"
                  aria-label="Buscar turmas"
                  className="min-w-0 flex-1 bg-transparent text-sm text-djon-text outline-none placeholder:text-djon-text/25"
                />
              </label>
              <DjonSelect
                value={cohortStatus}
                onChange={(value) =>
                  setCohortStatus(value as CohortStatusFilter)
                }
                ariaLabel="Filtrar turmas por status"
                className="h-11 lg:w-52"
                options={[
                  { value: "all", label: "Todos os status" },
                  { value: "configuracao", label: "Em configuração" },
                  { value: "ativa", label: "Ativas" },
                  { value: "concluida", label: "Concluídas" },
                ]}
              />
              {canCreateCohort ? (
                <button
                  type="button"
                  onClick={openCohort}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-djon-accent px-5 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
                >
                  <Users size={13} /> NOVA TURMA
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleManagedCohorts.map((cohort) => {
                const mayManageCohort = canManageCohort(user, cohort);
                return (
                <article
                  key={cohort.id}
                  className="relative rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 text-left transition-colors hover:border-djon-accent/25 focus-within:ring-2 focus-within:ring-djon-accent/70"
                >
                  <button
                    type="button"
                    onClick={() => void openDetail(cohort)}
                    aria-label={`Abrir turma ${cohort.name}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline-none"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-djon-accent">
                        {cohort.courseName}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-djon-text">
                        {cohort.name}
                      </h3>
                      <p className="mt-2 text-xs text-djon-text/40">
                        {cohort.professorName} · {cohort.unitLabel}
                      </p>
                    </div>
                    <div className="relative z-20 flex shrink-0 items-center gap-1.5">
                      {mayManageCohort ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditCohort(cohort)}
                            aria-label={`Editar turma ${cohort.name}`}
                            title="Editar turma"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-accent/10 text-djon-accent transition-[filter] hover:brightness-110"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCohort(cohort)}
                            aria-label={`Excluir turma ${cohort.name}`}
                            title="Excluir turma"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-warning-red/10 text-djon-warning-red transition-[filter] hover:brightness-110"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : null}
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${cohort.status === "ativa" ? "border-djon-accent/25 bg-djon-accent/10 text-djon-accent" : "border-djon-yellow/25 bg-djon-yellow/10 text-djon-yellow"}`}
                      >
                        {cohort.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-djon-text/8">
                    <div
                      className="h-full rounded-full bg-djon-accent"
                      style={{ width: `${cohort.progress.percent}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-djon-text/35">
                    {cohort.lessonCount} aulas · {cohort.durationMinutes} min
                  </div>
                </article>
                );
              })}
              {!visibleManagedCohorts.length ? (
                <div className="rounded-2xl border-2 border-dashed border-djon-text/10 p-10 text-center text-sm text-djon-text/35 md:col-span-2">
                  {cohorts.length
                    ? "Nenhuma turma corresponde aos filtros."
                    : "Nenhuma turma disponível."}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      {editingCohort ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm"
          onClick={(event) =>
            event.target === event.currentTarget && setEditingCohort(null)
          }
        >
          <form
            onSubmit={saveEditedCohort}
            className="my-6 w-full max-w-md space-y-5 rounded-2xl border border-djon-text/10 bg-djon-calendar-cell p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-djon-accent">EDITAR</p>
                <h2 className="text-xl font-black text-djon-text">Turma</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCohort(null)}
                aria-label="Fechar edição da turma"
              >
                <X size={18} className="text-djon-text/40" />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                NOME DA TURMA
              </label>
              <input
                required
                autoFocus
                maxLength={150}
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className={field}
              />
            </div>
            <button
              disabled={saving || !editingName.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-djon-accent text-xs font-black text-djon-ink transition-[filter] hover:brightness-90 disabled:opacity-40"
            >
              <Save size={14} /> {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>
          </form>
        </div>
      ) : null}

      {deletingCohort ? (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm"
          onClick={(event) =>
            event.target === event.currentTarget && setDeletingCohort(null)
          }
        >
          <div className="my-6 w-full max-w-sm rounded-2xl border border-djon-text/10 bg-djon-calendar-cell p-6">
            <p className="text-lg font-black text-djon-text">Excluir turma?</p>
            <p className="mt-2 text-sm leading-relaxed text-djon-text/40">
              A turma{" "}
              <span className="font-black text-djon-text">
                {deletingCohort.name}
              </span>{" "}
              e todas as aulas da agenda vinculadas a ela serão excluídas
              definitivamente.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingCohort(null)}
                disabled={saving}
                className="h-11 flex-1 rounded-full border border-djon-text/15 text-xs font-black text-djon-text/60 disabled:opacity-40"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteCohort()}
                disabled={saving}
                className="h-11 flex-1 rounded-full bg-djon-warning-red/80 text-xs font-black text-djon-text transition-[filter] hover:brightness-110 disabled:opacity-40"
              >
                {saving ? "EXCLUINDO..." : "EXCLUIR"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cohortModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/80 p-4 backdrop-blur-sm">
          {cohortStep === 1 ? (
            <form
              onSubmit={continueToStudents}
              className="my-5 w-full max-w-2xl space-y-5 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-djon-accent">
                    PASSO 1 DE 3
                  </p>
                  <h2 className="text-xl font-black text-djon-text">
                    Dados da turma
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCohortModal}
                  aria-label="Fechar"
                >
                  <X size={18} className="text-djon-text/40" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    NOME DA TURMA
                  </label>
                  <input
                    required
                    value={cohortForm.name}
                    onChange={(event) =>
                      setCohortForm({ ...cohortForm, name: event.target.value })
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    CURSO
                  </label>
                  <DjonSelect
                    required
                    value={cohortForm.courseId}
                    onChange={(courseId) =>
                      setCohortForm({ ...cohortForm, courseId })
                    }
                    options={courses
                      .filter((course) => course.active)
                      .map((course) => ({
                        value: course.id,
                        label: course.name,
                      }))}
                    placeholder="Selecionar..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    UNIDADE
                  </label>
                  <DjonSelect
                    required
                    disabled={
                      user?.role === "professor" && !canManageAllCourses
                    }
                    value={cohortForm.unitId}
                    onChange={(unitId) =>
                      setCohortForm({
                        ...cohortForm,
                        unitId,
                        professorId: "",
                        equipmentId: "",
                        studentIds: [],
                      })
                    }
                    options={units.map((unit) => ({
                      value: unit.id,
                      label: unit.label,
                    }))}
                    placeholder="Selecionar..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    PROFESSOR
                  </label>
                  <DjonSelect
                    required
                    disabled={
                      user?.role === "professor" && !canManageAllCourses
                    }
                    value={cohortForm.professorId}
                    onChange={(professorId) =>
                      setCohortForm({ ...cohortForm, professorId })
                    }
                    options={professors.map((professor) => ({
                      value: professor.id,
                      label: personLabel(professor),
                    }))}
                    placeholder="Selecionar..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    EQUIPAMENTO
                  </label>
                  <DjonSelect
                    required
                    value={cohortForm.equipmentId}
                    onChange={(equipmentId) =>
                      setCohortForm({ ...cohortForm, equipmentId })
                    }
                    options={unitEquipments.map((equipment) => ({
                      value: equipment.id,
                      label: equipment.name,
                    }))}
                    placeholder="Selecionar..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    DURAÇÃO DA AULA
                  </label>
                  <DjonSelect
                    required
                    value={String(cohortForm.durationMinutes)}
                    onChange={(value) =>
                      setCohortForm({
                        ...cohortForm,
                        durationMinutes: Number(value),
                      })
                    }
                    options={durationOptions}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                    QUANTIDADE DE AULAS
                  </label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="Ex.: 12"
                    value={cohortForm.lessonCount || ""}
                    onChange={(event) =>
                      setCohortForm({
                        ...cohortForm,
                        lessonCount: Number(
                          event.target.value.replace(/\D/g, ""),
                        ),
                      })
                    }
                    className={field}
                  />
                </div>
              </div>
              <button className="h-12 w-full rounded-xl bg-djon-accent text-xs font-black text-djon-ink">
                CONTINUAR PARA OS ALUNOS
              </button>
            </form>
          ) : (
            <form
              onSubmit={saveCohort}
              className="my-5 w-full max-w-3xl space-y-5 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-djon-accent">
                    PASSO 2 DE 3
                  </p>
                  <h2 className="text-xl font-black text-djon-text">
                    Selecionar alunos
                  </h2>
                  <p className="mt-1 text-xs text-djon-text/40">
                    {cohortForm.studentIds.length} de {students.length}{" "}
                    selecionados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCohortModal}
                  aria-label="Fechar"
                >
                  <X size={18} className="text-djon-text/40" />
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-djon-text/10 bg-djon-text/5 px-3 focus-within:border-djon-accent/50">
                  <Search size={16} className="shrink-0 text-djon-text/30" />
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Buscar por nome, projeto ou e-mail"
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm text-djon-text outline-none placeholder:text-djon-text/25"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "TODOS"],
                      ["selected", "SELECIONADOS"],
                      ["unselected", "NÃO SELECIONADOS"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStudentFilter(value)}
                      className={`h-9 rounded-full border px-3 text-[10px] font-black transition-colors ${studentFilter === value ? "border-djon-accent/40 bg-djon-accent/10 text-djon-accent" : "border-djon-text/10 text-djon-text/35 hover:text-djon-text/60"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-djon-text/35">
                  {visibleStudents.length}{" "}
                  {visibleStudents.length === 1
                    ? "aluno encontrado"
                    : "alunos encontrados"}
                </p>
                <div className="flex gap-3 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={selectVisibleStudents}
                    disabled={!visibleStudents.length}
                    className="text-djon-accent disabled:opacity-30"
                  >
                    SELECIONAR RESULTADOS
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCohortForm((current) => ({
                        ...current,
                        studentIds: [],
                      }))
                    }
                    disabled={!cohortForm.studentIds.length}
                    className="text-djon-text/40 disabled:opacity-30"
                  >
                    LIMPAR SELEÇÃO
                  </button>
                </div>
              </div>

              <div className="grid max-h-[46vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {visibleStudents.map((student) => {
                  const selected = cohortForm.studentIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-djon-accent/35 bg-djon-accent/10" : "border-djon-text/8 bg-djon-text/3 hover:border-djon-text/18"}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${selected ? "bg-djon-accent text-djon-ink" : "bg-djon-text/8 text-djon-text/45"}`}
                      >
                        {selected ? (
                          <Check size={17} />
                        ) : (
                          student.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-black ${selected ? "text-djon-accent" : "text-djon-text"}`}
                        >
                          {personLabel(student)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-djon-text/35">
                          {student.email}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {!visibleStudents.length && (
                  <div className="col-span-full rounded-xl border-2 border-dashed border-djon-text/8 px-5 py-12 text-center">
                    <Users size={24} className="mx-auto text-djon-text/20" />
                    <p className="mt-3 text-sm font-bold text-djon-text/40">
                      {students.length
                        ? "Nenhum aluno corresponde aos filtros."
                        : "Nenhum aluno ativo nesta unidade."}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                <button
                  type="button"
                  onClick={() => setCohortStep(1)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-djon-text/10 px-5 text-xs font-black text-djon-text/50 hover:text-djon-text"
                >
                  <ChevronLeft size={15} /> VOLTAR
                </button>
                <button
                  disabled={saving || !cohortForm.studentIds.length}
                  className="h-12 rounded-xl bg-djon-accent text-xs font-black text-djon-ink disabled:opacity-40"
                >
                  CONTINUAR PARA AS AULAS
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {lessonConfiguration && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/85 p-4 backdrop-blur-sm">
          <form
            onSubmit={configureLessons}
            className="my-5 w-full max-w-3xl space-y-5 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-djon-accent">
                  PASSO 3 DE 3
                </p>
                <h2 className="text-xl font-black text-djon-text">
                  Configurar {lessonConfiguration.lessonCount} aulas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewCohort(null);
                  setConfiguring(null);
                  setScheduleConflicts([]);
                }}
                aria-label="Fechar"
              >
                <X size={18} className="text-djon-text/40" />
              </button>
            </div>
            {!courseMaterials.length && (
              <div className="rounded-xl border border-djon-yellow/20 bg-djon-yellow/8 p-4 text-sm text-djon-text/55">
                Este curso ainda não tem aulas publicadas.{" "}
                <Link
                  className="font-black text-djon-accent"
                  href={`/dashboard/material?category=Cursos&course=${lessonConfiguration.courseId}`}
                >
                  Criar aulas no curso
                </Link>
              </div>
            )}
            {scheduleConflicts.length ? (
              <div
                role="alert"
                className="rounded-xl border border-djon-warning-red/30 bg-djon-warning-red/8 p-4"
              >
                <p className="text-sm font-black text-djon-warning-red">
                  Corrija os conflitos antes de criar a agenda
                </p>
                <p className="mt-1 text-xs leading-relaxed text-djon-text/45">
                  Nenhuma aula foi agendada. Os horários abaixo já estão
                  ocupados ou indisponíveis.
                </p>
                <ul className="mt-3 space-y-2">
                  {scheduleConflicts.map((conflict, conflictIndex) => (
                    <li
                      key={`${conflict.lessonIndex}-${conflict.kind}-${conflict.conflictingBookingId ?? conflictIndex}`}
                      className="rounded-lg border border-djon-warning-red/15 bg-djon-black/15 px-3 py-2 text-xs text-djon-text/65"
                    >
                      <strong className="text-djon-text">
                        Aula {conflict.lessonIndex + 1} ·{" "}
                        {formatConflictDate(conflict.date)} · {conflict.time}–
                        {conflict.endTime}
                      </strong>
                      <span className="mt-0.5 block">
                        {conflict.message}
                        {conflict.conflictingTitle
                          ? ` Agendamento: ${conflict.conflictingTitle}.`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="space-y-3">
              {lessonForms.map((lesson, index) => (
                <div
                  key={index}
                  className={`grid gap-3 rounded-xl border bg-djon-text/3 p-4 sm:grid-cols-[auto_1fr_150px_120px] ${scheduleConflicts.some((conflict) => conflict.lessonIndex === index) ? "border-djon-warning-red/45" : "border-djon-text/8"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-djon-accent/10 text-xs font-black text-djon-accent">
                    {index + 1}
                  </div>
                  <DjonSelect
                    required
                    value={lesson.materialId}
                    onChange={(materialId) =>
                      updateLessonForm(index, { materialId })
                    }
                    options={courseMaterials
                      .filter(
                        (material) =>
                          !lessonForms.some(
                            (item, position) =>
                              position !== index &&
                              item.materialId === material.id,
                          ),
                      )
                      .map((material) => ({
                        value: material.id,
                        label: material.title,
                      }))}
                    placeholder="Aula do curso..."
                  />
                  <input
                    required
                    type="date"
                    value={lesson.date}
                    onChange={(event) =>
                      updateLessonForm(index, { date: event.target.value })
                    }
                    className={field}
                  />
                  <input
                    required
                    type="time"
                    step={1800}
                    value={lesson.time}
                    onChange={(event) =>
                      updateLessonForm(index, { time: event.target.value })
                    }
                    className={field}
                  />
                </div>
              ))}
            </div>
            <button
              disabled={saving || !courseMaterials.length}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink disabled:opacity-40"
            >
              <CalendarDays size={14} /> CRIAR AGENDA DA TURMA
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
