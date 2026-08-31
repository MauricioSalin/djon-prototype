"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  FileText,
  Lock,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react"
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination"
import { LockedCoverOverlay } from "@/components/locked-cover-overlay"
import type { Course, Material, User } from "@/lib/store"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.45,
    ease: [0.25, 0.4, 0.25, 1] as const,
    delay,
  },
})

function LessonThumb({ lesson }: { lesson: Material }) {
  const [error, setError] = useState(false)

  if (lesson.coverImage && !error) {
    return (
      <Image
        loader={({ src }) => src}
        unoptimized
        src={lesson.coverImage}
        alt={lesson.title || "Aula sem título"}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className={`object-cover ${lesson.locked ? "" : "transition-transform duration-500 group-hover:scale-105"}`}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-djon-surface to-djon-muted-panel">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-djon-accent/10">
        <FileText size={26} className="text-djon-accent" />
      </div>
      <span className="text-djon-label font-bold uppercase tracking-widest text-djon-text/30">
        Aula
      </span>
    </div>
  )
}

type MaterialCourseViewProps = {
  course: Course
  lessons: Material[]
  user: User
  canManage: boolean
  onBack: () => void
  onNewLesson: () => void
  onOpenLesson: (lesson: Material) => void
  onDeleteLesson: (lessonId: string) => Promise<void>
}

export function MaterialCourseView({
  course,
  lessons,
  user,
  canManage,
  onBack,
  onNewLesson,
  onOpenLesson,
  onDeleteLesson,
}: MaterialCourseViewProps) {
  const [coverError, setCoverError] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const pagination = useListPagination(lessons, course.id)

  const removeLesson = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await onDeleteLesson(deleteId)
      setDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-djon-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            key={course.coverImage ?? "material-hero"}
            loader={course.coverImage ? ({ src }) => src : undefined}
            unoptimized={Boolean(course.coverImage)}
            src={
              course.coverImage && !coverError
                ? course.coverImage
                : "/images/material-hero.png"
            }
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            priority
            onError={() => setCoverError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/85 to-djon-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <motion.span
            className="mb-4 block text-xs font-black uppercase tracking-[0.25em] text-djon-accent"
            {...fadeUp(0.05)}
          >
            CURSO
          </motion.span>
          <motion.h1
            className="djon-hero-title font-black text-djon-text"
            {...fadeUp(0.1)}
          >
            {course.name}
          </motion.h1>
          <motion.div
            className="mt-4 h-[3px] w-10 rounded-full bg-djon-accent"
            {...fadeUp(0.15)}
          />
          {course.description ? (
            <motion.p
              className="mt-4 max-w-md text-base leading-relaxed text-djon-text/40"
              {...fadeUp(0.2)}
            >
              {course.description}
            </motion.p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mb-10 mt-4 max-w-7xl px-4 sm:mb-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 cursor-pointer items-center gap-2 text-xs font-black tracking-widest text-djon-text/45 transition-colors hover:text-djon-text"
          >
            <ArrowLeft size={14} /> VOLTAR PARA CURSOS
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={onNewLesson}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-djon-accent px-6 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90"
            >
              <Plus size={14} /> NOVA AULA
            </button>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
        {lessons.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagination.paginatedItems.map((lesson, index) => (
              <motion.article
                key={lesson.id}
                className={`group flex min-h-[322px] flex-col overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/4 transition-all ${lesson.locked ? "cursor-not-allowed" : "cursor-pointer hover:brightness-110"}`}
                {...fadeUp(index * 0.025)}
                whileHover={lesson.locked ? undefined : { y: -4 }}
                onClick={() => !lesson.locked && onOpenLesson(lesson)}
              >
                <div className="relative h-44 overflow-hidden bg-djon-muted-panel">
                  <LessonThumb
                    key={lesson.coverImage ?? "empty"}
                    lesson={lesson}
                  />
                  {lesson.locked ? <LockedCoverOverlay /> : null}
                  <div className="absolute left-3 top-3 z-20">
                    <span className="rounded-full border border-djon-text/10 bg-djon-page/80 px-2.5 py-1 text-djon-caption font-black uppercase tracking-widest text-djon-text/50 backdrop-blur-sm">
                      {lesson.status === "draft"
                        ? "RASCUNHO"
                        : `AULA ${(pagination.page - 1) * pagination.pageSize + index + 1}`}
                    </span>
                  </div>
                  {lesson.attachments?.length ? (
                    <div className="absolute right-3 top-3 z-20">
                      <span className="flex items-center gap-1 rounded-full border border-djon-text/10 bg-djon-page/80 px-2.5 py-1 text-djon-caption font-black uppercase tracking-widest text-djon-text/60 backdrop-blur-sm">
                        <Paperclip size={9} /> {lesson.attachments.length}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-1 line-clamp-2 text-sm font-black leading-snug text-djon-text">
                    {lesson.title || "Rascunho sem título"}
                  </p>
                  {lesson.description ? (
                    <p className="line-clamp-3 text-xs leading-relaxed text-djon-text/35">
                      {lesson.description}
                    </p>
                  ) : null}
                  {lesson.status === "draft" ? (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-djon-accent/10 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-accent">
                      <Edit2 size={10} /> CONTINUAR EDIÇÃO
                    </span>
                  ) : null}
                  {lesson.locked ? (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-djon-text/10 px-2.5 py-1 text-djon-caption font-black tracking-widest text-djon-text/40">
                      <Lock size={10} /> LIBERA APÓS A AULA
                    </span>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <div className="djon-avatar-fallback flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                        {lesson.authorAvatar ? (
                          <Image
                            loader={({ src }) => src}
                            unoptimized
                            src={lesson.authorAvatar}
                            alt=""
                            width={20}
                            height={20}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-djon-micro font-black text-djon-accent">
                            {lesson.authorName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-djon-label font-bold text-djon-text/30">
                        {lesson.authorName || "DJ ON Academy"}
                      </span>
                    </div>
                    {canManage &&
                    (user.role === "admin" || lesson.authorId === user.id) ? (
                      <button
                        type="button"
                        aria-label={`Excluir aula ${lesson.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteId(lesson.id)
                        }}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-djon-warning-red/10 opacity-0 transition-all hover:brightness-110 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={12} className="text-djon-warning-red" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div className="py-24 text-center" {...fadeUp()}>
            <BookOpen size={40} className="mx-auto mb-4 text-djon-text/10" />
            <p className="text-lg font-bold text-djon-text/20">
              Este curso ainda não possui aulas
            </p>
          </motion.div>
        )}

        <ListPagination
          totalItems={lessons.length}
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </main>

      <AnimatePresence>
        {deleteId ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-djon-black/80 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) =>
              event.target === event.currentTarget && !deleting && setDeleteId(null)
            }
          >
            <motion.div
              className="my-6 w-full max-w-sm rounded-2xl border border-djon-text/10 bg-djon-calendar-cell p-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <p className="mb-2 text-lg font-black text-djon-text">
                Remover aula?
              </p>
              <p className="mb-6 text-sm text-djon-text/40">
                A aula e seus anexos serão removidos. Você poderá desfazer pelo
                aviso exibido em seguida.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-full border border-djon-text/15 py-3 text-xs font-black tracking-widest text-djon-text/60 disabled:opacity-40"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={() => void removeLesson()}
                  disabled={deleting}
                  className="flex-1 rounded-full bg-djon-warning-red/80 py-3 text-xs font-black tracking-widest text-djon-text transition-[filter] hover:brightness-110 disabled:opacity-40"
                >
                  {deleting ? "REMOVENDO..." : "REMOVER"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
