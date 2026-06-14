import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Create Account',
    description: 'Create a free EGSports account to host watch-together rooms, save matches and never miss a fixture.',
    path: '/register',
    keywords: ['EGSports register', 'create EGSports account', 'free sports account'],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
