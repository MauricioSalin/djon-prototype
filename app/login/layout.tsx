import type { Metadata } from "next"
import type { ReactNode } from "react"

const title = "Acessar Portal | DJ ON Academy"
const description =
  "Entre no portal da DJ ON Academy para acessar agenda, materiais, professores, eventos e sua jornada dentro da escola."
const image = "/images/djon-hero.png"

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title,
    description,
    url: "/login",
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "Portal DJ ON Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
