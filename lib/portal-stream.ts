import { apiBase, SESSION_EXPIRED_EVENT, TOKEN_KEY } from "@/lib/store";
import { invalidateData, PORTAL_RESOURCES, type PortalResource } from "@/lib/portal-data";

// fetch keeps credentials in the Authorization header, unlike EventSource URLs.
export function openPortalStream() {
  let stopped = false;
  let controller: AbortController | undefined;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let delay = 1_000;
  const connect = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (stopped || !token || document.visibilityState !== "visible" || !navigator.onLine || (controller && !controller.signal.aborted)) return;
    controller = new AbortController();
    const activeController = controller;
    const touch = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => activeController.abort(), 45_000);
    };
    touch();
    try {
      const response = await fetch(`${apiBase()}/sync/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        cache: "no-store", signal: activeController.signal,
      });
      if (token !== localStorage.getItem(TOKEN_KEY)) return;
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        return;
      }
      if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream") || !response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done || stopped) break;
        touch();
        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const lines = frame.split("\n");
          const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
          const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
          if (event === "ready") {
            delay = 1_000;
            // Includes everything missed while suspended, disconnected or deploying.
            invalidateData();
          } else if (event === "invalidate") {
            const payload = JSON.parse(data) as { resources?: string[] };
            const resources = payload.resources?.filter((resource): resource is PortalResource => PORTAL_RESOURCES.includes(resource as PortalResource));
            if (resources?.length) invalidateData(resources);
          } else if (event === "reset") {
            invalidateData();
          }
        }
      }
    } catch {
      // Reconnect to the change stream, then revalidate the complete snapshot.
    } finally {
      if (controller !== activeController) return;
      clearTimeout(watchdog);
      activeController.abort();
      if (!stopped) {
        reconnect = setTimeout(() => { void connect(); }, delay);
        delay = Math.min(delay * 2, 30_000);
      }
    }
  };
  const resume = () => {
    if (document.visibilityState !== "visible" || !navigator.onLine) {
      controller?.abort();
      return;
    }
    if (!controller || controller.signal.aborted) {
      clearTimeout(reconnect);
      void connect();
    }
  };
  window.addEventListener("online", resume);
  document.addEventListener("visibilitychange", resume);
  void connect();
  return () => {
    stopped = true;
    clearTimeout(reconnect);
    clearTimeout(watchdog);
    controller?.abort();
    window.removeEventListener("online", resume);
    document.removeEventListener("visibilitychange", resume);
  };
}
