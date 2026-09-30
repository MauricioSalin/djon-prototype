const SW_VERSION = "djon-pwa-v7"
const NAVIGATION_CACHE = `${SW_VERSION}-navigation`
const ASSET_CACHE = `${SW_VERSION}-assets`
const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.png",
  "/icons/djon-icon-180.png",
  "/icons/djon-icon-192.png",
  "/icons/djon-icon-512.png",
]

async function cacheDocumentAssets(response) {
  const html = await response.text()
  const urls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], self.location.origin))
    .filter(
      (url) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith("/_next/"),
    )
  const cache = await caches.open(ASSET_CACHE)
  await Promise.allSettled(
    [...new Set(urls.map((url) => url.href))].map((url) => cache.add(url)),
  )
}

async function cacheNavigation(path, response) {
  const cacheKey = new Request(new URL(path, self.location.origin))
  const cache = await caches.open(NAVIGATION_CACHE)
  await Promise.all([
    cache.put(cacheKey, response.clone()),
    cacheDocumentAssets(response.clone()),
  ])
}

async function precacheLogin() {
  const response = await fetch("/login", { cache: "reload" })
  if (!response.ok) throw new Error("Não foi possível preparar o shell offline.")
  await cacheNavigation("/login", response)
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      precacheLogin(),
      caches.open(ASSET_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
    ])
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("djon-pwa-") && ![NAVIGATION_CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ))
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
  const url = new URL(event.request.url)
  const portalPath = /^\/(login|recuperar-senha|redefinir-senha|session-bridge|dashboard)(\/|$)/
  if (
    event.request.mode === "navigate" &&
    url.origin === self.location.origin &&
    portalPath.test(url.pathname)
  ) {
    const cacheKey = new Request(`${url.origin}${url.pathname}`)
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: "reload" })
        if (response.ok && response.type === "basic") {
          await cacheNavigation(url.pathname, response.clone())
        }
        return response
      } catch (error) {
        const cached = await caches.match(cacheKey) || await caches.match("/login")
        if (cached) return cached
        throw error
      }
    })())
    return
  }

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || ["style", "script", "font", "image"].includes(event.request.destination))
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached
      const response = await fetch(event.request)
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(ASSET_CACHE)
        await cache.put(event.request, response.clone())
      }
      return response
    })())
  }
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
