import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionProvider from "@egfilm/auth/components/SessionProvider";
import { QueryProvider } from "@egfilm/realtime/client/QueryProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: {
        default: "EGLive — Live Sports Streaming",
        template: "%s | EGLive",
    },
    description:
        "Watch live football, basketball, UFC, MMA and more. Schedules, scores, standings — all in one place.",
    icons: {
        icon: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground antialiased">
                <SessionProvider>
                    <QueryProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navigation />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                        <ToastContainer
                            position="bottom-right"
                            autoClose={3500}
                            theme="dark"
                            newestOnTop
                            limit={5}
                        />
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
