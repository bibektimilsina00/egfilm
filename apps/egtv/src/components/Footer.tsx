import Link from 'next/link';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-border/40 bg-background/50">
            <div className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
                <div>
                    <h3 className="mb-2 font-semibold">EGTV</h3>
                    <p className="text-muted-foreground">
                        Free live TV channels from around the world — news, sports, movies, music and more.
                    </p>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold">Browse</h3>
                    <ul className="space-y-1 text-muted-foreground">
                        <li><Link href="/browse" className="hover:text-foreground">All channels</Link></li>
                        <li><Link href="/favorites" className="hover:text-foreground">Favorites</Link></li>
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
                &copy; {year} EGTV. Channel data via the iptv-org project.
            </div>
        </footer>
    );
}
