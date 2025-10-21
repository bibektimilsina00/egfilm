import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { UmamiTracker } from "@/components/UmamiTracker";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ServiceWorker from "@/components/ServiceWorker";
import { QueryProvider } from "@/lib/providers/QueryProvider";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'),
  title: {
    default: "Egfilm - Discover Movies & TV Shows",
    template: "%s | Egfilm"
  },
  description: "Browse and discover the latest movies and TV shows. Watch trailers, manage your watchlist, and enjoy streaming content with friends. Find your next favorite show today.",
  keywords: [
    "free movies",
    "watch movies online free",
    "free TV shows",
    "web series",
    "watch together",
    "group watch",
    "free streaming",
    "watchlist",
    "trailers",
    "entertainment",
    "movie database",
    "no signup"
  ],
  authors: [{ name: "Egfilm Team" }],
  creator: "Egfilm",
  publisher: "Egfilm",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "entertainment",
  classification: "Entertainment & Streaming",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Egfilm — Watch Movies & TV Shows Online Free",
    description: "Egfilm offers free movies, TV shows and web series. Invite friends to 'Watch Together' (group audio/video), create watchlists, and stream instantly — no signup required.",
    siteName: "Egfilm",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Egfilm — Free Movies, TV Shows & Watch Together",
      },
    ],
    videos: [],
  },
  twitter: {
    card: "summary_large_image",
    title: "Egfilm — Free Movies & Watch Together",
    description: "Free streaming of movies, web series and TV shows. Watch together with friends via audio/video calls. No signup needed.",
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

  const siteJsonLD = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Egfilm',
    url: baseUrl,
    description: 'Egfilm - Watch movies, TV shows and web series online for free. Use Watch Together to invite friends and enjoy group audio/video streaming.',
    publisher: {
      '@type': 'Organization',
      name: 'Egfilm',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.jpg`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  })

  return (
    <html lang="en">
      <head>
        <UmamiTracker />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLD }} />
        <link rel="manifest" href="/manifest.json" />
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