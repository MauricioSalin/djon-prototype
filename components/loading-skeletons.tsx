"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type SkeletonProps = React.ComponentProps<"div">

export function ShimmerSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "djon-skeleton overflow-hidden border border-djon-text/6 bg-djon-text/6",
        className,
      )}
      {...props}
    />
  )
}

export type DashboardSkeletonVariant =
  | "list"
  | "grid"
  | "dashboard"
  | "admin-dashboard"
  | "agenda"
  | "student-agenda"
  | "form"
  | "profile"
  | "material"
  | "article"
  | "editor"
  | "courses"
  | "cohorts"
  | "people"
  | "people-grid"
  | "equipment"
  | "units"
  | "notifications"
  | "audit"
  | "settings"
  | "booking"
  | "events"
  | "admin-events"
  | "leads"

type DashboardPageSkeletonProps = {
  variant?: DashboardSkeletonVariant
  rows?: number
}

function LoadingFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("min-h-[calc(100svh-4rem)] bg-djon-page", className)}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">Carregando conteúdo...</span>
      {children}
    </div>
  )
}

function PageHeading({
  action = true,
  description = false,
}: {
  action?: boolean
  description?: boolean
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-3 w-28 rounded-full" />
        <ShimmerSkeleton className="h-9 w-48 max-w-[70vw] rounded-lg" />
        {description ? (
          <ShimmerSkeleton className="h-3 w-80 max-w-[80vw] rounded-md" />
        ) : null}
      </div>
      {action ? <ShimmerSkeleton className="h-11 w-40 rounded-full" /> : null}
    </header>
  )
}

function Hero({ article = false }: { article?: boolean }) {
  return (
    <section
      className={cn(
        "djon-portal-hero relative flex overflow-hidden bg-djon-black",
        article ? "items-end" : "items-center",
      )}
    >
      <ShimmerSkeleton className="absolute inset-0 rounded-none border-0 bg-djon-text/[0.035]" />
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-7xl flex-col px-4 py-14 sm:px-6 sm:py-16",
        )}
      >
        <ShimmerSkeleton className="mb-4 h-3 w-36 rounded-full" />
        <ShimmerSkeleton className="h-12 w-[min(34rem,82vw)] rounded-xl sm:h-16" />
        <ShimmerSkeleton className="mt-4 h-[3px] w-10 rounded-full bg-djon-accent/15" />
        <div className="mt-4 space-y-2">
          <ShimmerSkeleton className="h-4 w-[min(28rem,72vw)] rounded-md" />
          <ShimmerSkeleton className="h-4 w-[min(21rem,58vw)] rounded-md" />
        </div>
      </div>
    </section>
  )
}

function MaterialCards({ rows = 8 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: rows }, (_, index) => (
        <article
          key={index}
          className="min-h-[322px] overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/4"
        >
          <ShimmerSkeleton className="h-44 w-full rounded-none border-0" />
          <div className="space-y-3 p-4">
            <ShimmerSkeleton className="h-4 w-4/5 rounded-md" />
            <ShimmerSkeleton className="h-3 w-full rounded-md" />
            <ShimmerSkeleton className="h-3 w-2/3 rounded-md" />
            <div className="flex items-center gap-2 pt-7">
              <ShimmerSkeleton className="size-5 rounded-full" />
              <ShimmerSkeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function MaterialSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-20 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[72, 104, 82, 126, 98].map((width) => (
              <ShimmerSkeleton
                key={width}
                className="h-9 rounded-full"
                style={{ width }}
              />
            ))}
          </div>
          <ShimmerSkeleton className="h-11 w-44 rounded-full" />
        </div>
        <MaterialCards rows={rows} />
      </div>
    </LoadingFrame>
  )
}

