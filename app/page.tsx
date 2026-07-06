import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { LifestyleSection } from "@/components/lifestyle-section"
import { FlavorCarousel } from "@/components/flavor-carousel"
import { BentoGrid } from "@/components/bento-grid"
import { ActivationsSection } from "@/components/activations-section"
import { SocialSection } from "@/components/social-section"
import { Footer } from "@/components/footer"

const title = "DJ ON Academy | Curso de DJ e Produção Musical"
const description =
  "Aprenda a ser DJ ou produtor musical com a DJ ON Academy. Formação, produção musical, mentoria e eventos reais para transformar seu sonho em palco."
const image = "/images/djon-hero.png"

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "DJ ON Academy - A fronteira entre o sonho e a realização",
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

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <LifestyleSection />
      <FlavorCarousel />
      <BentoGrid />
      <ActivationsSection />
      <SocialSection />
      <Footer />
    </main>
  )
}
