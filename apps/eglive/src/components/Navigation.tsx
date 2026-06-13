'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Activity, Menu, X, Search, ListVideo, Trophy, CalendarDays, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@egfilm/ui/components/ui/button';
import { cn } from '@egfilm/ui/lib/utils';

const navItems = [
    { href: '/sports', label: 'Sports', icon: Activity },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/leagues', label: 'Leagues', icon: Trophy },
    { href: '/watchlist', label: 'Watchlist', icon: ListVideo },
];

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                    <span className="rounded-md bg-gradient-to-tr from-orange-500 to-red-600 px-2 py-1 text-white">EG</span>
                    <span>Live</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (pathname?.startsWith(href + '/') ?? false);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search matches, teams, leagues..."
                            className="h-9 w-72 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                </form>

                <div className="ml-auto md:ml-0 flex items-center gap-2">
                    {status === 'authenticated' && session?.user ? (
                        <div className="hidden md:flex items-center gap-2">
                            <Link href="/watchlist" className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                {session.user.name ?? session.user.email}
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                                <LogOut className="h-4 w-4 mr-1" /> Sign out
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login" className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <LogIn className="h-4 w-4" /> Sign in
                        </Link>
                    )}

                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {open ? (
                <div className="md:hidden border-t border-border/40 bg-background">
                    <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
                        {navItems.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                                <Icon className="h-4 w-4" /> {label}
                            </Link>
                        ))}
                        <form onSubmit={onSearch} className="mt-2">
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </form>
                        {status === 'authenticated' ? (
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => signOut({ callbackUrl: '/' })}>
                                Sign out
                            </Button>
                        ) : (
                            <Link href="/login" className="mt-2 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            ) : null}
        </header>
    );
}