function ArticleSkeleton() {
  return (
    <LoadingFrame>
      <Hero article />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-wrap gap-3 border-b border-djon-text/8 pb-6">
          <ShimmerSkeleton className="h-10 w-28 rounded-full" />
          <ShimmerSkeleton className="h-10 w-36 rounded-full" />
        </div>
        <div className="space-y-4">
          {[100, 94, 98, 72, 96, 88, 63].map((width, index) => (
            <ShimmerSkeleton
              key={index}
              className="h-4 rounded-md"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
        <ShimmerSkeleton className="aspect-video w-full rounded-2xl" />
      </article>
    </LoadingFrame>
  )
}

function EditorSkeleton() {
  return (
    <LoadingFrame>
      <Hero />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2">
          <div className="space-y-5 p-5 sm:p-6">
            <ShimmerSkeleton className="h-14 w-full rounded-xl" />
            <ShimmerSkeleton className="h-24 w-full rounded-xl" />
            <div className="flex gap-2 border-y border-djon-text/8 py-3">
              {Array.from({ length: 7 }, (_, index) => (
                <ShimmerSkeleton key={index} className="size-9 rounded-lg" />
              ))}
            </div>
            <ShimmerSkeleton className="h-72 w-full rounded-xl" />
          </div>
        </section>
        <aside className="space-y-5">
          <ShimmerSkeleton className="h-56 rounded-2xl" />
          <ShimmerSkeleton className="h-44 rounded-2xl" />
          <ShimmerSkeleton className="h-12 rounded-full bg-djon-accent/10" />
        </aside>
      </main>
    </LoadingFrame>
  )
}

function CompactCards({
  rows = 4,
  columns = 2,
}: {
  rows?: number
  columns?: 2 | 3
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2",
      )}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5"
        >
          <div className="flex items-start gap-3">
            <ShimmerSkeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <ShimmerSkeleton className="h-4 w-3/5 rounded-md" />
              <ShimmerSkeleton className="h-3 w-2/5 rounded-md" />
              <ShimmerSkeleton className="h-3 w-4/5 rounded-md" />
            </div>
            <ShimmerSkeleton className="size-8 rounded-full" />
          </div>
          <ShimmerSkeleton className="mt-5 h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ListRows({
  rows = 6,
  avatar = true,
}: {
  rows?: number
  avatar?: boolean
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-4"
        >
          {avatar ? (
            <ShimmerSkeleton className="size-11 shrink-0 rounded-full" />
          ) : (
            <ShimmerSkeleton className="h-11 w-2 shrink-0 rounded-full" />
          )}
          <div className="min-w-0 flex-1 space-y-2.5">
            <ShimmerSkeleton className="h-4 w-[min(15rem,65%)] rounded-md" />
            <ShimmerSkeleton className="h-3 w-[min(22rem,82%)] rounded-md" />
          </div>
          <div className="hidden gap-2 sm:flex">
            <ShimmerSkeleton className="size-8 rounded-full" />
            <ShimmerSkeleton className="size-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DirectorySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading />
        <ShimmerSkeleton className="h-12 w-full rounded-xl" />
        <ListRows rows={rows} />
      </main>
    </LoadingFrame>
  )
}

function CoursesSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading />
        <MaterialCards rows={rows} />
      </main>
    </LoadingFrame>
  )
}

function CohortsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <Hero />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <ShimmerSkeleton className="h-11 min-w-0 flex-1 rounded-xl" />
          <ShimmerSkeleton className="h-11 rounded-xl lg:w-52" />
          <ShimmerSkeleton className="h-11 rounded-full bg-djon-accent/10 lg:w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: rows }, (_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmerSkeleton className="h-3 w-28 rounded-md bg-djon-accent/10" />
                  <ShimmerSkeleton className="h-6 w-48 max-w-[80%] rounded-md" />
                  <ShimmerSkeleton className="h-3 w-56 max-w-full rounded-md" />
                </div>
                <ShimmerSkeleton className="h-7 w-20 shrink-0 rounded-full" />
              </div>
              <ShimmerSkeleton className="mt-5 h-2 w-full rounded-full" />
              <ShimmerSkeleton className="mt-3 h-3 w-28 rounded-md" />
            </article>
          ))}
        </div>
      </main>
    </LoadingFrame>
  )
}

function NotificationsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading description />
        <div className="flex flex-wrap gap-2">
          {[126, 112, 132, 98].map((width) => (
            <ShimmerSkeleton
              key={width}
              className="h-9 rounded-full"
              style={{ width }}
            />
          ))}
        </div>
        <ShimmerSkeleton className="h-12 w-full rounded-xl" />
        <ListRows rows={rows} avatar={false} />
      </main>
    </LoadingFrame>
  )
}

