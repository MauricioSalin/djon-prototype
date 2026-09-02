"use client";

import { useSyncExternalStore } from "react";
import { CURRENT_USER_UPDATED_EVENT, store } from "@/lib/store";

function subscribe(onChange: () => void) {
  window.addEventListener(CURRENT_USER_UPDATED_EVENT, onChange);
  return () => window.removeEventListener(CURRENT_USER_UPDATED_EVENT, onChange);
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, store.getCurrentUser, () => null);
}
