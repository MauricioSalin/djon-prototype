"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit2,
  GraduationCap,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { notifyError } from "@/lib/feedback";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import {
  canAuthorMaterials,
  store,
  type Course,
  type User,
} from "@/lib/store";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 py-3 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent/50";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.45, ease: [0.25, 0.4, 0.25, 1] as const, delay },
});

type CourseForm = {
  name: string;
  description: string;
  coverImage: string;
};

const emptyCourse: CourseForm = {
  name: "",
  description: "",
  coverImage: "",
};

function CourseThumb({ course }: { course: Course }) {
  const [error, setError] = useState(false);

  if (course.coverImage && !error) {
    return (
      <Image
        loader={({ src }) => src}
        unoptimized
        src={course.coverImage}
        alt={`Capa do curso ${course.name}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-djon-surface to-djon-muted-panel">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-djon-accent/10">
        <GraduationCap size={27} className="text-djon-accent" />
      </div>
      <span className="text-djon-label font-bold uppercase tracking-widest text-djon-text/30">
        Curso
      </span>
    </div>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorCourse, setEditorCourse] = useState<Course | "new" | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);
  const [temporaryCoverId, setTemporaryCoverId] = useState("");
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  useBodyScrollLock(Boolean(editorCourse) || Boolean(deleteCourse));

  const load = useCallback(async () => {
    const current = await store.bootstrap();
    if (!current) return;
    if (!canAuthorMaterials(current)) {
      router.replace("/dashboard/turmas");
      return;
    }
    const availableCourses = await store.listCourses(true);
    setUser(current);
    setCourses(availableCourses);
  }, [router]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const openCreate = () => {
    setCourseForm(emptyCourse);
    setTemporaryCoverId("");
    setEditorCourse("new");
  };

  const openEdit = (course: Course) => {
    setCourseForm({
      name: course.name,
      description: course.description ?? "",
      coverImage: course.coverImage ?? "",
    });
    setTemporaryCoverId("");
    setEditorCourse(course);
  };

  const closeEditor = async () => {
    if (temporaryCoverId) {
      await store
        .deleteFile(temporaryCoverId, { silent: true })
        .catch(() => undefined);
    }
    setEditorCourse(null);
    setCourseForm(emptyCourse);
    setTemporaryCoverId("");
  };

  const chooseCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifyError(
        "Arquivo inválido",
        "Selecione uma imagem para a capa do curso.",
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notifyError(
        "Imagem muito grande",
        "A capa do curso deve ter no máximo 10 MB.",
      );
      return;
    }

    try {
      const uploaded = await store.uploadFile(file, "material-cover");
      if (temporaryCoverId) {
        await store
          .deleteFile(temporaryCoverId, { silent: true })
          .catch(() => undefined);
      }
      setCourseForm((current) => ({ ...current, coverImage: uploaded.url }));
      setTemporaryCoverId(uploaded.id);
    } catch {
      // A camada HTTP já apresenta o erro da requisição.
    }
  };

  const removeCover = async () => {
    if (temporaryCoverId) {
      await store
        .deleteFile(temporaryCoverId, { silent: true })
        .catch(() => undefined);
      setTemporaryCoverId("");
    }
    setCourseForm((current) => ({ ...current, coverImage: "" }));
  };

  const saveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editorCourse) return;
    setSaving(true);
    try {
      const payload = {
        name: courseForm.name.trim(),
        description: courseForm.description.trim(),
        coverImage: courseForm.coverImage,
      };
      if (editorCourse === "new") {
        await store.createCourse(payload);
      } else {
        await store.updateCourse(editorCourse.id, payload);
      }
      setTemporaryCoverId("");
      setEditorCourse(null);
      setCourseForm(emptyCourse);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCourse) return;
    setSaving(true);
    try {
      await store.deleteCourse(deleteCourse.id);
      setDeleteCourse(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user)
    return <DashboardPageSkeleton variant="courses" rows={5} />;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-djon-accent">DJ ON ACADEMY</p>
          <h1 className="text-3xl font-black tracking-tighter text-djon-text">
            Cursos
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-djon-accent px-5 text-xs font-black text-djon-ink transition-[filter] hover:brightness-90"
        >
          <Plus size={14} /> NOVO CURSO
        </button>
      </header>

      {courses.length ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course, index) => (
            <motion.article
              key={course.id}
              className="group relative flex min-h-[322px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/4 text-left outline-none transition-all hover:brightness-110 focus-within:border-djon-accent/50"
              {...fadeUp(index * 0.04)}
              whileHover={{ y: -4 }}
            >
              <Link
                href={`/dashboard/material?category=Cursos&course=${encodeURIComponent(course.id)}`}
                aria-label={`Acessar curso ${course.name}`}
                className="absolute inset-0 z-10 cursor-pointer"
              />
              <div className="relative h-44 overflow-hidden bg-djon-muted-panel">
                <CourseThumb
                  key={course.coverImage ?? "empty"}
                  course={course}
                />
                <div className="absolute left-3 top-3">
                  <span className="rounded-full border border-djon-text/10 bg-djon-page/80 px-2.5 py-1 text-djon-caption font-black uppercase tracking-widest text-djon-text/50 backdrop-blur-sm">
                    CURSO
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 line-clamp-2 text-sm font-black leading-snug text-djon-text">
                  {course.name}
                </p>
                {course.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-djon-text/35">
                    {course.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-end gap-3 pt-4">
                  <div className="relative z-20 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Editar curso ${course.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(course);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-accent/10 text-djon-accent transition-[filter] hover:brightness-110"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir curso ${course.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteCourse(course);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-warning-red/10 text-djon-warning-red transition-[filter] hover:brightness-110"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ) : (
        <motion.section className="py-24 text-center" {...fadeUp()}>
          <GraduationCap size={42} className="mx-auto mb-4 text-djon-text/10" />
          <p className="text-lg font-bold text-djon-text/20">
            Nenhum curso cadastrado
          </p>
        </motion.section>
      )}

      <AnimatePresence>
        {editorCourse ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) =>
              event.target === event.currentTarget && void closeEditor()
            }
          >
            <motion.form
              onSubmit={saveCourse}
              className="djon-scroll max-h-[calc(100svh-2rem)] w-full max-w-lg space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-calendar-cell p-6"
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-djon-accent">
                    {editorCourse === "new" ? "NOVO" : "EDITAR"}
                  </p>
                  <h2 className="text-xl font-black text-djon-text">Curso</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void closeEditor()}
                  aria-label="Fechar"
                >
                  <X size={18} className="text-djon-text/40" />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                  NOME
                </label>
                <input
                  required
                  autoFocus
                  value={courseForm.name}
                  onChange={(event) =>
                    setCourseForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex: Formação DJ"
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                  DESCRIÇÃO
                </label>
                <textarea
                  rows={4}
                  value={courseForm.description}
                  onChange={(event) =>
                    setCourseForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Apresente o conteúdo e o objetivo do curso..."
                  className={`${field} resize-none`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black text-djon-text/40">
                  IMAGEM DE CAPA{" "}
                  <span className="font-bold text-djon-text/20">
                    (OPCIONAL)
                  </span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-djon-text/12 bg-djon-text/3 transition-colors hover:border-djon-accent/30"
                  >
                    {courseForm.coverImage ? (
                      <Image
                        loader={({ src }) => src}
                        unoptimized
                        src={courseForm.coverImage}
                        alt="Prévia da capa do curso"
                        fill
                        sizes="512px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-2 text-xs font-bold text-djon-text/30">
                        <ImageIcon size={26} /> ADICIONAR CAPA
                      </span>
                    )}
                  </button>
                  {courseForm.coverImage ? (
                    <button
                      type="button"
                      onClick={() => void removeCover()}
                      aria-label="Remover imagem de capa"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-djon-page/85 text-djon-text/70 backdrop-blur-sm hover:text-djon-warning-red"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void chooseCover(event)}
                />
              </div>

              {editorCourse !== "new" ? (
                <Link
                  href={`/dashboard/material?category=Cursos&course=${editorCourse.id}`}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-djon-text/10 text-xs font-black text-djon-text/55 transition-colors hover:border-djon-accent/30 hover:text-djon-accent"
                >
                  GERENCIAR AULAS DO CURSO
                </Link>
              ) : null}
              <button
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-djon-accent text-xs font-black text-djon-ink disabled:opacity-50"
              >
                <Save size={14} />{" "}
                {editorCourse === "new" ? "CRIAR CURSO" : "SALVAR ALTERAÇÕES"}
              </button>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteCourse ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) =>
              event.target === event.currentTarget && setDeleteCourse(null)
            }
          >
            <motion.div
              className="djon-scroll max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-calendar-cell p-6"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <p className="text-lg font-black text-djon-text">
                Excluir curso?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-djon-text/40">
                O curso{" "}
                <span className="font-black text-djon-text">
                  {deleteCourse.name}
                </span>{" "}
                será excluído definitivamente. Cursos com aulas ou turmas
                vinculadas são protegidos e não podem ser excluídos.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCourse(null)}
                  disabled={saving}
                  className="h-11 flex-1 rounded-full border border-djon-text/15 text-xs font-black text-djon-text/60 disabled:opacity-40"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={saving}
                  className="h-11 flex-1 rounded-full bg-djon-warning-red/80 text-xs font-black text-djon-text transition-[filter] hover:brightness-110 disabled:opacity-40"
                >
                  EXCLUIR
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
