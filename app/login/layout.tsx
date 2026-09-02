import type { Metadata } from "next"
import type { ReactNode } from "react"
import { socialImageAlt } from "@/lib/seo"
import { portalOrigin, publicSiteOrigin } from "@/lib/site-urls"

const title = "Acessar Portal | DJ ON"
const description =
  "Entre no portal da DJ ON Academy para acessar agenda, materiais, professores, eventos e sua jornada dentro da escola."
const socialImage = {
  url: `${publicSiteOrigin}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: socialImageAlt,
  type: "image/png",
}

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: `${portalOrigin}/login`,
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  openGraph: {
    title,
    description,
    url: `${portalOrigin}/login`,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
