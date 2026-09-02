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
import { publicSiteOrigin } from "@/lib/site-urls"
import { homeDescription, homeTitle, siteName } from "@/lib/seo"
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

const siteUrl = new URL(publicSiteOrigin)
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  manifest: "/manifest.webmanifest",
  title: {
    default: homeTitle,
    template: `%s | ${siteName}`,
  },
  description: homeDescription,
  authors: [{ name: siteName, url: "/" }],
  creator: siteName,
  publisher: siteName,
  category: "education",
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
    title: homeTitle,
    description: homeDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
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
