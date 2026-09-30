// Revisions describe server data, never UI state or an unsaved form draft.
export const PORTAL_RESOURCES = [
  "users", "events", "bookings", "materials", "courses", "units",
  "equipments", "leads", "notifications", "portal-content", "landing-content", "audit",
] as const;
export type PortalResource = (typeof PORTAL_RESOURCES)[number];
const epochs = new Map<PortalResource, number>();
const versions = new Map<PortalResource, number>();
const listeners = new Set<() => void>();
const invalidators = new Set<(resources: PortalResource[]) => void>();
const writes = new Set<Promise<void>>();
const failedReads = new Set<PortalResource>();
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let streamReady = false;
let resolveStreamReady: ((ready: boolean) => void) | undefined;
let streamReadyPromise: Promise<boolean> = Promise.resolve(false);
let snapshotStartedAfterStreamReady = false;

export function preparePortalStream() {
  if (streamReady || resolveStreamReady) return;
  streamReadyPromise = new Promise<boolean>((resolve) => {
    resolveStreamReady = resolve;
  });
}

export function resetPortalStreamSession() {
  streamReady = false;
  resolveStreamReady?.(false);
  resolveStreamReady = undefined;
  streamReadyPromise = Promise.resolve(false);
  snapshotStartedAfterStreamReady = false;
}

export function markPortalStreamReady() {
  streamReady = true;
  resolveStreamReady?.(true);
  resolveStreamReady = undefined;
}

export function markPortalStreamUnavailable() {
  resolveStreamReady?.(false);
  resolveStreamReady = undefined;
}

export async function waitForPortalStreamReady(timeoutMs = 3_000) {
  if (streamReady) return true;
  return Promise.race([
    streamReadyPromise,
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
}

export function markPortalSnapshotStart(startedAfterReady: boolean) {
  snapshotStartedAfterStreamReady = startedAfterReady;
}

export function portalSnapshotCoversInitialReady() {
  return snapshotStartedAfterStreamReady;
}

export function retryDataRead(resources: PortalResource[]) {
  resources.forEach((resource) => failedReads.add(resource));
  if (retryTimer || !failedReads.size) return;
  retryTimer = setTimeout(() => {
    retryTimer = undefined;
    const retry = [...failedReads];
    failedReads.clear();
    if (retry.length) invalidateData(retry);
  }, 2_000);
}

export function markDataReadSucceeded(resources: readonly PortalResource[]) {
  resources.forEach((resource) => failedReads.delete(resource));
}

export function resourcesForPath(path: string): PortalResource[] {
  const root = path.split(/[/?]/)[1];
  if (root === "search") return ["users", "events", "materials"];
  if (root === "audit-logs") return ["audit"];
  return PORTAL_RESOURCES.includes(root as PortalResource) ? [root as PortalResource] : [];
}

export function dataEpoch(resources: readonly PortalResource[] = PORTAL_RESOURCES) {
  return resources.map((resource) => epochs.get(resource) ?? 0).join(":");
}

export function dataVersion(resources: readonly PortalResource[]) {
  return resources.map((resource) => versions.get(resource) ?? 0).join(":");
}

export function invalidateData(resources: readonly PortalResource[] = PORTAL_RESOURCES) {
  const affected = new Set(resources);
  // These responses contain populated references / calculated balances.
  if (affected.has("users")) ["events", "bookings", "courses"].forEach((r) => affected.add(r as PortalResource));
  if (affected.has("courses")) ["bookings", "materials"].forEach((r) => affected.add(r as PortalResource));
  if (affected.has("units") || affected.has("equipments")) affected.add("bookings");
  for (const resource of affected) epochs.set(resource, (epochs.get(resource) ?? 0) + 1);
  invalidators.forEach((listener) => listener([...affected]));
}

function advanceDataEpoch(resources: readonly PortalResource[]) {
  for (const resource of resources) {
    epochs.set(resource, (epochs.get(resource) ?? 0) + 1);
  }
}

export function publishData(resources: readonly PortalResource[]) {
  for (const resource of resources) versions.set(resource, (versions.get(resource) ?? 0) + 1);
  listeners.forEach((listener) => listener());
}

export function subscribeData(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function onDataInvalidated(listener: (resources: PortalResource[]) => void) {
  invalidators.add(listener);
  return () => { invalidators.delete(listener); };
}

export function beginDataWrite(
  resources: PortalResource[],
  options: { notifyInvalidators?: boolean } = {},
) {
  let complete!: () => void;
  const pending = new Promise<void>((resolve) => { complete = resolve; });
  writes.add(pending);
  const invalidate = options.notifyInvalidators === false
    ? () => advanceDataEpoch(resources)
    : () => invalidateData(resources);
  invalidate();
  return () => {
    writes.delete(pending);
    invalidate();
    complete();
  };
}

export async function waitForDataWrites() {
  while (writes.size) await Promise.all([...writes]);
}
