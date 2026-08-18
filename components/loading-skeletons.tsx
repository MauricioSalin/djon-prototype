import { cn } from "@/lib/utils"

type SkeletonProps = React.ComponentProps<"div">

export function ShimmerSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("djon-skeleton overflow-hidden bg-djon-text/7", className)}
      {...props}
    />
  )
}

type DashboardPageSkeletonProps = {
  variant?: "list" | "grid" | "dashboard" | "agenda" | "form" | "profile"
  rows?: number
}

function LoadingLabel() {
  return <span className="sr-only">Carregando conteúdo...</span>
}

function PageHeadingSkeleton() {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-3 w-24 rounded-full" />
        <ShimmerSkeleton className="h-9 w-52 max-w-[65vw] rounded-lg" />
      </div>
      <ShimmerSkeleton className="hidden h-10 w-36 rounded-full sm:block" />
    </div>
  )
}

function ListRows({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-4"
        >
          <ShimmerSkeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <ShimmerSkeleton className="h-4 w-[min(15rem,65%)] rounded-md" />
            <ShimmerSkeleton className="h-3 w-[min(22rem,82%)] rounded-md" />
            <ShimmerSkeleton className="h-3 w-[min(11rem,48%)] rounded-md" />
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

function GridCards({ rows }: { rows: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-surface-2"
        >
          <ShimmerSkeleton className="h-40 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <ShimmerSkeleton className="h-3 w-20 rounded-full" />
            <ShimmerSkeleton className="h-5 w-4/5 rounded-md" />
            <ShimmerSkeleton className="h-3 w-full rounded-md" />
            <ShimmerSkeleton className="h-3 w-2/3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardBlocks() {
  return (
    <>
      <ShimmerSkeleton className="h-52 rounded-3xl sm:h-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5">
            <ShimmerSkeleton className="mb-5 size-10 rounded-xl" />
            <ShimmerSkeleton className="mb-2 h-8 w-16 rounded-md" />
            <ShimmerSkeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>
      <ListRows rows={3} />
    </>
  )
}

function AgendaBlocks() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ShimmerSkeleton className="h-10 w-56 rounded-xl" />
        <div className="flex gap-2">
          <ShimmerSkeleton className="h-10 w-28 rounded-xl" />
          <ShimmerSkeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid min-h-[430px] grid-cols-7 gap-px overflow-hidden rounded-2xl border border-djon-text/8 bg-djon-text/8">
        {Array.from({ length: 35 }, (_, index) => (
          <div key={index} className="min-h-24 bg-djon-calendar-cell p-2">
            <ShimmerSkeleton className="size-5 rounded-full" />
            {index % 4 === 1 ? <ShimmerSkeleton className="mt-5 h-6 w-full rounded-md" /> : null}
          </div>
        ))}
      </div>
    </>
  )
}

function FormBlocks() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-5 sm:p-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <ShimmerSkeleton className="h-3 w-24 rounded-md" />
            <ShimmerSkeleton className={cn("w-full rounded-xl", index === 3 ? "h-52" : "h-12")} />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <ShimmerSkeleton className="h-56 rounded-2xl" />
        <ShimmerSkeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  )
}

function ProfileBlocks() {
  return (
    <>
      <ShimmerSkeleton className="h-60 rounded-3xl" />
      <div className="-mt-16 flex items-end gap-5 px-5">
        <ShimmerSkeleton className="size-28 shrink-0 rounded-full border-4 border-djon-page" />
        <div className="mb-3 flex-1 space-y-3">
          <ShimmerSkeleton className="h-7 w-56 max-w-full rounded-md" />
          <ShimmerSkeleton className="h-4 w-36 rounded-md" />
        </div>
      </div>
      <div className="grid gap-5 pt-5 lg:grid-cols-3">
        <ShimmerSkeleton className="h-44 rounded-2xl lg:col-span-2" />
        <ShimmerSkeleton className="h-44 rounded-2xl" />
      </div>
    </>
  )
}

export function DashboardPageSkeleton({
  variant = "list",
  rows = variant === "grid" ? 6 : 5,
}: DashboardPageSkeletonProps) {
  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <LoadingLabel />
      {variant !== "dashboard" && variant !== "agenda" ? <PageHeadingSkeleton /> : null}
      {variant === "dashboard" ? <DashboardBlocks /> : null}
      {variant === "agenda" ? <AgendaBlocks /> : null}
      {variant === "form" ? <FormBlocks /> : null}
      {variant === "profile" ? <ProfileBlocks /> : null}
      {variant === "list" ? (
        <>
          <ShimmerSkeleton className="h-11 w-full rounded-xl" />
          <ListRows rows={rows} />
        </>
      ) : null}
      {variant === "grid" ? (
        <>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <ShimmerSkeleton key={index} className="h-9 w-28 shrink-0 rounded-full" />
            ))}
          </div>
          <GridCards rows={rows} />
        </>
      ) : null}
    </div>
  )
}

export function DashboardShellSkeleton() {
  return (
    <div className="min-h-svh bg-djon-page">
      <div className="fixed inset-x-0 top-0 z-20 flex h-16 items-center gap-5 border-b border-djon-text/8 bg-djon-page px-4 sm:px-6">
        <ShimmerSkeleton className="h-9 w-28 rounded-lg" />
        <div className="hidden min-w-0 flex-1 gap-3 md:flex">
          {Array.from({ length: 6 }, (_, index) => (
            <ShimmerSkeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <ShimmerSkeleton className="ml-auto size-9 rounded-full" />
        <ShimmerSkeleton className="h-10 w-36 rounded-full" />
      </div>
      <main className="pt-16">
        <DashboardPageSkeleton variant="dashboard" />
      </main>
    </div>
  )
}
