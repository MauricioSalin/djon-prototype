import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { LifestyleSection } from "@/components/lifestyle-section"
import { FlavorCarousel } from "@/components/flavor-carousel"
import { BentoGrid } from "@/components/bento-grid"
import { ActivationsSection } from "@/components/activations-section"
import { SocialSection } from "@/components/social-section"
import { Footer } from "@/components/footer"
import { LandingContentProvider } from "@/components/landing/landing-content-provider"
import { academyLocations } from "@/lib/locations"
import { homeDescription, homeTitle, siteName } from "@/lib/seo"
import { publicSiteOrigin } from "@/lib/site-urls"

const organizationId = `${publicSiteOrigin}/#organization`
const websiteId = `${publicSiteOrigin}/#website`
const webpageId = `${publicSiteOrigin}/#webpage`

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": organizationId,
      name: siteName,
      alternateName: "DJ ON",
      url: publicSiteOrigin,
      logo: `${publicSiteOrigin}/images/djon-verde.png`,
      description: homeDescription,
      foundingDate: "2018",
      email: "contato@djonacademy.com",
      telephone: "+55 51 99700-7846",
      sameAs: [
        "https://www.instagram.com/djonacademy",
        "https://www.facebook.com/djonacademy",
      ],
      address: [
        {
          "@type": "PostalAddress",
          streetAddress: "Rua General Vitorino, 77, Sala 504",
          addressLocality: "Porto Alegre",
          addressRegion: "RS",
          addressCountry: "BR",
        },
        {
          "@type": "PostalAddress",
          streetAddress: "Alameda Cap. Ernesto Nunes, 987",
          addressLocality: "Camboriú",
          addressRegion: "SC",
          addressCountry: "BR",
        },
      ],
      location: Object.values(academyLocations).map((location) => ({
        "@type": "Place",
        name: `${siteName} — ${location.label}`,
        address: location.address,
      })),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: publicSiteOrigin,
      name: siteName,
      inLanguage: "pt-BR",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: publicSiteOrigin,
      name: homeTitle,
      description: homeDescription,
      inLanguage: "pt-BR",
      isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
    },
  ],
}

export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
}

export default function Home() {
  return (
    <main className="landing-page min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingContentProvider>
        <Navigation />
        <HeroSection />
        <LifestyleSection />
        <FlavorCarousel />
        <BentoGrid />
        <ActivationsSection />
        <SocialSection />
        <Footer />
      </LandingContentProvider>
    </main>
  )
}
