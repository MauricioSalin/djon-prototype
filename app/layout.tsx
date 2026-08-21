import type React from "react"
import type { Metadata, Viewport } from "next"
import { Barlow_Condensed, Bowlby_One_SC, Raleway } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LenisProvider } from "@/components/lenis-provider"
import ClickSpark from "@/components/click-spark"
import { PWARegister } from "@/components/pwa-register"
import { PageTitleManager } from "@/components/page-title-manager"
import { AppToaster } from "@/components/app-toaster"
import { ConfirmationProvider } from "@/components/confirmation-provider"
import "./globals.css"

const raleway = Raleway({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-raleway",
  display: "swap",
})

const bowlbyOneSc = Bowlby_One_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bowlby-one-sc",
  display: "swap",
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  display: "swap",
})

const siteName = "DJ ON"
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://djonacademy.com")
const defaultTitle = "DJ ON Academy | Música, palco e performance"
const defaultDescription =
  "A DJ ON Academy é a fronteira entre o sonho e a realização. Aprenda DJ, produção musical e performance com uma comunidade feita para transformar sonho em palco."
const defaultImage = "/images/djon-hero.png"

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  manifest: "/manifest.webmanifest",
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "curso de DJ",
    "produção musical",
    "DJ Academy",
    "DJ ON",
    "Porto Alegre",
    "Camboriú",
    "Ableton Live",
    "Rekordbox",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/djon-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/djon-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "DJ ON",
    statusBarStyle: "black",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: "DJ ON Academy - Curso de DJ e Produção Musical",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultImage],
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121212",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`bg-djon-page ${raleway.variable} ${bowlbyOneSc.variable} ${barlowCondensed.variable}`}>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <title>DJ ON</title>
        <meta name="application-name" content="DJ ON" />
        <meta name="apple-mobile-web-app-title" content="DJ ON" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#121212" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="bg-djon-page font-sans text-djon-text antialiased">
        <ClickSpark
          sparkColor="var(--djon-color-accent)"
          sparkSize={12}
          sparkRadius={20}
          sparkCount={8}
          duration={400}
          easing="ease-out"
        >
          <ConfirmationProvider>
            <LenisProvider>{children}</LenisProvider>
          </ConfirmationProvider>
        </ClickSpark>
        <PageTitleManager />
        <PWARegister />
        <AppToaster />
        <Analytics />
      </body>
    </html>
  )
}
