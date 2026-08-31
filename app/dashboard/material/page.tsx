"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  X,
  FileText,
  Trash2,
  Plus,
  Paperclip,
  Edit2,
  Lock,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import {
  hasPermission,
  store,
  type Course,
  type Material,
  type User,
} from "@/lib/store";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { LockedCoverOverlay } from "@/components/locked-cover-overlay";
import { MaterialCourseView } from "@/components/material-course-view";
import { usePageTitle } from "@/components/page-title-manager";

const DRAFTS_CATEGORY = "Rascunhos";
const COURSES_CATEGORY = "Cursos";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay },
});

// ── Main Page ─────────────────────────────────────────────────────────────────
function CardThumb({ mat }: { mat: Material }) {
  const [err, setErr] = useState(false);
  const src =
    mat.coverImage || (mat.fileType === "image" ? mat.fileUrl : undefined);

  if (src && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={mat.title || "Rascunho sem título"}
        className={`h-full w-full object-cover ${mat.locked ? "" : "transition-transform duration-500 group-hover:scale-105"}`}
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-djon-surface to-djon-muted-panel">
      <div className="w-14 h-14 rounded-2xl bg-djon-accent/10 flex items-center justify-center">
        <FileText size={26} className="text-djon-accent" />
      </div>
      <span className="text-djon-text/30 text-djon-label font-bold tracking-widest uppercase">
        Material
      </span>
    </div>
  );
}

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

