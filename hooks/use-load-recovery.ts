"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { ApiError } from "@/lib/store";

export function isRetryableLoadError(error: unknown) {
  return error instanceof ApiError && (
    error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500
  );
}

// Recover read failures without asking the user to restart the page.
// Permanent responses (authentication, permissions, missing records) are not retried.
export function useLoadRecovery(
  error: unknown,
  setAttempt: Dispatch<SetStateAction<number>>,
) {
  const failures = useRef(0);

  useEffect(() => {
    if (!isRetryableLoadError(error)) return;

    let scheduled = false;
    const retry = () => {
      if (scheduled || document.visibilityState !== "visible" || !navigator.onLine) return;
      scheduled = true;
      setAttempt((value) => value + 1);
    };
    const timer = window.setTimeout(retry, Math.min(2_000 * 2 ** failures.current, 30_000));
    failures.current += 1;
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [error, setAttempt]);
}
