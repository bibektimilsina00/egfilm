import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Sign In',
    description: 'Sign in to EGSports to save matches, host watch-together rooms and chat with friends.',
    path: '/login',
    keywords: ['EGSports sign in', 'EGSports login'],
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
