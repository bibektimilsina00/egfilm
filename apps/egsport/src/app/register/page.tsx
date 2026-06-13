'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? 'Registration failed.');
            setPending(false);
            return;
        }
        await signIn('credentials', { email, password, redirect: false });
        setPending(false);
        router.push('/');
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/15 blur-3xl" />
                <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                <FloatingEmoji emoji="⚽" className="left-[6%] top-[18%] text-5xl" delay="0s" />
                <FloatingEmoji emoji="🏀" className="right-[8%] top-[22%] text-4xl" delay="1.4s" />
                <FloatingEmoji emoji="🥊" className="left-[10%] bottom-[18%] text-4xl" delay="2.6s" />
                <FloatingEmoji emoji="🏈" className="right-[12%] bottom-[14%] text-5xl" delay="0.8s" />
                <FloatingEmoji emoji="🎾" className="left-[42%] top-[8%] text-3xl" delay="2s" />
                <FloatingEmoji emoji="🏆" className="right-[40%] bottom-[6%] text-3xl" delay="3.2s" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/40 via-indigo-500/20 to-transparent blur-sm" aria-hidden />

                <div className="relative rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10 p-7 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="flex items-center gap-2">
                            <Image src="/icon.svg" alt="EG" width={36} height={36} className="h-9 w-auto" priority />
                            <span className="text-white font-black text-2xl tracking-tight uppercase leading-none mt-1.5">SPORT</span>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
                            <p className="text-sm text-gray-400">
                                One login works on EGFilm + EGSport.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3">
                        <Field
                            icon={User}
                            type="text"
                            placeholder="Display name"
                            value={name}
                            onChange={setName}
                            autoComplete="name"
                            disabled={pending}
                        />
                        <Field
                            icon={Mail}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={setEmail}
                            autoComplete="email"
                            disabled={pending}
                        />
                        <Field
                            icon={Lock}
                            type={showPw ? 'text' : 'password'}
                            placeholder="Password (min 8 chars)"
                            value={password}
                            onChange={setPassword}
                            autoComplete="new-password"
                            minLength={8}
                            disabled={pending}
                            trailing={
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                    tabIndex={-1}
                                >
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />

                        {error ? (
                            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={pending || !name || !email || password.length < 8}
                            className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            <span>{pending ? 'Creating…' : 'Create account'}</span>
                            {!pending ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
                        </button>
                    </form>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>We hash your password with bcrypt. No tracking, no spam.</span>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float-emoji {
                    0% { transform: translateY(0px) rotate(-4deg); opacity: 0.45; }
                    50% { transform: translateY(-14px) rotate(4deg); opacity: 0.7; }
                    100% { transform: translateY(0px) rotate(-4deg); opacity: 0.45; }
                }
            `}</style>
        </div>
    );
}

function Field({
    icon: Icon,
    type,
    placeholder,
    value,
    onChange,
    autoComplete,
    disabled,
    minLength,
    trailing,
}: {
    icon: React.ComponentType<{ className?: string }>;
    type: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    disabled?: boolean;
    minLength?: number;
    trailing?: React.ReactNode;
}) {
    return (
        <label className="group relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-blue-400">
                <Icon className="h-4 w-4" />
            </span>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                minLength={minLength}
                required
                disabled={disabled}
                className="block w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-9 pr-10 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            />
            {trailing ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>
            ) : null}
        </label>
    );
}

function FloatingEmoji({
    emoji,
    className,
    delay,
}: {
    emoji: string;
    className: string;
    delay: string;
}) {
    return (
        <span
            className={`absolute select-none ${className}`}
            style={{
                animation: 'float-emoji 6s ease-in-out infinite',
                animationDelay: delay,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))',
            }}
            aria-hidden
        >
            {emoji}
        </span>
    );
}
