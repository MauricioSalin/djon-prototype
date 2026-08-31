import { Lock } from "lucide-react"

export function LockedCoverOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-djon-black/60 backdrop-blur-[1px]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-djon-accent/35 bg-djon-page/85 shadow-[0_0_28px_rgba(133,255,42,0.12)]">
        <Lock size={23} strokeWidth={2.4} className="text-djon-accent" />
      </span>
      <span className="rounded-full border border-djon-text/10 bg-djon-page/75 px-3 py-1 text-djon-caption font-black tracking-widest text-djon-text/65 backdrop-blur-sm">
        BLOQUEADO
      </span>
    </div>
  )
}
