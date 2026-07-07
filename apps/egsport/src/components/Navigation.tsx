'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Activity,
    Trophy,
    Users,
    Shield,
    CalendarDays,
    ListVideo,
    BookOpen,
    Film,
    Search,
    Menu,
    X,
    LogIn,
    LogOut,
    Loader2,
    Tv,
    LifeBuoy,
    Settings,
} from 'lucide-react';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.egfilm.xyz';
const EGFILM_URL = process.env.NEXT_PUBLIC_EGFILM_URL || 'https://egfilm.xyz';
const EGTV_URL = process.env.NEXT_PUBLIC_EGTV_URL || 'https://tv.egfilm.xyz';

interface NavLink {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
}

export default function Navigation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [userMenuOpen]);

    const navLinks = useMemo<NavLink[]>(() => [
        { href: '/sports', label: 'Sports', icon: Activity },
        { href: '/schedule', label: 'Schedule', icon: CalendarDays },
        { href: '/leagues', label: 'Leagues', icon: Trophy },
        { href: '/players', label: 'Players', icon: Users },
        { href: '/teams', label: 'Teams', icon: Shield },
        { href: '/watchlist', label: 'Watchlist', icon: ListVideo },
        { href: EGFILM_URL, label: 'Movies & TV', icon: Film, external: true },
        { href: BLOG_URL, label: 'Blog', icon: BookOpen, external: true },
    ], []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleSignOut = useCallback(async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
        } finally {
            setIsSigningOut(false);
        }
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 pt-0.5 pb-2">
                <div className="flex items-end justify-between gap-3">
                    <Link href="/" className="flex items-end gap-2 group shrink-0 mb-2">
                        <Image
                            src="/icon.svg"
                            alt="EG"
                            width={32}
                            height={32}
                            className="h-8 w-auto block group-hover:scale-105 transition-transform duration-300"
                            priority
                        />
                        <span className="text-white font-black text-xl tracking-tight uppercase leading-none mt-2 mb-0 pb-0 self-end">
                            SPORTS
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-end gap-4">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && !link.external && pathname === link.href;
                            const baseClass = 'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm whitespace-nowrap';
                            if (link.external) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={baseClass + ' text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden xl:inline">{link.label}</span>
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${baseClass} ${isActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden xl:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-end gap-2">
                        <form onSubmit={handleSearch} className="relative hidden md:block">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search matches, teams, leagues..."
                                className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all w-48 lg:w-64 xl:w-72 text-sm placeholder:text-gray-500"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform" aria-label="Search">
                                <Search className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                            </button>
                        </form>

                        <div className="hidden md:flex items-center gap-2">
                            <div className="relative" ref={userMenuRef}>
                                {session ? (
                                    <>
                                        <button
                                            onClick={() => setUserMenuOpen((v) => !v)}
                                            aria-label="Open user menu"
                                            aria-haspopup="menu"
                                            aria-expanded={userMenuOpen}
                                            className="relative h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-gray-800 hover:ring-blue-500/40 transition-all flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-blue-500/60"
                                        >
                                            <span className="text-sm font-semibold text-white select-none">
                                                {((session.user?.name || session.user?.email || 'U').trim().charAt(0) || 'U').toUpperCase()}
                                            </span>
                                        </button>
                                        {userMenuOpen && (
                                            <div
                                                role="menu"
                                                className="absolute right-0 mt-3 w-72 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto"
                                            >
                                                {/* Header card */}
                                                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-800/60">
                                                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0 ring-2 ring-blue-500/20">
                                                        <span className="text-base font-bold text-white select-none">
                                                            {((session.user?.name || session.user?.email || 'U').trim().charAt(0) || 'U').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-semibold truncate">{session.user?.name ?? 'Account'}</p>
                                                        <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                                                    </div>
                                                </div>

                                                {/* My Library */}
                                                <MenuSection label="My Library">
                                                    <MenuLink href="/watchlist" icon={ListVideo} label="Watchlist" onSelect={() => setUserMenuOpen(false)} />
                                                    <MenuLink href="/schedule" icon={CalendarDays} label="Schedule" onSelect={() => setUserMenuOpen(false)} />
                                                    <MenuLink href="/leagues" icon={Trophy} label="Leagues" onSelect={() => setUserMenuOpen(false)} />
                                                </MenuSection>

                                                {/* Account */}
                                                <MenuSection label="Account">
                                                    <MenuLink href="/account" icon={Settings} label="Profile & Password" onSelect={() => setUserMenuOpen(false)} />
                                                </MenuSection>

                                                {/* Sister apps */}
                                                <MenuSection label="More from EGFilm">
                                                    <MenuExternal href={EGFILM_URL} icon={Film} label="Movies & TV" sub="EGFilm" />
                                                    <MenuExternal href={EGTV_URL} icon={Tv} label="Live TV" sub="EGTV" />
                                                    <MenuExternal href={BLOG_URL} icon={BookOpen} label="Blog" />
                                                </MenuSection>

                                                {/* Support */}
                                                <MenuSection label="Support">
                                                    <MenuExternal href="mailto:support@khareedlow.com" icon={LifeBuoy} label="Help & Feedback" />
                                                </MenuSection>

                                                {/* Sign out */}
                                                <div className="border-t border-gray-800/60 mt-1 pt-1">
                                                    <button
                                                        onClick={handleSignOut}
                                                        disabled={isSigningOut}
                                                        role="menuitem"
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                        <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
                                                    </button>
                                                </div>

                                                <p className="px-4 pt-2 pb-1 text-[10px] text-gray-600 text-center">
                                                    EGSports · v{process.env.NEXT_PUBLIC_BUILD_VERSION?.slice(0, 12) || 'dev'}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all text-sm whitespace-nowrap"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen((v) => !v)}
                            className="lg:hidden text-white hover:text-blue-400 transition-colors p-2"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden mt-3 pb-3 border-t border-gray-800 pt-3 space-y-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && !link.external && pathname === link.href;
                            const linkClass = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'}`;
                            if (link.external) {
                                return (
                                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                                        <Icon className="w-4 h-4" /> {link.label}
                                    </a>
                                );
                            }
                            return (
                                <Link key={link.href} href={link.href} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                                    <Icon className="w-4 h-4" /> {link.label}
                                </Link>
                            );
                        })}
                        <form onSubmit={handleSearch} className="pt-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-gray-800/50 text-white px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm placeholder:text-gray-500"
                            />
                        </form>
                        <div className="pt-2">
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-all disabled:opacity-50"
                                >
                                    {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    Sign Out
                                </button>
                            ) : (
                                <Link href="/login" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    <LogIn className="w-4 h-4" /> Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="py-1">
            <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
            <div className="mt-0.5">{children}</div>
        </div>
    );
}

function MenuLink({
    href,
    icon: Icon,
    label,
    sub,
    onSelect,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub?: string;
    onSelect?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onSelect}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/60 transition-colors"
        >
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {sub ? <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sub}</span> : null}
        </Link>
    );
}

function MenuExternal({
    href,
    icon: Icon,
    label,
    sub,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub?: string;
}) {
    return (
        <a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/60 transition-colors"
        >
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {sub ? <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sub}</span> : null}
        </a>
    );
}