function AgendaSkeleton() {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ShimmerSkeleton className="h-10 w-56 rounded-xl" />
          <div className="flex gap-2">
            <ShimmerSkeleton className="h-10 w-28 rounded-xl" />
            <ShimmerSkeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid min-h-[520px] grid-cols-7 gap-px overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/8">
          {Array.from({ length: 42 }, (_, index) => (
            <div
              key={index}
              className="min-h-20 bg-djon-calendar-cell p-2 sm:min-h-28"
            >
              <ShimmerSkeleton className="size-5 rounded-full" />
              {index % 5 === 2 ? (
                <ShimmerSkeleton className="mt-5 h-7 w-full rounded-md" />
              ) : null}
            </div>
          ))}
        </div>
      </main>
    </LoadingFrame>
  )
}

function PortalSkeleton() {
  return (
    <LoadingFrame>
      <section className="djon-portal-hero relative flex items-center overflow-hidden bg-djon-black">
        <ShimmerSkeleton className="absolute inset-0 rounded-none border-0 bg-djon-text/[0.035]" />
        <div className="relative mx-auto w-full max-w-7xl space-y-5 px-4 py-14 sm:px-6 sm:py-16">
          <ShimmerSkeleton className="h-3 w-36 rounded-full" />
          <ShimmerSkeleton className="h-14 w-[min(38rem,85vw)] rounded-xl sm:h-20" />
          <ShimmerSkeleton className="h-4 w-[min(30rem,75vw)] rounded-md" />
          <div className="flex gap-3 pt-3">
            <ShimmerSkeleton className="h-12 w-40 rounded-full" />
            <ShimmerSkeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-7 px-4 py-16 sm:px-6">
        <ShimmerSkeleton className="h-9 w-60 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      </section>
    </LoadingFrame>
  )
}

function ProfileSkeleton() {
  const pathname = usePathname()
  const showsBackBar = /^\/dashboard\/perfil\/[^/]+\/?$/.test(pathname)

  return (
    <LoadingFrame>
      {showsBackBar ? (
        <div className="border-b border-djon-text/8 bg-djon-page">
          <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-4 sm:px-6">
            <ShimmerSkeleton className="size-3 rounded-full border-0" />
            <ShimmerSkeleton className="h-3 w-12 rounded-full border-0" />
          </div>
        </div>
      ) : null}

      <main>
        <section className="relative overflow-hidden">
          <ShimmerSkeleton className="absolute inset-0 rounded-none border-0" />
          <div aria-hidden="true" className="h-56 md:h-72" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative z-10 -mt-14 flex flex-col items-start gap-4 pb-2 sm:flex-row sm:items-end sm:gap-5 md:-mt-16">
              <ShimmerSkeleton className="size-24 shrink-0 rounded-full border-4 border-djon-page sm:size-28 md:size-36" />
              <div className="min-w-0 flex-1 space-y-2 pb-2">
                <ShimmerSkeleton className="h-5 w-40 rounded-full border-0 bg-djon-accent/10" />
                <ShimmerSkeleton className="h-10 w-72 max-w-[80vw] rounded-lg sm:h-12" />
              </div>
            </div>

            <div className="space-y-2 pb-8 pt-4">
              <ShimmerSkeleton className="h-4 w-[min(31rem,82vw)] rounded-md" />
              <ShimmerSkeleton className="h-4 w-[min(23rem,68vw)] rounded-md" />
            </div>
          </div>
        </section>

        <section className="border-t border-djon-text/6 bg-djon-page py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 space-y-2">
              <ShimmerSkeleton className="h-3 w-20 rounded-full border-0 bg-djon-accent/10" />
              <ShimmerSkeleton className="h-10 w-64 max-w-[80vw] rounded-lg sm:h-12" />
              <ShimmerSkeleton className="h-[3px] w-10 rounded-full border-0 bg-djon-accent/15" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5">
                <ShimmerSkeleton className="size-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmerSkeleton className="h-3 w-20 rounded-md" />
                  <ShimmerSkeleton className="h-3 w-28 max-w-full rounded-md" />
                </div>
                <ShimmerSkeleton className="size-3 shrink-0 rounded-full border-0" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </LoadingFrame>
  )
}

function AdminDashboardSkeleton() {
  return (
    <LoadingFrame>
      <Hero />
      <section className="bg-djon-muted-panel py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <PageHeading action={false} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <ShimmerSkeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
      <section className="bg-djon-page py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <PageHeading action={false} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <ShimmerSkeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </LoadingFrame>
  )
}

