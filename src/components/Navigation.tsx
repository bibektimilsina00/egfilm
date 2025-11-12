'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Film, Search, Menu, X, Home, Tv, Heart, LogIn, LogOut, User, ChevronDown, BookOpen } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { searchMulti } from '@/lib/tmdb';

export default function Navigation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestDebounceRef = useRef<number | undefined>(undefined);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    // Autosuggest: debounced as user types
    useEffect(() => {
        // Clear previous debounce
        if (suggestDebounceRef.current) {
            window.clearTimeout(suggestDebounceRef.current);
        }

        if (!searchQuery || searchQuery.trim().length < 2) {
            setSuggestions([]);
            setSuggestLoading(false);
            return;
        }

        setSuggestLoading(true);
        // debounce 300ms
        suggestDebounceRef.current = window.setTimeout(async () => {
            try {
                const res = await searchMulti(searchQuery.trim(), 1);
                const items = (res.results || []).filter((it: any) => it.media_type === 'movie' || it.media_type === 'tv');
                // Map to simplified suggestion items and dedupe by id
                const uniques: any[] = [];
                const seen = new Set();
                for (const it of items) {
                    const title = it.media_type === 'movie' ? it.title : it.name;
                    const key = `${it.media_type}-${it.id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniques.push({ id: it.id, media_type: it.media_type, title, poster_path: it.poster_path });
                    }
                    if (uniques.length >= 6) break; // limit suggestions to 6 for navbar
                }
                setSuggestions(uniques);
            } catch (err) {
                console.error('Autosuggest error:', err);
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        }, 300);

        return () => {
            if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
        };
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSuggestions([]);
            setMobileMenuOpen(false);
        }
    };

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/movies', label: 'Movies', icon: Film },
        { href: '/tv', label: 'TV Shows', icon: Tv },
        { href: process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.egfilm.xyz', label: 'Blog', icon: BookOpen, external: true },
        { href: '/watchlist', label: 'Watchlist', icon: Heart },
    ];

    return (
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group shrink-0 ml-2">
                        <div className="relative flex items-center">
                            <Image
                                src="/logo.svg"
                                alt="Egfilm"
                                width={48}
                                height={48}
                                className="h-8 w-auto group-hover:scale-105 transition-all duration-300"
                                priority
                            />
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
                        </div>
                    </Link>

                    {/* Desktop Navigation - Compact */}
                    <nav className="hidden lg:flex items-center gap-4">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && pathname === link.href && !link.external;

                            if (link.external) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm text-gray-300 hover:text-blue-400 hover:bg-gray-800/50"
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
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${isActive
                                        ? 'text-blue-400 bg-blue-500/10'
                                        : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden xl:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side - Search & Auth */}
                    <div className="flex items-center gap-2">
                        {/* Search Bar - Wider with Auto-suggestions */}
                        <form onSubmit={handleSearch} className="relative hidden md:block" autoComplete="off">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setHighlighted(-1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.max(h - 1, 0));
                                    } else if (e.key === 'Enter') {
                                        if (highlighted >= 0 && suggestions[highlighted]) {
                                            e.preventDefault();
                                            const sel = suggestions[highlighted];
                                            router.push(`/search?q=${encodeURIComponent(sel.title)}`);
                                            setSuggestions([]);
                                            setSearchQuery('');
                                        }
                                    } else if (e.key === 'Escape') {
                                        setSuggestions([]);
                                    }
                                }}
                                onBlur={() => {
                                    // Delay to allow click on suggestion
                                    setTimeout(() => setSuggestions([]), 200);
                                }}
                                placeholder="Search movies, TV shows..."
                                className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all w-48 lg:w-64 xl:w-72 text-sm placeholder:text-gray-500"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                            >
                                <Search className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                            </button>

                            {/* Suggestions dropdown */}
                            {suggestions.length > 0 && (
                                <ul
                                    role="listbox"
                                    className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-auto"
                                >
                                    {suggestions.map((sugg, idx) => (
                                        <li
                                            key={`${sugg.media_type}-${sugg.id}`}
                                            role="option"
                                            aria-selected={highlighted === idx}
                                            onMouseDown={(e) => {
                                                // onMouseDown to prevent blur before click
                                                e.preventDefault();
                                                router.push(`/search?q=${encodeURIComponent(sugg.title)}`);
                                                setSuggestions([]);
                                                setSearchQuery('');
                                            }}
                                            onMouseEnter={() => setHighlighted(idx)}
                                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors ${highlighted === idx ? 'bg-gray-800' : ''}`}
                                        >
                                            <img
                                                src={sugg.poster_path ? `https://image.tmdb.org/t/p/w92${sugg.poster_path}` : '/placeholder-movie.jpg'}
                                                alt={sugg.title}
                                                className="w-8 h-12 object-cover rounded-md shrink-0"
                                            />
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="text-white text-sm font-medium truncate">{sugg.title}</div>
                                                <div className="text-gray-400 text-xs">{sugg.media_type === 'movie' ? 'Movie' : 'TV Show'}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </form>

                        {/* Auth Section - Compact with Dropdown */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Notification Bell */}
                            <NotificationBell />

                            <div className="relative" ref={userMenuRef}>
                                {session ? (
                                    <>
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-all"
                                        >
                                            <User className="w-4 h-4 text-gray-300" />
                                            <span className="text-sm text-gray-300 max-w-[100px] truncate">{session.user?.name}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* User Dropdown Menu */}
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-800">
                                                    <p className="text-sm text-gray-400">Signed in as</p>
                                                    <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        signOut();
                                                        setUserMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800/50 transition-all"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all text-sm"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-white hover:text-blue-400 transition-colors p-2"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-gray-800 animate-in slide-in-from-top">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative my-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <Search className="w-5 h-5 text-gray-400" />
                            </button>
                        </form>

                        {/* Mobile Nav Links */}
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = mounted && pathname === link.href && !link.external;

                                if (link.external) {
                                    return (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:text-blue-400 hover:bg-gray-800/50"
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'text-blue-400 bg-blue-500/10'
                                            : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Mobile Auth Links */}
                            <div className="mt-2 pt-2 border-t border-gray-800">
                                {session ? (
                                    <>
                                        <div className="flex items-center gap-3 px-4 py-3 text-gray-300 bg-gray-800/30 rounded-lg mb-2">
                                            <User className="w-5 h-5" />
                                            <div>
                                                <p className="text-sm font-medium">{session.user?.name}</p>
                                                <p className="text-xs text-gray-500">{session.user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                signOut();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800/50 transition-all"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
