import { ShimmerSkeleton } from "@/components/loading-skeletons"

export default function Loading() {
  return (
    <main className="min-h-svh bg-djon-page p-4 sm:p-8" aria-busy="true" role="status">
      <span className="sr-only">Carregando página...</span>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <ShimmerSkeleton className="h-12 w-36 rounded-xl" />
          <ShimmerSkeleton className="h-10 w-28 rounded-full" />
        </div>
        <ShimmerSkeleton className="h-[min(70svh,680px)] rounded-3xl" />
      </div>
    </main>
  )
}