function StudentAgendaSkeleton() {
  return (
    <LoadingFrame>
      <Hero />
      <section className="bg-djon-muted-panel py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 grid gap-3 rounded-2xl border border-djon-accent/15 bg-djon-accent/5 p-4 sm:grid-cols-3 sm:p-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-3">
                <ShimmerSkeleton className="h-3 w-28 rounded-md" />
                <ShimmerSkeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <ShimmerSkeleton className="h-3 w-20 rounded-full bg-djon-accent/10" />
              <ShimmerSkeleton className="h-10 w-72 max-w-[75vw] rounded-lg sm:h-12" />
              <ShimmerSkeleton className="h-[3px] w-10 rounded-full bg-djon-accent/15" />
            </div>
            <ShimmerSkeleton className="h-11 w-48 rounded-full bg-djon-accent/10" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <ShimmerSkeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </LoadingFrame>
  )
}

function FormSkeleton({ booking = false }: { booking?: boolean }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading action={false} description={booking} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 sm:p-6">
            {Array.from({ length: booking ? 6 : 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <ShimmerSkeleton className="h-3 w-24 rounded-md" />
                <ShimmerSkeleton
                  className={cn(
                    "w-full rounded-xl",
                    index === 3 && !booking ? "h-40" : "h-12",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <ShimmerSkeleton className="h-56 rounded-2xl" />
            <ShimmerSkeleton className="h-12 rounded-full bg-djon-accent/10" />
          </div>
        </div>
      </main>
    </LoadingFrame>
  )
}

function AuditSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading action={false} description />
        <div className="flex gap-3">
          <ShimmerSkeleton className="h-11 flex-1 rounded-xl" />
          <ShimmerSkeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-djon-text/8">
          <ShimmerSkeleton className="h-12 rounded-none border-0" />
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1.5fr_1fr] gap-4 border-t border-djon-text/8 p-4"
            >
              <ShimmerSkeleton className="h-3 rounded-md" />
              <ShimmerSkeleton className="h-3 rounded-md" />
              <ShimmerSkeleton className="h-3 rounded-md" />
            </div>
          ))}
        </div>
      </main>
    </LoadingFrame>
  )
}

function EventsSkeleton() {
  return (
    <LoadingFrame>
      <Hero />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between">
          <ShimmerSkeleton className="h-9 w-52 rounded-lg" />
          <ShimmerSkeleton className="h-11 w-40 rounded-full" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      </main>
    </LoadingFrame>
  )
}

function SettingsSkeleton() {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading action={false} />
        <section className="overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2">
          <ShimmerSkeleton className="h-28 w-full rounded-none border-0" />
          <div className="flex items-end gap-4 px-5 pb-6">
            <ShimmerSkeleton className="-mt-8 size-14 shrink-0 rounded-full border-4 border-djon-surface-2" />
            <div className="space-y-2 pb-1">
              <ShimmerSkeleton className="h-5 w-40 rounded-md" />
              <ShimmerSkeleton className="h-3 w-28 rounded-md bg-djon-accent/10" />
            </div>
          </div>
        </section>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <section className="space-y-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5">
          <ShimmerSkeleton className="h-3 w-32 rounded-md bg-djon-accent/10" />
          <ShimmerSkeleton className="h-7 w-40 rounded-md" />
          <ShimmerSkeleton className="h-11 w-full rounded-xl" />
          <ShimmerSkeleton className="h-24 w-full rounded-xl" />
          {Array.from({ length: 3 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
          <ShimmerSkeleton className="h-12 w-full rounded-xl bg-djon-accent/10" />
        </section>
      </main>
    </LoadingFrame>
  )
}

function LeadsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading />
        {Array.from({ length: rows }, (_, index) => (
          <section
            key={index}
            className="grid gap-5 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div className="space-y-3">
              <ShimmerSkeleton className="h-5 w-48 max-w-[70%] rounded-md" />
              <ShimmerSkeleton className="h-3 w-56 max-w-[85%] rounded-md" />
              <ShimmerSkeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-3">
              <ShimmerSkeleton className="h-11 w-full rounded-xl" />
              <ShimmerSkeleton className="h-20 w-full rounded-xl" />
              <ShimmerSkeleton className="h-10 w-full rounded-xl bg-djon-accent/10" />
            </div>
          </section>
        ))}
      </main>
    </LoadingFrame>
  )
}

function AdminEventsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LoadingFrame>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeading />
        <div className="flex flex-wrap gap-2">
          {[104, 118, 92].map((width) => (
            <ShimmerSkeleton
              key={width}
              className="h-9 rounded-full"
              style={{ width }}
            />
          ))}
        </div>
        <ListRows rows={rows} avatar={false} />
      </main>
    </LoadingFrame>
  )
}

export function DashboardPageSkeleton({
  variant = "list",
  rows,
}: DashboardPageSkeletonProps) {
  if (variant === "dashboard") return <PortalSkeleton />
  if (variant === "admin-dashboard") return <AdminDashboardSkeleton />
  if (variant === "agenda") return <AgendaSkeleton />
  if (variant === "student-agenda") return <StudentAgendaSkeleton />
  if (variant === "material") return <MaterialSkeleton rows={rows} />
  if (variant === "article") return <ArticleSkeleton />
  if (variant === "editor") return <EditorSkeleton />
  if (variant === "courses" || variant === "grid")
    return <CoursesSkeleton rows={rows ?? 8} />
  if (variant === "cohorts") return <CohortsSkeleton rows={rows ?? 4} />
  if (variant === "people" || variant === "list")
    return <DirectorySkeleton rows={rows ?? 6} />
  if (variant === "people-grid")
    return (
      <LoadingFrame>
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <PageHeading action={false} />
          <CompactCards rows={rows ?? 6} />
        </main>
      </LoadingFrame>
    )
  if (variant === "equipment" || variant === "units")
    return (
      <LoadingFrame>
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <PageHeading />
          <CompactCards rows={rows ?? 4} />
        </main>
      </LoadingFrame>
    )
  if (variant === "notifications") return <NotificationsSkeleton rows={rows} />
  if (variant === "audit") return <AuditSkeleton rows={rows} />
  if (variant === "profile") return <ProfileSkeleton />
  if (variant === "booking") return <FormSkeleton booking />
  if (variant === "settings") return <SettingsSkeleton />
  if (variant === "form") return <FormSkeleton />
  if (variant === "events") return <EventsSkeleton />
  if (variant === "admin-events") return <AdminEventsSkeleton rows={rows} />
  if (variant === "leads") return <LeadsSkeleton rows={rows} />
  return <DirectorySkeleton rows={rows} />
}

