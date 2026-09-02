"use client";

import { friendlyErrorMessage } from "@/lib/feedback";

export function PortalLoadError({ error, onRetry }: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center sm:px-6">
      <p className="text-lg font-bold text-djon-text">Não foi possível carregar os dados.</p>
      <p className="max-w-md text-sm text-djon-text/50">{friendlyErrorMessage(error)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90"
      >
        TENTAR NOVAMENTE
      </button>
    </div>
  );
}
