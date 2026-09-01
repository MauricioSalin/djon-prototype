"use client";

import { Pencil } from "lucide-react";

export function LandingEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-5 right-5 z-30 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-djon-text/15 bg-djon-black/75 px-4 py-2 text-xs font-black tracking-widest text-djon-text shadow-2xl backdrop-blur-md transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
    >
      <Pencil size={13} /> EDITAR
    </button>
  );
}
