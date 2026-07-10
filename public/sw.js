const SW_VERSION = "djon-pwa-v3"

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("message", (event) => {
  if (event.data === "version") {
    event.source?.postMessage(SW_VERSION)
  }
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  event.respondWith(fetch(event.request))
})

self.addEventListener("push", (event) => {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { body: event.data.text() }
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "DJ ON", {
      body: data.body || "Você tem uma nova atualização no portal.",
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: { url: data.url || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"))
})