export default function MaterialPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [materialCategories, setMaterialCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<{
    mode: "create" | "edit";
    original?: string;
    value: string;
  } | null>(null);
  const [categoryDelete, setCategoryDelete] = useState<string | null>(null);
  const [transferCategory, setTransferCategory] = useState("");
  const listScrollPosition = useRef(0);
  const selectedCourseRef = useRef<string | null>(null);

  const isProfessor = user?.role === "professor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const canManageMaterials = hasPermission(user, "materials.manage");
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId,
  );
  const courseLessons = selectedCourseId
    ? materials.filter((material) => material.courseId === selectedCourseId)
    : [];

  usePageTitle(selectedCourse?.name ?? "Materiais");

  const load = () => setMaterials(store.getMaterials());
  const loadCategories = () =>
    setMaterialCategories(
      store
        .getMaterialCategoryRecords()
        .filter((category) => category.type === "biblioteca")
        .map((category) => category.name),
    );

  const loadCourseLessons = useCallback(async (courseId: string) => {
    setMaterials(store.getMaterials());
    try {
      await store.listCourseMaterials(courseId);
      setMaterials(store.getMaterials());
    } catch {
      // Mantém imediatamente os materiais já disponíveis no cache do portal.
    }
  }, []);

  const restoreCourseListScroll = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: listScrollPosition.current, behavior: "auto" });
      });
    });
  }, []);

  const syncCourseFromUrl = useCallback(() => {
    const requestedCourse = new URLSearchParams(window.location.search).get(
      "course",
    );
    const wasViewingCourse = Boolean(selectedCourseRef.current);
    selectedCourseRef.current = requestedCourse;
    setSelectedCourseId(requestedCourse);

    if (requestedCourse) {
      setActiveCategory(COURSES_CATEGORY);
      void loadCourseLessons(requestedCourse);
    } else if (wasViewingCourse) {
      setActiveCategory(COURSES_CATEGORY);
      restoreCourseListScroll();
    }
  }, [loadCourseLessons, restoreCourseListScroll]);

  useEffect(() => {
    const u = store.getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    load();
    loadCategories();
    void store
      .listCourses(!hasPermission(u, "courses.manage"))
      .then(setCourses)
      .catch(() => undefined)
      .finally(() => setCoursesLoaded(true));
    const requestedCategory = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (requestedCategory === COURSES_CATEGORY) {
      setActiveCategory(COURSES_CATEGORY);
    } else if (
      requestedCategory === DRAFTS_CATEGORY &&
      hasPermission(u, "materials.manage")
    ) {
      setActiveCategory(DRAFTS_CATEGORY);
    }
    syncCourseFromUrl();
  }, [router, syncCourseFromUrl]);

  useEffect(() => {
    window.addEventListener("popstate", syncCourseFromUrl);
    return () => window.removeEventListener("popstate", syncCourseFromUrl);
  }, [syncCourseFromUrl]);

  const openCourse = (course: Course) => {
    listScrollPosition.current = window.scrollY;
    selectedCourseRef.current = course.id;
    setSelectedCourseId(course.id);
    setActiveCategory(COURSES_CATEGORY);

    const url = new URL(window.location.href);
    url.searchParams.set("category", COURSES_CATEGORY);
    url.searchParams.set("course", course.id);
    window.history.pushState(
      { djonMaterialCourse: true },
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    window.scrollTo({ top: 0, behavior: "auto" });
    void loadCourseLessons(course.id);
  };

  const closeCourse = () => {
    if (window.history.state?.djonMaterialCourse) {
      window.history.back();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("course");
    url.searchParams.set("category", COURSES_CATEGORY);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    selectedCourseRef.current = null;
    setSelectedCourseId(null);
    setActiveCategory(COURSES_CATEGORY);
    restoreCourseListScroll();
  };

  const categories = [
    "Todos",
    ...(canManageMaterials ? [DRAFTS_CATEGORY] : []),
    COURSES_CATEGORY,
    ...materialCategories,
  ];
  const publishedMaterials = materials.filter(
    (material) => material.status === "published" && !material.courseId,
  );
  const filtered =
    activeCategory === DRAFTS_CATEGORY
      ? materials.filter(
          (material) =>
            material.status === "draft" && material.authorId === user?.id,
        )
      : activeCategory === "Todos"
        ? publishedMaterials
        : publishedMaterials.filter(
            (material) => material.category === activeCategory,
          );
  const pagination = useListPagination(filtered, activeCategory);
  const coursePagination = useListPagination(
    courses.filter((course) => course.active),
    activeCategory,
  );
  const showingCourses = activeCategory === COURSES_CATEGORY;

  const openDeleteCategory = (category: string) => {
    const fallback = materialCategories.find((c) => c !== category) ?? "";
    setTransferCategory(fallback);
    setCategoryDelete(category);
  };

  const saveCategory = async () => {
    if (!categoryModal) return;
    const nextName = categoryModal.value.trim();
    if (!nextName) return;

    if (categoryModal.mode === "create") {
      const nextCategories = await store.addMaterialCategory(nextName);
      const target =
        nextCategories.find(
          (c) => c.toLowerCase() === nextName.toLowerCase(),
        ) ?? nextName;
      setActiveCategory(target);
    } else if (categoryModal.original) {
      const nextCategories = await store.updateMaterialCategory(
        categoryModal.original,
        nextName,
      );
      const target =
        nextCategories.find(
          (c) => c.toLowerCase() === nextName.toLowerCase(),
        ) ?? nextName;
      if (activeCategory === categoryModal.original) setActiveCategory(target);
    }

    load();
    loadCategories();
    setCategoryModal(null);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryDelete || (categoryDeleteCount > 0 && !transferCategory))
      return;
    const removedCategory = categoryDelete;
    const transferTarget =
      categoryDeleteCount > 0 ? transferCategory : undefined;
    await store.deleteMaterialCategory(categoryDelete, transferTarget, {
      onChange: () => {
        load();
        loadCategories();
        if (store.getMaterialCategories().includes(removedCategory))
          setActiveCategory(removedCategory);
      },
    });
    if (activeCategory === categoryDelete)
      setActiveCategory(transferTarget || "Todos");
    setCategoryDelete(null);
    setTransferCategory("");
  };

  const handleDelete = async (id: string) => {
    await store.deleteMaterial(id, { onChange: load });
    setDeleteId(null);
  };

  const categoryDeleteCount = categoryDelete
    ? materials.filter((m) => m.category === categoryDelete).length
    : 0;
  const transferOptions = materialCategories.filter(
    (c) => c !== categoryDelete,
  );

  if (!user) return <DashboardPageSkeleton variant="material" />;

  if (selectedCourseId && selectedCourse) {
    return (
      <MaterialCourseView
        course={selectedCourse}
        lessons={courseLessons}
        user={user}
        canManage={canManageMaterials}
        onBack={closeCourse}
        onNewLesson={() =>
          router.push(
            `/dashboard/material/novo?courseId=${selectedCourse.id}&categoryId=${selectedCourse.categoryId}`,
          )
        }
        onOpenLesson={(lesson) =>
          router.push(
            lesson.status === "draft"
              ? `/dashboard/material/novo?edit=${lesson.id}`
              : `/dashboard/material/${lesson.id}`,
          )
        }
        onDeleteLesson={async (lessonId) => {
          await store.deleteMaterial(lessonId, {
            onChange: () => setMaterials(store.getMaterials()),
          });
        }}
      />
    );
  }

  if (selectedCourseId && !coursesLoaded) {
    return <DashboardPageSkeleton variant="material" rows={6} />;
  }

  if (selectedCourseId && coursesLoaded) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <GraduationCap size={42} className="mb-4 text-djon-text/10" />
        <p className="text-lg font-bold text-djon-text/35">
          Curso não encontrado.
        </p>
        <button
          type="button"
          onClick={closeCourse}
          className="mt-6 rounded-full bg-djon-accent px-5 py-3 text-xs font-black text-djon-ink"
        >
          VOLTAR PARA CURSOS
        </button>
      </main>
    );
  }

  return (
    <div className="bg-djon-page min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/material-hero.png"
            alt=""
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/85 to-djon-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:px-6 sm:py-28">
          <motion.span
            className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.1)}
          >
            {isProfessor ? "PORTAL DO PROFESSOR" : "PORTAL DO ALUNO"}
          </motion.span>
          <motion.h1
            className="djon-hero-title font-black text-djon-text"
            {...fadeUp(0.2)}
          >
            Material
          </motion.h1>
          <motion.div
            className="h-[3px] w-10 bg-djon-accent rounded-full mt-4"
            {...fadeUp(0.3)}
          />
          <motion.p
            className="text-djon-text/40 text-base max-w-md leading-relaxed mt-4"
            {...fadeUp(0.35)}
          >
            {canManageMaterials
              ? "Crie artigos, PDFs e imagens, salve rascunhos ou publique para seus alunos."
              : "Acesse o material publicado pelos professores da DJ ON Academy."}
          </motion.p>
        </div>
      </section>

      {/* ── FILTER + ACTION ROW ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-10 mt-4 sm:px-6 sm:mb-12">
        <div className="flex items-start gap-4 flex-wrap">
          <motion.div
            className="flex flex-1 min-w-0 items-center gap-2 flex-wrap"
            {...fadeUp(0.1)}
          >
            {categories.map((cat) => {
              const active = activeCategory === cat;
              const canManageCategory =
                canManageMaterials &&
                active &&
                cat !== "Todos" &&
                cat !== DRAFTS_CATEGORY &&
                cat !== COURSES_CATEGORY;

              if (canManageCategory) {
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-1 rounded-full bg-djon-accent text-djon-ink px-4 py-2"
                  >
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className="cursor-pointer text-xs font-black tracking-widest transition-opacity hover:opacity-70"
                    >
                      {cat.toUpperCase()}
                    </button>
                    <span className="mx-1 h-3 w-px bg-djon-ink/20" />
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryModal({
                          mode: "edit",
                          original: cat,
                          value: cat,
                        })
                      }
                      className="cursor-pointer rounded-full p-0.5 text-djon-ink/70 hover:brightness-110 transition-all"
                      aria-label={`Editar categoria ${cat}`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteCategory(cat)}
                      className="cursor-pointer rounded-full p-0.5 text-djon-ink/70 hover:brightness-110 transition-all"
                      aria-label={`Excluir categoria ${cat}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-black tracking-widest transition-all cursor-pointer hover:opacity-80 ${
                    active
                      ? "bg-djon-accent text-djon-ink"
                      : "bg-djon-text/6 text-djon-text/50 border border-djon-text/10"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              );
            })}
            {canManageMaterials && (
              <button
                type="button"
                onClick={() => setCategoryModal({ mode: "create", value: "" })}
                className="cursor-pointer px-2 py-2 text-xs font-black tracking-widest text-djon-text/35 hover:brightness-110 transition-colors"
              >
                + NOVA CATEGORIA
              </button>
            )}
          </motion.div>

          {canManageMaterials && !showingCourses && (
            <motion.button
              onClick={() => router.push("/dashboard/material/novo")}
              className="cursor-pointer flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              {...fadeUp(0.15)}
            >
              <Plus size={15} /> NOVO MATERIAL
            </motion.button>
          )}
        </div>
      </section>

      {/* ── GRID ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 sm:pb-24">
        {showingCourses ? (
          coursePagination.paginatedItems.length === 0 ? (
            <motion.div className="py-24 text-center" {...fadeUp(0)}>
              <GraduationCap
                size={42}
                className="mx-auto mb-4 text-djon-text/10"
              />
              <p className="text-lg font-bold text-djon-text/20">
                Nenhum curso disponível
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {coursePagination.paginatedItems.map((course, index) => (
                <motion.article
                  key={course.id}
                  className="group relative flex min-h-[322px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/4 text-left transition-all hover:brightness-110 focus-within:border-djon-accent/50"
                  {...fadeUp(index * 0.04)}
                  whileHover={{ y: -4 }}
                >
                  <button
                    type="button"
                    aria-label={`Abrir curso ${course.name}`}
                    onClick={() => openCourse(course)}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />
                  <div className="relative h-44 overflow-hidden bg-djon-muted-panel">
                    <CourseThumb course={course} />
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
                    {course.description && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-djon-text/35">
                        {course.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center pt-4">
                      <span className="inline-flex items-center gap-1.5 text-djon-label font-black tracking-widest text-djon-accent">
                        VER AULAS <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <motion.div className="text-center py-24" {...fadeUp(0)}>
            <BookOpen size={40} className="text-djon-text/10 mx-auto mb-4" />
            <p className="text-djon-text/20 font-bold text-lg">
              Nenhum material nesta categoria
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pagination.paginatedItems.map((mat, i) => (
              <motion.div
                key={mat.id}
                className={`group bg-djon-text/4 border border-djon-text/8 rounded-2xl overflow-hidden transition-all flex flex-col min-h-[322px] ${mat.locked ? "cursor-not-allowed" : "cursor-pointer hover:brightness-110"}`}
                {...fadeUp(i * 0.04)}
                whileHover={mat.locked ? undefined : { y: -4 }}
                onClick={() =>
                  !mat.locked &&
                  router.push(
                    mat.status === "draft"
                      ? `/dashboard/material/novo?edit=${mat.id}`
                      : `/dashboard/material/${mat.id}`,
                  )
                }
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-djon-muted-panel overflow-hidden">
                  <CardThumb mat={mat} />
                  {mat.locked ? <LockedCoverOverlay /> : null}

                  {/* Category badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-djon-page/80 backdrop-blur-sm text-djon-text/50 text-djon-caption font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-djon-text/10">
                      {mat.status === "draft" ? DRAFTS_CATEGORY : mat.category}
                    </span>
                  </div>

                  {/* Attachment count badge */}
                  {mat.attachments && mat.attachments.length > 0 && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="flex items-center gap-1 bg-djon-page/80 backdrop-blur-sm text-djon-text/60 text-djon-caption font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-djon-text/10">
                        <Paperclip size={9} /> {mat.attachments.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-1 flex-col">
                  <p className="text-djon-text font-black text-sm leading-snug line-clamp-2 mb-1">
                    {mat.title || "Rascunho sem título"}
                  </p>
                  {mat.description && (
                    <p className="text-djon-text/35 text-xs leading-relaxed line-clamp-3">
                      {mat.description}
                    </p>
                  )}
                  {mat.status === "draft" && (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-djon-accent/10 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-accent">
                      <Edit2 size={10} /> CONTINUAR EDIÇÃO
                    </span>
                  )}
                  {mat.locked && (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-djon-text/10 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-text/40">
                      <Lock size={10} /> LIBERA APÓS A AULA
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex items-center gap-2">
                      <div className="djon-avatar-fallback w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                        {mat.authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mat.authorAvatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-djon-accent text-djon-micro font-black">
                            {mat.authorName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-djon-text/30 text-djon-label font-bold">
                        {mat.authorName || "DJ ON Academy"}
                      </span>
                    </div>
                    {canManageMaterials &&
                      (isAdmin || mat.authorId === user.id) && (
                        <button
                          aria-label={`Excluir material ${mat.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(mat.id);
                          }}
                          className="cursor-pointer opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-djon-warning-red/10 hover:brightness-110 flex items-center justify-center transition-all"
                        >
                          <Trash2 size={12} className="text-djon-warning-red" />
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <ListPagination
          totalItems={
            showingCourses
              ? courses.filter((course) => course.active).length
              : filtered.length
          }
          page={showingCourses ? coursePagination.page : pagination.page}
          pageSize={
            showingCourses ? coursePagination.pageSize : pagination.pageSize
          }
          totalPages={
            showingCourses ? coursePagination.totalPages : pagination.totalPages
          }
          onPageChange={
            showingCourses ? coursePagination.setPage : pagination.setPage
          }
          onPageSizeChange={
            showingCourses
              ? coursePagination.setPageSize
              : pagination.setPageSize
          }
        />
      </section>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* Create / edit category */}
      <AnimatePresence>
        {categoryModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-djon-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) =>
              e.target === e.currentTarget && setCategoryModal(null)
            }
          >
            <motion.div
              className="djon-scroll bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-6 max-w-sm w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-djon-accent text-xs font-black tracking-widest uppercase mb-1">
                    {categoryModal.mode === "create" ? "NOVA" : "EDITAR"}
                  </p>
                  <h2 className="text-djon-text text-xl font-black tracking-tight">
                    Categoria
                  </h2>
                </div>
                <button
                  onClick={() => setCategoryModal(null)}
                  className="cursor-pointer text-djon-text opacity-30 transition-opacity hover:opacity-100"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCategory();
                }}
              >
                <div>
                  <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">
                    Nome
                  </label>
                  <input
                    autoFocus
                    value={categoryModal.value}
                    onChange={(e) =>
                      setCategoryModal({
                        ...categoryModal,
                        value: e.target.value,
                      })
                    }
                    placeholder="Ex: Produção musical"
                    className="w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/25 focus:outline-none focus:border-djon-accent/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!categoryModal.value.trim()}
                  className="cursor-pointer w-full bg-djon-accent disabled:opacity-40 disabled:cursor-not-allowed text-djon-ink font-black text-sm tracking-widest py-3 rounded-full transition-[filter] hover:brightness-90"
                >
                  {categoryModal.mode === "create"
                    ? "CRIAR CATEGORIA"
                    : "SALVAR CATEGORIA"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete category confirm */}
      <AnimatePresence>
        {categoryDelete && (
          <motion.div
            className="fixed inset-0 z-50 bg-djon-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) =>
              e.target === e.currentTarget && setCategoryDelete(null)
            }
          >
            <motion.div
              className="djon-scroll bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-6 max-w-md w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-djon-warning-red text-xs font-black tracking-widest uppercase mb-1">
                    EXCLUIR
                  </p>
                  <h2 className="text-djon-text text-xl font-black tracking-tight">
                    Categoria {categoryDelete}
                  </h2>
                </div>
                <button
                  onClick={() => setCategoryDelete(null)}
                  className="cursor-pointer text-djon-text opacity-30 transition-opacity hover:opacity-100"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-djon-text/45 text-sm leading-relaxed mb-5">
                Existem{" "}
                <span className="text-djon-text font-black">
                  {categoryDeleteCount}
                </span>{" "}
                materiais nessa categoria.
                {categoryDeleteCount > 0
                  ? " Escolha para qual categoria eles serão transferidos antes de excluir."
                  : " Ela pode ser excluída sem transferência."}
                {" Você poderá desfazer pelo aviso exibido em seguida."}
              </p>

              <div className="space-y-5">
                {categoryDeleteCount > 0 && (
                  <div>
                    <label className="block text-djon-text/50 text-xs font-bold tracking-widest uppercase mb-2">
                      Transferir para
                    </label>
                    <DjonSelect
                      value={transferCategory}
                      onChange={setTransferCategory}
                      options={transferOptions.map((category) => ({
                        value: category,
                        label: category,
                      }))}
                      placeholder="Selecionar categoria..."
                      className="h-12"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCategoryDelete(null)}
                    className="cursor-pointer flex-1 py-3 rounded-full border border-djon-text/15 text-djon-text/60 text-xs font-black tracking-widest transition-opacity hover:opacity-70"
                    type="button"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={confirmDeleteCategory}
                    disabled={categoryDeleteCount > 0 && !transferCategory}
                    className="cursor-pointer flex-1 py-3 rounded-full bg-djon-warning-red/80 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-djon-text text-xs font-black tracking-widest transition-colors"
                    type="button"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-50 bg-djon-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll bg-djon-calendar-cell border border-djon-text/10 rounded-2xl p-6 max-w-sm w-full my-6 max-h-[calc(100svh-3rem)] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <p className="text-djon-text font-black text-lg mb-2">
                Remover material?
              </p>
              <p className="text-djon-text/40 text-sm mb-6">
                O material e seus anexos serão removidos. Você poderá desfazer
                pelo aviso exibido em seguida.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="cursor-pointer flex-1 py-3 rounded-full border border-djon-text/15 text-djon-text/60 text-xs font-black tracking-widest transition-opacity hover:opacity-70"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="cursor-pointer flex-1 py-3 rounded-full bg-djon-warning-red/80 hover:brightness-110 text-djon-text text-xs font-black tracking-widest transition-colors"
                >
                  REMOVER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
