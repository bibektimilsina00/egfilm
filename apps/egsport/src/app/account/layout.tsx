import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Account — EGSports',
    description: 'Manage your EGSports profile and password.',
    robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return children;
}
