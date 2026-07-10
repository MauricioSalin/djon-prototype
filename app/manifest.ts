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
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
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
      {
        src: "/icons/djon-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/djon-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/djon-screenshot.png",
        sizes: "1200x900",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/djon-screenshot2.png",
        sizes: "1200x900",
        type: "image/png",
      },
    ],
  }
}
