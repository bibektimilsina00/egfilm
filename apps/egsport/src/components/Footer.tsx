import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Instagram, Twitter, Mail, BookOpen, Activity, Trophy, CalendarDays, Film, Tv, ListVideo } from 'lucide-react';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.egfilm.xyz';
const EGFILM_URL = process.env.NEXT_PUBLIC_EGFILM_URL || 'https://egfilm.xyz';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/icon.svg"
                                alt="EG"
                                width={32}
                                height={32}
                                className="h-10 w-auto block group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="text-white font-black text-2xl tracking-tight uppercase leading-none mt-3 mb-0 pb-0 self-end">
                                SPORTS
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Live sports streaming — football, basketball, UFC, MMA. Schedules, scores, standings.
                        </p>
                        <div className="flex gap-3">
                            <SocialLink href="https://instagram.com/egfilm" icon={Instagram} label="Instagram" />
                            <SocialLink href="https://twitter.com/egfilm" icon={Twitter} label="Twitter" />
                            <SocialLink href="mailto:contact@egfilm.xyz" icon={Mail} label="Email" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Browse</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/sports" icon={Activity} text="Sports" />
                            <FooterLink href="/schedule" icon={CalendarDays} text="Schedule" />
                            <FooterLink href="/leagues" icon={Trophy} text="Leagues" />
                            <FooterLink href="/watchlist" icon={ListVideo} text="Watchlist" />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">EGFilm Network</h3>
                        <ul className="space-y-3">
                            <FooterLink href={`${EGFILM_URL}/movies`} icon={Film} text="Movies" external />
                            <FooterLink href={`${EGFILM_URL}/tv`} icon={Tv} text="TV Shows" external />
                            <FooterLink href={BLOG_URL} icon={BookOpen} text="Blog" external />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">About</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            One account across EGFilm and EGSports. Stream data via sportsrc.org.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
                    &copy; {year} EGFilm Network. EGSports is part of the EGFilm family.
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-blue-400 transition-all"
        >
            <Icon className="w-4 h-4" />
        </a>
    );
}

function FooterLink({ href, icon: Icon, text, external }: { href: string; icon: React.ComponentType<{ className?: string }>; text: string; external?: boolean }) {
    const className = 'flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors';
    if (external) {
        return (
            <li>
                <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                    <Icon className="w-4 h-4" /> {text}
                </a>
            </li>
        );
    }
    return (
        <li>
            <Link href={href} className={className}>
                <Icon className="w-4 h-4" /> {text}
            </Link>
        </li>
    );
}
