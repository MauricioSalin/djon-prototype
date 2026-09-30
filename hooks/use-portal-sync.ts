"use client";

import { useEffect } from "react";
import { store, TOKEN_KEY } from "@/lib/store";
import { invalidateData, onDataInvalidated, preparePortalStream, publishData, type PortalResource } from "@/lib/portal-data";
import { openPortalStream } from "@/lib/portal-stream";

export function usePortalSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    preparePortalStream();
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    let wasInactive = false;
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
    const suspend = () => {
      wasInactive = true;
    };
    const resume = () => {
      clearTimeout(resumeTimer);
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (!wasInactive) return;
      wasInactive = false;
      resumeTimer = setTimeout(() => invalidateData(), 100);
    };
    const visibilityChanged = () => {
      if (document.visibilityState !== "visible") {
        suspend();
        return;
      }
      resume();
    };
    const changedSession = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) window.location.reload();
    };
    const closeStream = openPortalStream();
    window.addEventListener("blur", suspend);
    window.addEventListener("offline", suspend);
    window.addEventListener("pagehide", suspend);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    window.addEventListener("pageshow", resume);
    window.addEventListener("storage", changedSession);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(resumeTimer);
      closeStream();
      unsubscribe();
      window.removeEventListener("blur", suspend);
      window.removeEventListener("offline", suspend);
      window.removeEventListener("pagehide", suspend);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("storage", changedSession);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [enabled]);

}
