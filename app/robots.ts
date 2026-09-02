import type { MetadataRoute } from "next"
import { publicSiteOrigin } from "@/lib/site-urls"

const privatePaths = [
  "/brand",
  "/dashboard",
  "/login",
  "/recuperar-senha",
  "/redefinir-senha",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${publicSiteOrigin}/sitemap.xml`,
    host: publicSiteOrigin,
  }
}