export function getDashboardSkeletonVariant(
  pathname: string,
): DashboardSkeletonVariant {
  if (/\/material\/novo\/?$/.test(pathname)) return "editor"
  if (/\/material\/cursos\//.test(pathname)) return "material"
  if (/\/material\/[^/]+\/?$/.test(pathname)) return "article"
  if (/\/material\/?$/.test(pathname)) return "material"
  if (/\/agenda\/?$/.test(pathname)) return "agenda"
  if (/\/admin\/?$/.test(pathname)) return "admin-dashboard"
  if (/\/(student|professor)\/?$/.test(pathname)) return "dashboard"
  if (/\/cursos\/?$/.test(pathname)) return "courses"
  if (/\/turmas\/?$/.test(pathname)) return "cohorts"
  if (/\/notificacoes\/?$/.test(pathname)) return "notifications"
  if (/\/auditoria\/?$/.test(pathname)) return "audit"
  if (/\/equipamentos\/?$/.test(pathname)) return "equipment"
  if (/\/unidades\/?$/.test(pathname)) return "units"
  if (/\/config\/?$/.test(pathname)) return "settings"
  if (/\/admin\/leads\/?$/.test(pathname)) return "leads"
  if (/\/student\/agendar\/?$/.test(pathname)) return "student-agenda"
  if (/\/agendar\/?$/.test(pathname)) return "booking"
  if (/\/admin\/eventos\/?$/.test(pathname)) return "admin-events"
  if (/\/(evento|mural)\/?$/.test(pathname)) return "events"
  if (/\/perfil(\/|$)/.test(pathname)) return "profile"
  if (/\/(student|professor)\/professores\/?$/.test(pathname))
    return "people-grid"
  if (/\/(alunos|professores)\/?$/.test(pathname)) return "people"
  return "people"
}

export function DashboardShellSkeleton() {
  const pathname = usePathname()

  return (
    <div className="min-h-svh bg-djon-page">
      <div className="fixed inset-x-0 top-0 z-20 flex h-[var(--djon-header-offset)] pt-[var(--djon-safe-area-top)] items-center gap-5 border-b border-djon-text/8 bg-djon-page px-4 sm:px-6">
        <ShimmerSkeleton className="h-9 w-28 rounded-lg" />
        <div className="hidden min-w-0 flex-1 gap-3 md:flex">
          {Array.from({ length: 7 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <ShimmerSkeleton className="ml-auto size-9 rounded-full" />
        <ShimmerSkeleton className="h-10 w-36 rounded-full" />
      </div>
      <main className="pt-[var(--djon-header-offset)]">
        <DashboardPageSkeleton
          variant={getDashboardSkeletonVariant(pathname)}
        />
      </main>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-djon-page px-4 py-8">
      <ShimmerSkeleton className="absolute inset-0 rounded-none border-0 bg-djon-text/[0.035]" />
      <div className="relative w-full max-w-md space-y-10">
        <ShimmerSkeleton className="mx-auto h-14 w-40 rounded-xl" />
        <div className="space-y-6 rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-8">
          <div className="space-y-2">
            <ShimmerSkeleton className="h-3 w-28 rounded-full" />
            <ShimmerSkeleton className="h-9 w-52 rounded-lg" />
            <ShimmerSkeleton className="h-[3px] w-10 rounded-full bg-djon-accent/15" />
          </div>
          <div className="space-y-4">
            <ShimmerSkeleton className="h-12 w-full rounded-xl" />
            <ShimmerSkeleton className="h-12 w-full rounded-xl" />
            <ShimmerSkeleton className="h-12 w-full rounded-xl bg-djon-accent/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

function LandingSkeleton() {
  return (
    <div className="min-h-svh bg-djon-page">
      <header className="flex h-20 items-center gap-8 border-b border-djon-text/8 px-4 sm:px-8">
        <ShimmerSkeleton className="h-12 w-36 rounded-xl" />
        <div className="ml-auto hidden gap-3 md:flex">
          {Array.from({ length: 5 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <ShimmerSkeleton className="h-11 w-32 rounded-full" />
      </header>
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-djon-black">
        <ShimmerSkeleton className="absolute inset-0 rounded-none border-0 bg-djon-text/[0.035]" />
        <div className="relative mx-auto w-full max-w-7xl space-y-5 px-4 py-20 sm:px-8">
          <ShimmerSkeleton className="h-3 w-40 rounded-full" />
          <ShimmerSkeleton className="h-16 w-[min(46rem,88vw)] rounded-xl sm:h-24" />
          <ShimmerSkeleton className="h-16 w-[min(36rem,72vw)] rounded-xl sm:h-24" />
          <div className="space-y-2 pt-3">
            <ShimmerSkeleton className="h-4 w-[min(32rem,75vw)] rounded-md" />
            <ShimmerSkeleton className="h-4 w-[min(24rem,60vw)] rounded-md" />
          </div>
          <ShimmerSkeleton className="mt-6 h-12 w-44 rounded-full bg-djon-accent/10" />
        </div>
      </section>
    </div>
  )
}

function BrandSkeleton() {
  return (
    <div className="min-h-svh bg-djon-page px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex items-center justify-between">
          <ShimmerSkeleton className="h-12 w-36 rounded-xl" />
          <ShimmerSkeleton className="h-10 w-32 rounded-full" />
        </header>
        <section className="space-y-4">
          <ShimmerSkeleton className="h-3 w-28 rounded-full" />
          <ShimmerSkeleton className="h-14 w-[min(36rem,80vw)] rounded-xl" />
          <ShimmerSkeleton className="h-4 w-[min(30rem,70vw)] rounded-md" />
        </section>
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {["bg-djon-black", "bg-djon-accent/10", "bg-djon-text/8", "bg-djon-surface-2"].map(
            (color) => (
              <div key={color} className="space-y-3">
                <ShimmerSkeleton className={cn("h-44 rounded-2xl", color)} />
                <ShimmerSkeleton className="h-4 w-24 rounded-md" />
              </div>
            ),
          )}
        </section>
        <div className="grid gap-5 lg:grid-cols-2">
          <ShimmerSkeleton className="h-72 rounded-3xl" />
          <ShimmerSkeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

export function AppRouteSkeleton() {
  const pathname = usePathname()
  if (pathname.startsWith("/login")) return <LoginSkeleton />
  if (pathname.startsWith("/brand")) return <BrandSkeleton />
  return <LandingSkeleton />
}
