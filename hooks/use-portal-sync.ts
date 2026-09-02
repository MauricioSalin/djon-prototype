"use client";

import { useEffect } from "react";
import { store, TOKEN_KEY } from "@/lib/store";
import { invalidateData, onDataInvalidated, publishData, type PortalResource } from "@/lib/portal-data";
import { openPortalStream } from "@/lib/portal-stream";

export function usePortalSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retryDelay = 2_000;
    const pending = new Set<PortalResource>();
    const flush = async () => {
      if (stopped || running || !pending.size || !store.hasSession() || document.visibilityState !== "visible" || !navigator.onLine) return;
      running = true;
      let failed = false;
      const resources = [...pending];
      pending.clear();
      try {
        await store.synchronize(resources);
        if (!stopped) publishData(resources);
        retryDelay = 2_000;
      } catch {
        failed = true;
        resources.forEach((resource) => pending.add(resource));
        retryDelay = Math.min(retryDelay * 2, 30_000);
      } finally {
        running = false;
        if (!stopped && pending.size) timer = setTimeout(() => { void flush(); }, failed ? retryDelay : 0);
      }
    };
    const unsubscribe = onDataInvalidated((resources) => {
      resources.forEach((resource) => pending.add(resource));
      clearTimeout(timer);
      timer = setTimeout(() => { void flush(); }, 100);
    });
    const resume = () => {
      if (document.visibilityState === "visible" && navigator.onLine) invalidateData();
    };
    const changedSession = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) window.location.reload();
    };
    const closeStream = openPortalStream();
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    window.addEventListener("pageshow", resume);
    window.addEventListener("storage", changedSession);
    document.addEventListener("visibilitychange", resume);
    return () => {
      stopped = true;
      clearTimeout(timer);
      closeStream();
      unsubscribe();
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("storage", changedSession);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [enabled]);

}
