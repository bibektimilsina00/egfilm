import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { UmamiTracker } from "@/components/UmamiTracker";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ServiceWorker from "@/components/ServiceWorker";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { siteConfig, seoKeywords } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Watch Movies & TV Shows Online Free`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: [
    ...seoKeywords.primary,
    ...seoKeywords.secondary,
    ...seoKeywords.genres,
    "watch together",
    "group watch",
    "watchlist",
    "hd streaming free",
    "no ads free movies",
    "unlimited streaming",
    "no registration required"
  ],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "entertainment",
  classification: "Free Movie & TV Streaming Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — Watch Movies & TV Shows Online Free`,
    description: "Stream unlimited movies and TV shows for free. No subscription, no payment required. Watch HD quality content, create watchlists, and enjoy Watch Together with friends.",
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Free Movie & TV Streaming Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Stream Movies & TV Shows Free`,
    description: "Watch unlimited movies and TV shows online free. No subscription required. HD quality streaming with Watch Together feature.",
    images: ["/og-image.jpg"],
    creator: "@egfilm",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enhanced structured data combining website and organization schemas
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          '@id': `${siteConfig.url}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.publisher,
        url: siteConfig.url,
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}/logo.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          siteConfig.links.twitter,
          siteConfig.links.github,
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
        },
      },
    ],
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className="dark">
      <head>
        <UmamiTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            <PerformanceMonitor />
            <ServiceWorker />
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}