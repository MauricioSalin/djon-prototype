"use client";

import { useSyncExternalStore } from "react";
import { dataVersion, subscribeData, type PortalResource } from "@/lib/portal-data";

export function usePortalRevision(...resources: PortalResource[]) {
  return useSyncExternalStore(subscribeData, () => dataVersion(resources), () => "");
}
