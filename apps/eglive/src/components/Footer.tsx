import Link from 'next/link';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-border/40 bg-background/50">
            <div className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
                <div>
                    <h3 className="mb-2 font-semibold">EGLive</h3>
                    <p className="text-muted-foreground">
                        Live streams, schedules, standings and scores across major sports.
                    </p>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold">Browse</h3>
                    <ul className="space-y-1 text-muted-foreground">
                        <li><Link href="/sports" className="hover:text-foreground">Sports</Link></li>
                        <li><Link href="/schedule" className="hover:text-foreground">Schedule</Link></li>
                        <li><Link href="/leagues" className="hover:text-foreground">Leagues</Link></li>
                        <li><Link href="/watchlist" className="hover:text-foreground">Watchlist</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold">Account</h3>
                    <ul className="space-y-1 text-muted-foreground">
                        <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
                        <li><Link href="/register" className="hover:text-foreground">Create account</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
                &copy; {year} EGLive. Stream data via sportsrc.org.
            </div>
        </footer>
    );
}
