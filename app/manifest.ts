import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DJ ON",
    short_name: "DJ ON",
    description: "Portal e proposta digital da DJ ON Academy.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121212",
    theme_color: "#121212",
    categories: ["education", "music", "entertainment"],
    icons: [
      {
        src: "/favicon.png",
        sizes: "150x150",
        type: "image/png",
      },
      {
        src: "/icons/djon-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icons/djon-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/djon-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/djon-screenshot2.png",
        sizes: "1280x577",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  }
}
