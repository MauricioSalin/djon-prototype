import type { MetadataRoute } from "next"
import { publicSiteOrigin } from "@/lib/site-urls"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: publicSiteOrigin,
      images: [
        `${publicSiteOrigin}/images/djon-hero.png`,
        `${publicSiteOrigin}/images/djon-course-dj.png`,
        `${publicSiteOrigin}/images/djon-course-producao.png`,
        `${publicSiteOrigin}/images/djon-course-marketing.png`,
      ],
    },
  ]
}
