import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ServiceWorker from "@/components/ServiceWorker";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { siteConfig, seoKeywords } from "@/lib/seo";
import { seoConfig, generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seoConfig";

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
  ...seoConfig.generateMetadata({
    title: 'Watch Movies & TV Shows Online Free - Stream HD Content',
    description: 'Discover and watch thousands of movies and TV shows online for free. Stream HD content, get detailed information, ratings, and reviews. No registration required.',
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
      "no registration required",
      "movie database",
      "tv show database",
      "stream movies online",
      "free streaming platform",
      "entertainment hub"
    ],
    canonicalUrl: siteConfig.url,
  }),
  metadataBase: new URL(siteConfig.url),
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
          url: `${siteConfig.url}/egfilm.png`,
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

  // Enhanced structured data
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema(siteConfig.url);

  return (
    <html lang="en" data-scroll-behavior="smooth" className="dark">
      <head>
        {/* Enhanced Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Enhanced Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* RSS Feed Discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Egfilm Blog RSS Feed"
          href="https://blog.egfilm.xyz/blog/rss.xml"
        />

        {/* Sitemap Reference */}
        <link rel="sitemap" type="application/xml" href="/sitemap-index.xml" />
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